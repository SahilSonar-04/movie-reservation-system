import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import {
  generateSeatsForShow,
  getSeatsForShow,
} from "../controllers/seat.controller.js";
import {
  generateSeatsValidation,
  getSeatsValidation,
} from "../middleware/validation.middleware.js";
import { adminLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// ADMIN only
router.post(
  "/generate/:showId",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  generateSeatsValidation,
  generateSeatsForShow
);

// PUBLIC
router.get("/:showId", getSeatsValidation, getSeatsForShow);

export default router;