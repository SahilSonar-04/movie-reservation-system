import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";
import Show from "../models/show.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { LOCK_TIME_MS } from "../config/lock.config.js";
import { withTransaction } from "../utils/transaction.utils.js";
import stripe from "../config/stripe.config.js";

export const confirmBooking = asyncHandler(async (req, res) => {
  const { seatIds, showId, totalAmount } = req.body;
  const userId = req.user._id;
  const now = new Date();

  if (!seatIds || seatIds.length === 0) {
    return res.status(400).json({ message: "No seats provided" });
  }

  // Check if show exists and is in the future
  const show = await Show.findById(showId);
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  if (new Date(show.startTime) <= now) {
    return res.status(400).json({ message: "Cannot book seats for past shows" });
  }

  // Use transaction for atomic booking
  const booking = await withTransaction(async (session) => {
    // Fetch and validate seats
    const seats = await Seat.find({ _id: { $in: seatIds } }).session(session);

    if (seats.length !== seatIds.length) {
      throw new Error("Some seats not found");
    }

    // Validate each seat
    for (const seat of seats) {
      if (seat.show.toString() !== showId.toString()) {
        throw new Error(`Seat ${seat.seatNumber} belongs to a different show`);
      }

      if (
        seat.status !== "LOCKED" ||
        !seat.lockedAt ||
        seat.lockedBy.toString() !== userId.toString() ||
        now - seat.lockedAt > LOCK_TIME_MS
      ) {
        throw new Error(`Seat ${seat.seatNumber} is not bookable`);
      }
    }

    // Validate total amount
    const expectedAmount = seats.length * show.price;
    if (Math.abs(totalAmount - expectedAmount) > 0.01) {
      throw new Error(
        `Total amount mismatch. Expected ${expectedAmount}, got ${totalAmount}`
      );
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

    // If even one seat failed, abort
    if (updateResult.modifiedCount !== seatIds.length) {
      throw new Error("One or more seats were booked by another user");
    }

    // Create booking
    const newBooking = await Booking.create(
      [
        {
          user: userId,
          show: showId,
          seats: seatIds,
          totalAmount,
          status: "CONFIRMED",
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

export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user._id;

  const booking = await Booking.findById(bookingId)
    .populate("seats")
    .populate({
      path: "show",
      populate: { path: "movie" },
    });

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.user.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Unauthorized cancellation" });
  }

  if (booking.status === "CANCELLED") {
    return res.status(400).json({ message: "Booking already cancelled" });
  }

  // Check if show is in the past
  if (new Date(booking.show.startTime) <= new Date()) {
    return res
      .status(400)
      .json({ message: "Cannot cancel booking for past shows" });
  }

  // Process refund if payment was made
  if (booking.paymentIntentId && booking.paymentStatus === "PAID") {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
        reason: "requested_by_customer",
      });

      booking.paymentStatus = "REFUNDED";
      console.log(`Refund processed: ${refund.id}`);
    } catch (error) {
      console.error("Refund failed:", error);
      return res.status(500).json({ 
        message: "Failed to process refund. Please contact support." 
      });
    }
  }

  // Use transaction for atomic cancellation
  await withTransaction(async (session) => {
    const seatIds = booking.seats.map((seat) => seat._id);

    await Seat.updateMany(
      { _id: { $in: seatIds } },
      {
        $set: { status: "FREE" },
        $unset: { lockedAt: "", lockedBy: "" },
      },
      { session }
    );

    booking.status = "CANCELLED";
    await booking.save({ session });
  });

  res.json({ 
    message: "Booking cancelled successfully",
    refundStatus: booking.paymentStatus === "REFUNDED" ? "Refund processed" : "No refund needed"
  });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: {
          path: "movie theater",
        },
      })
      .populate("seats")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments({ user: userId }),
  ]);

  res.json({
    bookings, // ✅ Return as 'bookings' property
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});