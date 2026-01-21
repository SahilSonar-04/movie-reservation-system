import Show from "../models/show.model.js";
import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";

// ADMIN: Create a show for a movie
export const createShow = asyncHandler(async (req, res) => {
  const { movieId, theaterId, screen, startTime, price } = req.body;

  // ✅ VALIDATION
  if (!movieId || !theaterId || !screen || !startTime || !price) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Ensure movie exists
  const movie = await Movie.findById(movieId);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  // ✅ Ensure theater exists
  const theater = await Theater.findById(theaterId);
  if (!theater) {
    return res.status(404).json({ message: "Theater not found" });
  }

  const show = await Show.create({
    movie: movieId,
    theater: theaterId,
    screen,
    startTime,
    price,
  });

  // ✅ Populate before sending response
  await show.populate("movie");
  await show.populate("theater");

  res.status(201).json(show);
});

// PUBLIC: Get all shows for a movie
export const getShowsByMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;

  const shows = await Show.find({ movie: movieId })
    .populate("movie")
    .populate("theater") // ✅ Include theater info
    .sort({ startTime: 1 });

  res.json(shows);
});

// ✅ NEW: Get shows by location/city
export const getShowsByLocation = asyncHandler(async (req, res) => {
  const { location } = req.params;

  // Find all theaters in this location
  const theaters = await Theater.find({
    location: { $regex: new RegExp(location, "i") },
  });

  const theaterIds = theaters.map((t) => t._id);

  // Find all shows in these theaters
  const shows = await Show.find({ theater: { $in: theaterIds } })
    .populate("movie")
    .populate("theater")
    .sort({ startTime: 1 });

  res.json(shows);
});

// ✅ NEW: Get shows by theater
export const getShowsByTheater = asyncHandler(async (req, res) => {
  const { theaterId } = req.params;

  const shows = await Show.find({ theater: theaterId })
    .populate("movie")
    .populate("theater")
    .sort({ startTime: 1 });

  res.json(shows);
});

// ADMIN: Delete show
export const deleteShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;

  const show = await Show.findById(showId);
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  const confirmedBookings = await Booking.countDocuments({
    show: showId,
    status: "CONFIRMED",
  });

  if (confirmedBookings > 0) {
    return res.status(400).json({
      message: `Cannot delete show. There are ${confirmedBookings} confirmed bookings.`,
    });
  }

  await Seat.deleteMany({ show: showId });
  await Booking.deleteMany({
    show: showId,
    status: "CANCELLED",
  });
  await Show.findByIdAndDelete(showId);

  res.json({
    message: "Show and all related data deleted successfully",
  });
});