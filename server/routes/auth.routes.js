import express from "express";
import { register, login } from "../controllers/auth.controller.js";
import { registerValidation, loginValidation } from "../middleware/validation.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);

export default router;
