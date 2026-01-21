import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { createMovie, getMovies, deleteMovie } from "../controllers/movie.controller.js";
import {
  createMovieValidation,
  deleteMovieValidation,
  paginationValidation,
} from "../middleware/validation.middleware.js";
import { adminLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// PUBLIC: Get all movies with pagination
router.get("/", paginationValidation, getMovies);

// ADMIN: Create movie
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  createMovieValidation,
  createMovie
);

// ADMIN: Delete movie
router.delete(
  "/:movieId",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  deleteMovieValidation,
  deleteMovie
);

export default router;