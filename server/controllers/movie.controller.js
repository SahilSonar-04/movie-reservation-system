import Movie from "../models/movie.model.js";
import Show from "../models/show.model.js";
import Seat from "../models/seat.model.js";
import Booking from "../models/booking.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { withTransaction } from "../utils/transaction.utils.js";
import logger from "../utils/logger.js";

export const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  logger.info(`Movie created: ${movie.title} (ID: ${movie._id})`);
  res.status(201).json(movie);
});

export const getMovies = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter query
  const filter = {};
  if (req.query.language) {
    filter.language = new RegExp(req.query.language, "i");
  }
  if (req.query.genre) {
    filter.genre = { $in: [new RegExp(req.query.genre, "i")] };
  }
  if (req.query.search) {
    filter.$or = [
      { title: new RegExp(req.query.search, "i") },
      { description: new RegExp(req.query.search, "i") },
    ];
  }

  const [movies, total] = await Promise.all([
    Movie.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Movie.countDocuments(filter),
  ]);

  res.json({
    movies, // ✅ Return as 'movies' property
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;

  const movie = await Movie.findById(movieId);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  // Find all shows for this movie
  const shows = await Show.find({ movie: movieId });
  const showIds = shows.map((show) => show._id);

  // Check if there are any CONFIRMED bookings for these shows
  const confirmedBookings = await Booking.countDocuments({
    show: { $in: showIds },
    status: "CONFIRMED",
  });

  if (confirmedBookings > 0) {
    return res.status(400).json({
      message: `Cannot delete movie. There are ${confirmedBookings} confirmed bookings for shows of this movie.`,
    });
  }

  // Use transaction for atomic deletion
  await withTransaction(async (session) => {
    // Delete all seats for all shows of this movie
    await Seat.deleteMany({ show: { $in: showIds } }, { session });

    // Delete all cancelled bookings for these shows
    await Booking.deleteMany(
      {
        show: { $in: showIds },
        status: "CANCELLED",
      },
      { session }
    );

    // Delete all shows for this movie
    await Show.deleteMany({ movie: movieId }, { session });

    // Finally, delete the movie
    await Movie.findByIdAndDelete(movieId, { session });
  });

  logger.info(`Movie deleted: ${movie.title} (ID: ${movieId})`);

  res.json({
    message: "Movie and all related data deleted successfully",
    deletedShows: shows.length,
  });
});