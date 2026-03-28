import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";
import Show from "../models/show.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { LOCK_TIME_MS } from "../config/lock.config.js";
import { withTransaction } from "../utils/transaction.utils.js";
import stripe from "../config/stripe.config.js";
import { sendBookingConfirmationEmail } from "../utils/emailService.js";
import { emitSeatUpdate } from "../utils/socket.js";
import logger from "../utils/logger.js";

export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user._id;

  const booking = await Booking.findById(bookingId)
    .populate("seats")
    .populate({ path: "show", populate: { path: "movie" } });

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.user.toString() !== userId.toString()) throw new ApiError(403, "Unauthorized cancellation");
  if (booking.status === "CANCELLED") throw new ApiError(400, "Booking already cancelled");
  if (new Date(booking.show.startTime) <= new Date()) throw new ApiError(400, "Cannot cancel booking for past shows");

  if (booking.paymentIntentId && booking.paymentStatus === "PAID") {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
        reason: "requested_by_customer",
      });
      booking.paymentStatus = "REFUNDED";
      logger.info(`Refund processed: ${refund.id} for booking ${bookingId}`);
    } catch (error) {
      logger.error(`Refund failed for booking ${bookingId}: ${error.message}`);
      throw new ApiError(500, "Failed to process refund. Please contact support.");
    }
  }

  const showId = booking.show._id.toString();

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

  // Freed seats should reflect immediately on anyone's seat map
  const updatedSeats = await Seat.find({ show: showId });
  emitSeatUpdate(showId, updatedSeats);

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