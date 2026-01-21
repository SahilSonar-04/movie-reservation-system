import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
      index: true, // Index for faster queries by show
    },
    seatNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["FREE", "LOCKED", "BOOKED"],
      default: "FREE",
      index: true, // Index for filtering by status
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true, // Index for user-specific queries
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate seats for the same show
seatSchema.index({ show: 1, seatNumber: 1 }, { unique: true });

// Compound index for expired lock cleanup queries
seatSchema.index({ status: 1, lockedAt: 1 });

// Index for finding seats locked by a specific user
seatSchema.index({ lockedBy: 1, status: 1 });

// TTL index to auto-cleanup very old seat records if needed (optional)
// This is commented out by default - enable only if you want automatic cleanup
// seatSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 30 }); // 30 days

export default mongoose.model("Seat", seatSchema);