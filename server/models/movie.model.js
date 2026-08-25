import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: String,
    duration: Number, // minutes
    language: String,
    genre: [String],
    posterUrl: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Movie", movieSchema);
