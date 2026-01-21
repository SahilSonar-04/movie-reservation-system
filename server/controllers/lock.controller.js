import Seat from "../models/seat.model.js";
import Show from "../models/show.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { LOCK_TIME_MS } from "../config/lock.config.js";
import { withTransaction } from "../utils/transaction.utils.js";

export const lockSeats = asyncHandler(async (req, res) => {
  const { seatIds } = req.body;
  const userId = req.user._id;

  if (!seatIds || seatIds.length === 0) {
    return res.status(400).json({ message: "No seats selected" });
  }

  // Limit seats per request
  if (seatIds.length > 10) {
    return res.status(400).json({ message: "Cannot lock more than 10 seats at once" });
  }

  const now = new Date();

  // Use transaction for atomic locking
  await withTransaction(async (session) => {
    // Fetch seats with show information
    const seats = await Seat.find({ _id: { $in: seatIds } })
      .populate("show")
      .session(session);

    if (seats.length !== seatIds.length) {
      throw new Error("Some seats not found");
    }

    // Ensure all seats belong to the same show
    const showIds = [...new Set(seats.map((s) => s.show._id.toString()))];
    if (showIds.length > 1) {
      throw new Error("All seats must belong to the same show");
    }

    // Check if show is in the future
    const show = seats[0].show;
    if (new Date(show.startTime) <= now) {
      throw new Error("Cannot lock seats for past shows");
    }

    // Validate each seat
    for (const seat of seats) {
      const isLockedAndValid =
        seat.status === "LOCKED" &&
        seat.lockedAt &&
        now - seat.lockedAt < LOCK_TIME_MS;

      if (seat.status === "BOOKED") {
        throw new Error(`Seat ${seat.seatNumber} is already booked`);
      }

      if (
        isLockedAndValid &&
        seat.lockedBy.toString() !== userId.toString()
      ) {
        throw new Error(`Seat ${seat.seatNumber} is locked by another user`);
      }
    }

    // Atomically lock seats
    const updateResult = await Seat.updateMany(
      {
        _id: { $in: seatIds },
        status: { $in: ["FREE", "LOCKED"] }, // Can lock FREE or re-lock own LOCKED seats
        $or: [
          { lockedBy: userId }, // Already locked by this user
          { lockedBy: null }, // Not locked by anyone
          { lockedBy: { $exists: false } }, // Field doesn't exist
        ],
      },
      {
        $set: {
          status: "LOCKED",
          lockedAt: now,
          lockedBy: userId,
        },
      },
      { session }
    );

    if (updateResult.modifiedCount !== seatIds.length) {
      throw new Error("Some seats could not be locked");
    }
  });

  res.json({ message: "Seats locked successfully" });
});

export const unlockSeats = asyncHandler(async (req, res) => {
  const { seatIds } = req.body;
  const userId = req.user._id;

  if (!seatIds || seatIds.length === 0) {
    return res.status(400).json({ message: "No seats provided" });
  }

  await withTransaction(async (session) => {
    const updateResult = await Seat.updateMany(
      {
        _id: { $in: seatIds },
        status: "LOCKED",
        lockedBy: userId,
      },
      {
        $set: { status: "FREE" },
        $unset: { lockedAt: "", lockedBy: "" },
      },
      { session }
    );

    // Don't throw error if some seats weren't locked
    // They might have already expired or been booked
  });

  res.json({ message: "Seats unlocked" });
});