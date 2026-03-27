import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { getAdminStats } from "../controllers/admin.controller.js";
import { syncMoviesFromTMDB } from "../controllers/tmdb.controller.js";
import { adminLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Get dashboard stats
router.get(
  "/stats",
  authMiddleware,
  authorizeRoles("ADMIN"),
  getAdminStats
);

// Sync now-playing movies from TMDB
router.post(
  "/sync-movies",
  authMiddleware,
  authorizeRoles("ADMIN"),
  adminLimiter,
  syncMoviesFromTMDB
);

export default router;