import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    duration: Number, // minutes
    language: String,
    genre: [String],
    posterUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model("Movie", movieSchema);
