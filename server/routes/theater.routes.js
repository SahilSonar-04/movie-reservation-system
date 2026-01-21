import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import {
  createTheater,
  getTheaters,
  getTheatersByLocation,
  getLocations,
  deleteTheater,
} from "../controllers/theater.controller.js";
import {
  createTheaterValidation,
  deleteTheaterValidation,
  getTheatersByLocationValidation,
} from "../middleware/validation.middleware.js";
import { adminLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// PUBLIC: Get all theaters
router.get("/", getTheaters);

// PUBLIC: Get unique locations/cities
router.get("/locations", getLocations);

// PUBLIC: Get theaters by location
router.get(
  "/location/:location",
  getTheatersByLocationValidation,
  getTheatersByLocation
);

// ADMIN: Create theater
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  createTheaterValidation,
  createTheater
);

// ADMIN: Delete theater
router.delete(
  "/:theaterId",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  deleteTheaterValidation,
  deleteTheater
);

export default router;