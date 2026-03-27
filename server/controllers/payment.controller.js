import stripe from "../config/stripe.config.js";
import Booking from "../models/booking.model.js";
import Seat from "../models/seat.model.js";
import Show from "../models/show.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { LOCK_TIME_MS } from "../config/lock.config.js";
import { withTransaction } from "../utils/transaction.utils.js";
import { sendBookingConfirmationEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";

// Create payment intent
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { seatIds, showId } = req.body;
  const userId = req.user._id;
  const now = new Date();

  if (!seatIds || seatIds.length === 0) throw new ApiError(400, "No seats provided");

  const show = await Show.findById(showId).populate("movie theater");
  if (!show) throw new ApiError(404, "Show not found");

  if (new Date(show.startTime) <= now) throw new ApiError(400, "Cannot book seats for past shows");

  const seats = await Seat.find({ _id: { $in: seatIds } });
  if (seats.length !== seatIds.length) throw new ApiError(400, "Some seats not found");

  for (const seat of seats) {
    if (seat.show.toString() !== showId.toString()) {
      throw new ApiError(400, `Seat ${seat.seatNumber} belongs to a different show`);
    }

    if (
      seat.status !== "LOCKED" ||
      !seat.lockedAt ||
      seat.lockedBy.toString() !== userId.toString() ||
      now - seat.lockedAt > LOCK_TIME_MS
    ) {
      throw new ApiError(400, `Seat ${seat.seatNumber} is not locked by you or lock has expired`);
    }
  }

  const totalAmount = seats.length * show.price;
  const amountInPaise = Math.round(totalAmount * 100);

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

  res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amount: totalAmount });
});

// Confirm booking after successful payment
export const confirmBookingAfterPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  const userId = req.user._id;
  const now = new Date();

  if (!paymentIntentId) throw new ApiError(400, "Payment intent ID is required");

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw new ApiError(400, "Payment not completed. Please try again.");
  }

  const { showId, seatIds: seatIdsJson } = paymentIntent.metadata;
  const seatIds = JSON.parse(seatIdsJson);
  const totalAmount = paymentIntent.amount / 100;

  if (paymentIntent.metadata.userId !== userId.toString()) {
    throw new ApiError(403, "Unauthorized payment confirmation");
  }

  const booking = await withTransaction(async (session) => {
    const seats = await Seat.find({ _id: { $in: seatIds } }).session(session);

    if (seats.length !== seatIds.length) throw new ApiError(400, "Some seats not found");

    for (const seat of seats) {
      if (
        seat.status !== "LOCKED" ||
        !seat.lockedAt ||
        seat.lockedBy.toString() !== userId.toString() ||
        now - seat.lockedAt > LOCK_TIME_MS
      ) {
        throw new ApiError(409, `Seat ${seat.seatNumber} is no longer available`);
      }
    }

    const updateResult = await Seat.updateMany(
      {
        _id: { $in: seatIds },
        status: "LOCKED",
        lockedBy: userId,
        lockedAt: { $gte: new Date(Date.now() - LOCK_TIME_MS) },
      },
      {
        $set: { status: "BOOKED" },
        $unset: { lockedAt: "", lockedBy: "" },
      },
      { session }
    );

    if (updateResult.modifiedCount !== seatIds.length) {
      throw new ApiError(409, "One or more seats were booked by another user");
    }

    const newBooking = await Booking.create(
      [{ user: userId, show: showId, seats: seatIds, totalAmount, status: "CONFIRMED", paymentIntentId, paymentStatus: "PAID" }],
      { session }
    );

    return newBooking[0];
  });

  await booking.populate([{ path: "show", populate: { path: "movie theater" } }, { path: "seats" }]);

  // Respond immediately — do NOT await email. Email sending (QR generation + SMTP)
  // can take 10–30s and will cause the request to time out on Render's free tier.
  res.status(201).json({ message: "Booking confirmed successfully", booking });

  // Fire-and-forget: send email after response is already on its way
  sendBookingConfirmationEmail({
    userEmail: req.user.email,
    userName: req.user.name,
    booking,
  }).catch((err) => {
    logger.error(`[EMAIL] Background send failed: ${err.message}`);
  });
});

// Webhook to handle Stripe events
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

  switch (event.type) {
    case "payment_intent.succeeded":
      console.log(`Payment succeeded: ${event.data.object.id}`);
      break;
    case "payment_intent.payment_failed":
      console.log(`Payment failed: ${event.data.object.id}`);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});