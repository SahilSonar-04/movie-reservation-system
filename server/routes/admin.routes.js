import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { getAdminStats } from "../controllers/admin.controller.js";
import {
  syncMoviesFromTMDB,
  cleanupStaleMoviesController,
  getSyncStatusController,
} from "../controllers/tmdb.controller.js";
import { adminLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Get dashboard stats
router.get(
  "/stats",
  authMiddleware,
  authorizeRoles("ADMIN"),
  getAdminStats
);

// Get auto-sync scheduler status
router.get(
  "/sync-status",
  authMiddleware,
  authorizeRoles("ADMIN"),
  getSyncStatusController
);

// Sync now-playing movies from TMDB (manual trigger)
router.post(
  "/sync-movies",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  syncMoviesFromTMDB
);

// Clean up stale movies without available shows & merge duplicates (manual trigger)
router.post(
  "/cleanup-movies",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  cleanupStaleMoviesController
);

export default router;