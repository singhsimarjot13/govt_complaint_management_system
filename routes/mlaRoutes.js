import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createWardMLA,
  updateWardMLA,
  deleteWardMLA,
  getWardsMLA
} from "../controllers/mlaController.js";

const router = express.Router();

// Wards assigned to MLA
router.post("/wards", protect(["mla"]), createWardMLA);
router.put("/wards/:id", protect(["mla"]), updateWardMLA);
router.delete("/wards/:id", protect(["mla"]), deleteWardMLA);
router.get("/wards", protect(["mla"]), getWardsMLA);

export default router;
