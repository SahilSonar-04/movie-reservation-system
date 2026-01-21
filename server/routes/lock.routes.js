import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { lockSeats, unlockSeats } from "../controllers/lock.controller.js";
import {
  lockSeatsValidation,
  unlockSeatsValidation,
} from "../middleware/validation.middleware.js";
import { seatLockLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post(
  "/lock",
  authMiddleware,
  seatLockLimiter,
  lockSeatsValidation,
  lockSeats
);

router.post(
  "/unlock",
  authMiddleware,
  seatLockLimiter,
  unlockSeatsValidation,
  unlockSeats
);

export default router;