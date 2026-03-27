import Show from "../models/show.model.js";
import Movie from "../models/movie.model.js";
import Theater from "../models/theater.model.js";
import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { withTransaction } from "../utils/transaction.utils.js";
import logger from "../utils/logger.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createShow = asyncHandler(async (req, res) => {
  const { movieId, theaterId, screen, startTime, price } = req.body;

  if (!movieId || !theaterId || !screen || !startTime || !price) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const movie = await Movie.findById(movieId);
  if (!movie) return res.status(404).json({ message: "Movie not found" });

  const theater = await Theater.findById(theaterId);
  if (!theater) return res.status(404).json({ message: "Theater not found" });

  const show = await Show.create({ movie: movieId, theater: theaterId, screen, startTime, price });

  await show.populate("movie");
  await show.populate("theater");

  res.status(201).json(show);
});

export const getShowsByMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const includePast = req.query.includePast === "true";

  const filter = { movie: movieId };
  if (!includePast) {
    filter.startTime = { $gte: new Date() };
  }

  const shows = await Show.find(filter)
    .populate("movie")
    .populate("theater")
    .sort({ startTime: 1 });

  res.json(shows);
});

export const getShowsByLocation = asyncHandler(async (req, res) => {
  const { location } = req.params;

  const theaters = await Theater.find({
    location: { $regex: new RegExp(escapeRegex(location), "i") },
  });

  const theaterIds = theaters.map((t) => t._id);

  const shows = await Show.find({ theater: { $in: theaterIds } })
    .populate("movie")
    .populate("theater")
    .sort({ startTime: 1 });

  res.json(shows);
});

export const getShowsByTheater = asyncHandler(async (req, res) => {
  const { theaterId } = req.params;

  const shows = await Show.find({ theater: theaterId })
    .populate("movie")
    .populate("theater")
    .sort({ startTime: 1 });

  res.json(shows);
});

export const deleteShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;

  const show = await Show.findById(showId);
  if (!show) return res.status(404).json({ message: "Show not found" });

  const confirmedBookings = await Booking.countDocuments({ show: showId, status: "CONFIRMED" });

  if (confirmedBookings > 0) {
    return res.status(400).json({
      message: `Cannot delete show. There are ${confirmedBookings} confirmed bookings.`,
    });
  }

  await withTransaction(async (session) => {
    await Seat.deleteMany({ show: showId }, { session });
    await Booking.deleteMany({ show: showId, status: "CANCELLED" }, { session });
    await Show.findByIdAndDelete(showId, { session });
  });

  logger.info(`Show deleted: ${showId}`);

  res.json({ message: "Show and all related data deleted successfully" });
});