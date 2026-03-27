import Movie from "../models/movie.model.js";
import Show from "../models/show.model.js";
import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { withTransaction } from "../utils/transaction.utils.js";
import logger from "../utils/logger.js";

// Escape user-supplied strings before using them in RegExp.
// Raw query params passed directly to new RegExp() allow ReDoS attacks.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  logger.info(`Movie created: ${movie.title} (ID: ${movie._id})`);
  res.status(201).json(movie);
});

export const getMovies = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.language) {
    filter.language = new RegExp(escapeRegex(req.query.language), "i");
  }
  if (req.query.genre) {
    filter.genre = { $in: [new RegExp(escapeRegex(req.query.genre), "i")] };
  }
  if (req.query.search) {
    filter.$or = [
      { title: new RegExp(escapeRegex(req.query.search), "i") },
      { description: new RegExp(escapeRegex(req.query.search), "i") },
    ];
  }

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Movie.countDocuments(filter),
  ]);

  res.json({
    movies,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;

  const movie = await Movie.findById(movieId);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const shows = await Show.find({ movie: movieId });
  const showIds = shows.map((show) => show._id);

  const confirmedBookings = await Booking.countDocuments({
    show: { $in: showIds },
    status: "CONFIRMED",
  });

  if (confirmedBookings > 0) {
    return res.status(400).json({
      message: `Cannot delete movie. There are ${confirmedBookings} confirmed bookings for shows of this movie.`,
    });
  }

  await withTransaction(async (session) => {
    await Seat.deleteMany({ show: { $in: showIds } }, { session });
    await Booking.deleteMany({ show: { $in: showIds }, status: "CANCELLED" }, { session });
    await Show.deleteMany({ movie: movieId }, { session });
    await Movie.findByIdAndDelete(movieId, { session });
  });

  logger.info(`Movie deleted: ${movie.title} (ID: ${movieId})`);

  res.json({
    message: "Movie and all related data deleted successfully",
    deletedShows: shows.length,
  });
});