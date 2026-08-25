import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
      index: true,
    },
    screen: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate shows at the same theater screen and start time
showSchema.index({ theater: 1, screen: 1, startTime: 1 }, { unique: true });

// Index for movie queries by start time
showSchema.index({ movie: 1, startTime: 1 });

// Index for faster queries
showSchema.index({ movie: 1, theater: 1, startTime: 1 });

export default mongoose.model("Show", showSchema);