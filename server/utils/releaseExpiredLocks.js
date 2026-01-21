import Seat from "../models/seat.model.js";
import { LOCK_TIME_MS } from "../config/lock.config.js";

const releaseExpiredLocks = async () => {
  try {
    const expiryTime = new Date(Date.now() - LOCK_TIME_MS);

    await Seat.updateMany(
      {
        status: "LOCKED",
        lockedAt: { $lt: expiryTime },
      },
      {
        status: "FREE",
        lockedAt: null,
        lockedBy: null,
      }
    );
  } catch (err) {
    console.error("Failed to release expired locks:", err.message);
  }
};

export default releaseExpiredLocks;
