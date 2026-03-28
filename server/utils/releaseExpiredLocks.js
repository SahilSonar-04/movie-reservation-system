import Seat from "../models/seat.model.js";
import { LOCK_TIME_MS } from "../config/lock.config.js";
import { emitSeatUpdate } from "./socket.js";

const releaseExpiredLocks = async () => {
  try {
    const expiryTime = new Date(Date.now() - LOCK_TIME_MS);

    const expiredSeats = await Seat.find({
      status: "LOCKED",
      lockedAt: { $lt: expiryTime },
    }).select("show");

    if (expiredSeats.length === 0) return;

    await Seat.updateMany(
      { status: "LOCKED", lockedAt: { $lt: expiryTime } },
      { $set: { status: "FREE", lockedAt: null, lockedBy: null } }
    );

    // Emit per affected show so live seat maps update
    const showIds = [...new Set(expiredSeats.map((s) => s.show.toString()))];
    for (const showId of showIds) {
      const updatedSeats = await Seat.find({ show: showId });
      emitSeatUpdate(showId, updatedSeats);
    }
  } catch (err) {
    console.error("Failed to release expired locks:", err.message);
  }
};

export default releaseExpiredLocks;