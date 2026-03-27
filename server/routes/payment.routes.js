import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createPaymentIntent,
  confirmBookingAfterPayment,
} from "../controllers/payment.controller.js";
import { bookingLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Create payment intent
router.post(
  "/create-payment-intent",
  authMiddleware,
  bookingLimiter,
  createPaymentIntent
);

// Confirm booking after payment
router.post(
  "/confirm-booking",
  authMiddleware,
  bookingLimiter,
  confirmBookingAfterPayment
);

// NOTE: /webhook is registered directly in app.js BEFORE express.json()
// so that Stripe gets the raw unparsed body for signature verification.

export default router;