import express from "express";
import { login, logout, register } from "../controllers/authController.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/register", register);
router.get("/me", protect(), (req, res) => {
  res.json({ success: true, role: req.user.role });
});
export default router;
