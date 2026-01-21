import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { getAdminStats } from "../controllers/admin.controller.js";

const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  authorizeRoles("ADMIN"),
  getAdminStats
);

export default router;
