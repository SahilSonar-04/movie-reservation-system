import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true, // ✅ NEW: Shows must belong to a theater
    },
    screen: {
      type: String,
      required: true,
      // e.g., "Screen 1", "IMAX Screen"
    },
    startTime: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
showSchema.index({ movie: 1, theater: 1, startTime: 1 });

export default mongoose.model("Show", showSchema);