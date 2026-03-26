import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";
import Show from "../models/show.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { LOCK_TIME_MS } from "../config/lock.config.js";
import { withTransaction } from "../utils/transaction.utils.js";
import stripe from "../config/stripe.config.js";
import { sendBookingConfirmationEmail } from "../utils/emailService.js";

export const confirmBooking = asyncHandler(async (req, res) => {
  const { seatIds, showId, totalAmount } = req.body;
  const userId = req.user._id;
  const now = new Date();

  if (!seatIds || seatIds.length === 0) {
    throw new ApiError(400, "No seats provided");
  }

  const show = await Show.findById(showId);
  if (!show) throw new ApiError(404, "Show not found");

  if (new Date(show.startTime) <= now) {
    throw new ApiError(400, "Cannot book seats for past shows");
  }

  const booking = await withTransaction(async (session) => {
    const seats = await Seat.find({ _id: { $in: seatIds } }).session(session);

    if (seats.length !== seatIds.length) {
      throw new ApiError(400, "Some seats not found");
    }

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
        throw new ApiError(400, `Seat ${seat.seatNumber} is not bookable`);
      }
    }

    const expectedAmount = seats.length * show.price;
    if (Math.abs(totalAmount - expectedAmount) > 0.01) {
      throw new ApiError(400, `Total amount mismatch. Expected ${expectedAmount}, got ${totalAmount}`);
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
      [{ user: userId, show: showId, seats: seatIds, totalAmount, status: "CONFIRMED" }],
      { session }
    );

    return newBooking[0];
  });

  await booking.populate([{ path: "show", populate: { path: "movie theater" } }, { path: "seats" }]);

  // Send confirmation email (real implementation)
  await sendBookingConfirmationEmail({
    userEmail: req.user.email,
    userName: req.user.name,
    booking,
  });

  res.status(201).json({ message: "Booking confirmed successfully", booking });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user._id;

  const booking = await Booking.findById(bookingId)
    .populate("seats")
    .populate({ path: "show", populate: { path: "movie" } });

  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.user.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized cancellation");
  }

  if (booking.status === "CANCELLED") {
    throw new ApiError(400, "Booking already cancelled");
  }

  if (new Date(booking.show.startTime) <= new Date()) {
    throw new ApiError(400, "Cannot cancel booking for past shows");
  }

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
      throw new ApiError(500, "Failed to process refund. Please contact support.");
    }
  }

  await withTransaction(async (session) => {
    const seatIds = booking.seats.map((seat) => seat._id);

    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { $set: { status: "FREE" }, $unset: { lockedAt: "", lockedBy: "" } },
      { session }
    );

    booking.status = "CANCELLED";
    await booking.save({ session });
  });

  res.json({
    message: "Booking cancelled successfully",
    refundStatus: booking.paymentStatus === "REFUNDED" ? "Refund processed" : "No refund needed",
  });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find({ user: userId })
      .populate({ path: "show", populate: { path: "movie theater" } })
      .populate("seats")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments({ user: userId }),
  ]);

  res.json({
    bookings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});