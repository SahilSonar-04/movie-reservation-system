import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import {
  createShow,
  getShowsByMovie,
  getShowsByLocation,
  getShowsByTheater,
  deleteShow,
} from "../controllers/show.controller.js";
import {
  createShowValidation,
  getShowsByMovieValidation,
  getShowsByLocationValidation,
  getShowsByTheaterValidation,
  deleteShowValidation,
} from "../middleware/validation.middleware.js";
import { adminLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// ADMIN: Create show
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  createShowValidation,
  createShow
);

// PUBLIC: Get shows by movie
router.get("/movie/:movieId", getShowsByMovieValidation, getShowsByMovie);

// PUBLIC: Get shows by location
router.get("/location/:location", getShowsByLocationValidation, getShowsByLocation);

// PUBLIC: Get shows by theater
router.get("/theater/:theaterId", getShowsByTheaterValidation, getShowsByTheater);

// ADMIN: Delete show
router.delete(
  "/:showId",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  deleteShowValidation,
  deleteShow
);

export default router;