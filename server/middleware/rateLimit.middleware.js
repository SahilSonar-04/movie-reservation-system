import rateLimit from "express-rate-limit";

const isProd = process.env.NODE_ENV === "production";

// no-op middleware for development
const devBypass = (req, res, next) => next();

/* ================= GENERAL API ================= */
export const generalLimiter = isProd
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: {
        message: "Too many requests from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  : devBypass;

/* ================= AUTH ================= */
export const authLimiter = isProd
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skipSuccessfulRequests: true,
      message: {
        message:
          "Too many authentication attempts from this IP, please try again after 15 minutes.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  : devBypass;

/* ================= SEAT LOCK ================= */
export const seatLockLimiter = isProd
  ? rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 20,
      message: {
        message: "Too many seat lock/unlock requests, please slow down.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  : devBypass;

/* ================= BOOKING ================= */
export const bookingLimiter = isProd
  ? rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 10,
      message: {
        message: "Too many booking attempts, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  : devBypass;

/* ================= ADMIN ================= */
export const adminLimiter = isProd
  ? rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 30,
      message: {
        message: "Too many admin operations, please slow down.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
  : devBypass;
