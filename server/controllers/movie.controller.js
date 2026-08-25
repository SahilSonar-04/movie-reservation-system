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
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
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

  // Filter out inactive movies by default unless includeAll is true
  if (req.query.includeAll !== "true") {
    if (req.query.availableOnly === "true") {
      const activeMovieIds = await Show.distinct("movie", { startTime: { $gte: new Date() } });
      filter._id = { $in: activeMovieIds };
    } else {
      filter.isActive = { $ne: false };
    }
  }

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Movie.countDocuments(filter),
  ]);

  // Enrich movies with count of upcoming shows
  const movieIds = movies.map((m) => m._id);
  const showCounts = await Show.aggregate([
    { $match: { movie: { $in: movieIds }, startTime: { $gte: new Date() } } },
    { $group: { _id: "$movie", count: { $sum: 1 } } },
  ]);
  const showCountMap = new Map(showCounts.map((sc) => [sc._id.toString(), sc.count]));

  const enrichedMovies = movies.map((m) => ({
    ...m,
    upcomingShowsCount: showCountMap.get(m._id.toString()) || 0,
  }));

  res.json({
    movies: enrichedMovies,
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

  // Check for future active confirmed bookings
  const upcomingShowIds = shows
    .filter((s) => new Date(s.startTime) >= new Date())
    .map((s) => s._id);

  const activeConfirmedBookings = await Booking.countDocuments({
    show: { $in: upcomingShowIds },
    status: "CONFIRMED",
  });

  if (activeConfirmedBookings > 0) {
    return res.status(400).json({
      message: `Cannot delete movie. There are ${activeConfirmedBookings} active upcoming bookings for shows of this movie.`,
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