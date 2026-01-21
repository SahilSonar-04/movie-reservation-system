import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected route
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

export default router;
