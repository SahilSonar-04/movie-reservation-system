import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";
import "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import userRoutes from "./routes/user.routes.js";
import showRoutes from "./routes/show.routes.js";
import seatRoutes from "./routes/seat.routes.js";
import lockRoutes from "./routes/lock.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import theaterRoutes from "./routes/theater.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { handleStripeWebhook } from "./controllers/payment.controller.js";
import releaseExpiredLocks from "./utils/releaseExpiredLocks.js";
import { LOCK_TIME_MS } from "./config/lock.config.js";
import logger from "./utils/logger.js";
import { generalLimiter } from "./middleware/rateLimit.middleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// CRITICAL: Stripe webhook MUST come before express.json().
// Stripe requires the raw unparsed body to verify the webhook signature.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(morgan("combined", { stream: logger.stream }));

connectDB();

setInterval(releaseExpiredLocks, LOCK_TIME_MS);

// Rate limiting: applied once here at the app level.
// Previously also applied inside individual route files — that caused
// some routes to be double-limited. All per-route limiters have been removed
// from the route files; this single general limiter covers everything.
// Specific tighter limits (auth, booking, seat lock) are applied inside
// each route file only — not duplicated here.
app.use("/api", generalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/user", userRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/seats", lockRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/theaters", theaterRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/api/health", async (req, res) => {
  const mongoose = (await import("mongoose")).default;
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  res.json({
    status: "OK",
    message: "Movie Reservation API running",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime(),
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      message: "Duplicate entry",
      field: Object.keys(err.keyPattern)[0],
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;