/**
 * ApiError - Custom error class for consistent API error handling.
 * Used throughout controllers to throw structured errors that are caught
 * by the global error handler in app.js.
 *
 * Usage:
 *   throw new ApiError(404, "Movie not found");
 *   throw new ApiError(403, "Access denied");
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export default ApiError;