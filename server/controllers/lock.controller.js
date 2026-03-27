import Seat from "../models/seat.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { LOCK_TIME_MS } from "../config/lock.config.js";
import { withTransaction } from "../utils/transaction.utils.js";
import { emitSeatUpdate } from "../utils/socket.js";
import logger from "../utils/logger.js";

export const lockSeats = asyncHandler(async (req, res) => {
  const { seatIds } = req.body;
  const userId = req.user._id;

  if (!seatIds || seatIds.length === 0) {
    return res.status(400).json({ message: "No seats selected" });
  }
  if (seatIds.length > 10) {
    return res.status(400).json({ message: "Cannot lock more than 10 seats at once" });
  }

  const now = new Date();
  let showId = null;

  // Transaction handles the atomic lock — WebSocket emits AFTER commit.
  // Transactions and sockets are independent concerns:
  // transactions = data consistency, sockets = real-time UI updates.
  await withTransaction(async (session) => {
    const seats = await Seat.find({ _id: { $in: seatIds } })
      .populate("show")
      .session(session);

    if (seats.length !== seatIds.length) throw new Error("Some seats not found");

    const showIds = [...new Set(seats.map((s) => s.show._id.toString()))];
    if (showIds.length > 1) throw new Error("All seats must belong to the same show");

    showId = showIds[0];
    const show = seats[0].show;

    if (new Date(show.startTime) <= now) throw new Error("Cannot lock seats for past shows");

    for (const seat of seats) {
      const isLockedAndValid =
        seat.status === "LOCKED" && seat.lockedAt && now - seat.lockedAt < LOCK_TIME_MS;

      if (seat.status === "BOOKED") throw new Error(`Seat ${seat.seatNumber} is already booked`);
      if (isLockedAndValid && seat.lockedBy.toString() !== userId.toString()) {
        throw new Error(`Seat ${seat.seatNumber} is locked by another user`);
      }
    }

    const updateResult = await Seat.updateMany(
      {
        _id: { $in: seatIds },
        status: { $in: ["FREE", "LOCKED"] },
        $or: [{ lockedBy: userId }, { lockedBy: null }, { lockedBy: { $exists: false } }],
      },
      { $set: { status: "LOCKED", lockedAt: now, lockedBy: userId } },
      { session }
    );

    if (updateResult.modifiedCount !== seatIds.length) {
      throw new Error("Some seats could not be locked");
    }
  });

  // Emit updated seats to everyone in this show's Socket.io room.
  // Replace 5-second polling on the frontend with a single event push.
  if (showId) {
    const updatedSeats = await Seat.find({ show: showId });
    emitSeatUpdate(showId, updatedSeats);
  }

  res.json({ message: "Seats locked successfully" });
});

export const unlockSeats = asyncHandler(async (req, res) => {
  const { seatIds } = req.body;
  const userId = req.user._id;

  if (!seatIds || seatIds.length === 0) {
    return res.status(400).json({ message: "No seats provided" });
  }

  let showId = null;

  await withTransaction(async (session) => {
    const seat = await Seat.findOne({ _id: { $in: seatIds } }).session(session);
    if (seat) showId = seat.show.toString();

    await Seat.updateMany(
      { _id: { $in: seatIds }, status: "LOCKED", lockedBy: userId },
      { $set: { status: "FREE" }, $unset: { lockedAt: "", lockedBy: "" } },
      { session }
    );
  });

  if (showId) {
    const updatedSeats = await Seat.find({ show: showId });
    emitSeatUpdate(showId, updatedSeats);
  }

  res.json({ message: "Seats unlocked" });
});