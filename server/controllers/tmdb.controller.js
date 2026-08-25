import asyncHandler from "../utils/asyncHandler.js";
import {
  syncMovies,
  cleanupStaleMovies,
  getSyncStatus,
} from "../services/movieSync.service.js";

/**
 * Admin manual sync handler
 * POST /api/admin/sync-movies
 */
export const syncMoviesFromTMDB = asyncHandler(async (req, res) => {
  try {
    const results = await syncMovies();
    res.json({
      message: "TMDB sync and maintenance complete",
      ...results,
    });
  } catch (err) {
    res.status(500).json({
      message: `TMDB sync failed: ${err.message}`,
    });
  }
});

/**
 * Admin manual cleanup handler
 * POST /api/admin/cleanup-movies
 */
export const cleanupStaleMoviesController = asyncHandler(async (req, res) => {
  try {
    const results = await cleanupStaleMovies();
    res.json({
      message: "Catalog maintenance and cleanup complete",
      ...results,
    });
  } catch (err) {
    res.status(500).json({
      message: `Cleanup failed: ${err.message}`,
    });
  }
});

/**
 * Get sync scheduler status
 * GET /api/admin/sync-status
 */
export const getSyncStatusController = asyncHandler(async (req, res) => {
  const status = getSyncStatus();
  res.json(status);
});