import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  confirmBooking,
  getMyBookings,
  cancelBooking,
} from "../controllers/booking.controller.js";
import {
  confirmBookingValidation,
  cancelBookingValidation,
  paginationValidation,
} from "../middleware/validation.middleware.js";
import { bookingLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post(
  "/confirm",
  authMiddleware,
  bookingLimiter,
  confirmBookingValidation,
  confirmBooking
);

router.get(
  "/my",
  authMiddleware,
  paginationValidation,
  getMyBookings
);

router.patch(
  "/cancel/:bookingId",
  authMiddleware,
  cancelBookingValidation,
  cancelBooking
);

export default router;