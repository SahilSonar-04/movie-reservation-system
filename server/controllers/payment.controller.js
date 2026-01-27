import stripe from "../config/stripe.config.js";
import Booking from "../models/booking.model.js";
import Seat from "../models/seat.model.js";
import Show from "../models/show.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { LOCK_TIME_MS } from "../config/lock.config.js";
import { withTransaction } from "../utils/transaction.utils.js";

// Create payment intent
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { seatIds, showId } = req.body;
  const userId = req.user._id;
  const now = new Date();

  if (!seatIds || seatIds.length === 0) {
    return res.status(400).json({ message: "No seats provided" });
  }

  // Verify show exists and is in the future
  const show = await Show.findById(showId).populate("movie theater");
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  if (new Date(show.startTime) <= now) {
    return res.status(400).json({ message: "Cannot book seats for past shows" });
  }

  // Fetch and validate seats
  const seats = await Seat.find({ _id: { $in: seatIds } });

  if (seats.length !== seatIds.length) {
    return res.status(400).json({ message: "Some seats not found" });
  }

  // Validate each seat
  for (const seat of seats) {
    if (seat.show.toString() !== showId.toString()) {
      return res.status(400).json({ 
        message: `Seat ${seat.seatNumber} belongs to a different show` 
      });
    }

    if (
      seat.status !== "LOCKED" ||
      !seat.lockedAt ||
      seat.lockedBy.toString() !== userId.toString() ||
      now - seat.lockedAt > LOCK_TIME_MS
    ) {
      return res.status(400).json({ 
        message: `Seat ${seat.seatNumber} is not locked by you or lock has expired` 
      });
    }
  }

  // Calculate amount
  const totalAmount = seats.length * show.price;
  const amountInPaise = Math.round(totalAmount * 100); // Convert to paise (₹1 = 100 paise)

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPaise,
    currency: "inr",
    metadata: {
      userId: userId.toString(),
      showId: showId.toString(),
      seatIds: JSON.stringify(seatIds),
      movieTitle: show.movie.title,
      theaterName: show.theater.name,
      seatCount: seats.length,
    },
    description: `Booking for ${show.movie.title} at ${show.theater.name}`,
  });

  res.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: totalAmount,
  });
});

// Confirm booking after successful payment
export const confirmBookingAfterPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  const userId = req.user._id;
  const now = new Date();

  if (!paymentIntentId) {
    return res.status(400).json({ message: "Payment intent ID is required" });
  }

  // Retrieve payment intent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  // Verify payment was successful
  if (paymentIntent.status !== "succeeded") {
    return res.status(400).json({ 
      message: "Payment not completed. Please try again." 
    });
  }

  // Extract booking details from metadata
  const { showId, seatIds: seatIdsJson } = paymentIntent.metadata;
  const seatIds = JSON.parse(seatIdsJson);
  const totalAmount = paymentIntent.amount / 100; // Convert back from paise

  // Verify user matches
  if (paymentIntent.metadata.userId !== userId.toString()) {
    return res.status(403).json({ message: "Unauthorized payment confirmation" });
  }

  // Use transaction for atomic booking
  const booking = await withTransaction(async (session) => {
    // Fetch and validate seats again
    const seats = await Seat.find({ _id: { $in: seatIds } }).session(session);

    if (seats.length !== seatIds.length) {
      throw new Error("Some seats not found");
    }

    // Validate each seat is still locked by this user
    for (const seat of seats) {
      if (
        seat.status !== "LOCKED" ||
        !seat.lockedAt ||
        seat.lockedBy.toString() !== userId.toString() ||
        now - seat.lockedAt > LOCK_TIME_MS
      ) {
        throw new Error(`Seat ${seat.seatNumber} is no longer available`);
      }
    }

    // Atomically convert LOCKED → BOOKED
    const updateResult = await Seat.updateMany(
      {
        _id: { $in: seatIds },
        status: "LOCKED",
        lockedBy: userId,
        lockedAt: { $gte: new Date(Date.now() - LOCK_TIME_MS) },
      },
      {
        $set: {
          status: "BOOKED",
        },
        $unset: {
          lockedAt: "",
          lockedBy: "",
        },
      },
      { session }
    );

    if (updateResult.modifiedCount !== seatIds.length) {
      throw new Error("One or more seats were booked by another user");
    }

    // Create booking with payment info
    const newBooking = await Booking.create(
      [
        {
          user: userId,
          show: showId,
          seats: seatIds,
          totalAmount,
          status: "CONFIRMED",
          paymentIntentId: paymentIntentId,
          paymentStatus: "PAID",
        },
      ],
      { session }
    );

    return newBooking[0];
  });

  // Populate before sending response
  await booking.populate([
    {
      path: "show",
      populate: { path: "movie theater" },
    },
    { path: "seats" },
  ]);

  res.status(201).json({
    message: "Booking confirmed successfully",
    booking,
  });
});

// Webhook to handle Stripe events (for production)
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log(`Payment succeeded: ${paymentIntent.id}`);
      // You can add additional logic here if needed
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log(`Payment failed: ${failedPayment.id}`);
      // Handle failed payment (e.g., send notification)
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});