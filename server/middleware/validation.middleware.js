import { body, param, query, validationResult } from "express-validator";
import mongoose from "mongoose";

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format");
  }
  return true;
};

// Custom validator for array of ObjectIds
const isValidObjectIdArray = (value) => {
  if (!Array.isArray(value)) {
    throw new Error("Must be an array");
  }
  if (value.length === 0) {
    throw new Error("Array cannot be empty");
  }
  for (const id of value) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid ID format in array");
    }
  }
  return true;
};

// Custom validator for future date
const isFutureDate = (value) => {
  const date = new Date(value);
  if (date <= new Date()) {
    throw new Error("Date must be in the future");
  }
  return true;
};

// Auth Validations
export const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  validate,
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

// Movie Validations
export const createMovieValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
  body("duration")
    .notEmpty()
    .withMessage("Duration is required")
    .isInt({ min: 1, max: 500 })
    .withMessage("Duration must be between 1 and 500 minutes"),
  body("language")
    .trim()
    .notEmpty()
    .withMessage("Language is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Language must be between 2 and 50 characters"),
  body("genre")
    .optional()
    .isArray()
    .withMessage("Genre must be an array")
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error("Maximum 10 genres allowed");
      }
      return true;
    }),
  body("posterUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Invalid poster URL"),
  validate,
];

export const deleteMovieValidation = [
  param("movieId").custom(isValidObjectId),
  validate,
];

// Theater Validations
export const createTheaterValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Theater name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Location must be between 2 and 100 characters"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Address cannot exceed 200 characters"),
  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),
  validate,
];

export const deleteTheaterValidation = [
  param("theaterId").custom(isValidObjectId),
  validate,
];

export const getTheatersByLocationValidation = [
  param("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Location must be between 2 and 100 characters"),
  validate,
];

// Show Validations
export const createShowValidation = [
  body("movieId").custom(isValidObjectId).withMessage("Invalid movie ID"),
  body("theaterId").custom(isValidObjectId).withMessage("Invalid theater ID"),
  body("screen")
    .trim()
    .notEmpty()
    .withMessage("Screen is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Screen name must be between 1 and 50 characters"),
  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom(isFutureDate),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0, max: 10000 })
    .withMessage("Price must be between 0 and 10000"),
  validate,
];

export const getShowsByMovieValidation = [
  param("movieId").custom(isValidObjectId),
  validate,
];

export const getShowsByTheaterValidation = [
  param("theaterId").custom(isValidObjectId),
  validate,
];

export const getShowsByLocationValidation = [
  param("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Location must be between 2 and 100 characters"),
  validate,
];

export const deleteShowValidation = [
  param("showId").custom(isValidObjectId),
  validate,
];

// Seat Validations
export const generateSeatsValidation = [
  param("showId").custom(isValidObjectId),
  validate,
];

export const getSeatsValidation = [
  param("showId").custom(isValidObjectId),
  validate,
];

// Lock Validations
export const lockSeatsValidation = [
  body("seatIds")
    .custom(isValidObjectIdArray)
    .withMessage("Invalid seat IDs")
    .custom((value) => {
      if (value.length > 10) {
        throw new Error("Cannot lock more than 10 seats at once");
      }
      return true;
    }),
  validate,
];

export const unlockSeatsValidation = [
  body("seatIds").custom(isValidObjectIdArray).withMessage("Invalid seat IDs"),
  validate,
];

// Booking Validations
export const confirmBookingValidation = [
  body("seatIds").custom(isValidObjectIdArray).withMessage("Invalid seat IDs"),
  body("showId").custom(isValidObjectId).withMessage("Invalid show ID"),
  body("totalAmount")
    .notEmpty()
    .withMessage("Total amount is required")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a positive number"),
  validate,
];

export const cancelBookingValidation = [
  param("bookingId").custom(isValidObjectId),
  validate,
];

// Pagination Validation
export const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  validate,
];