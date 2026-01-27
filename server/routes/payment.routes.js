import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createPaymentIntent,
  confirmBookingAfterPayment,
  handleStripeWebhook,
} from "../controllers/payment.controller.js";
import {
  confirmBookingValidation,
} from "../middleware/validation.middleware.js";
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

// Stripe webhook (no auth middleware, verified by Stripe signature)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;