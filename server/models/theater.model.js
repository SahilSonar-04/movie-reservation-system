import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      // e.g., "PVR Phoenix Mall"
    },
    location: {
      type: String,
      required: true,
      // e.g., "Mumbai"
    },
    address: {
      type: String,
      // e.g., "Kurla West, Mumbai - 400070"
    },
    amenities: [String],
    // e.g., ["3D", "IMAX", "Dolby Atmos", "Parking"]
  },
  { timestamps: true }
);

// Index for faster location-based queries
theaterSchema.index({ location: 1 });

export default mongoose.model("Theater", theaterSchema);