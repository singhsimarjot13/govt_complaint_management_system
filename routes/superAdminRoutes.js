import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getDashboard,
  getDistrictStats,
  getCitizenLeaderboard,
  getMCAdminLeaderboard,
  getWardLeaderboard,
  createMLA,
  updateMLA,
  deleteMLA,
  getMLAs,
  createMC,
  updateMC,
  deleteMC,
  getMCs,
} from "../controllers/superAdminController.js";

const router = express.Router();

// Super Admin dashboard
router.get("/dashboard", protect(["super_admin"]), getDashboard);
// Public heatmap stats (no auth required)
router.get("/district-stats", getDistrictStats);
router.get("/leaderboard/citizens", getCitizenLeaderboard);
router.get("/leaderboard/mcadmins", getMCAdminLeaderboard);
router.get("/leaderboard/wards", getWardLeaderboard);

// MLA Management
router.post("/create-mla", protect(["super_admin"]), createMLA);
router.put("/update-mla/:id", protect(["super_admin"]), updateMLA);
router.delete("/delete-mla/:id", protect(["super_admin"]), deleteMLA);
router.get("/mlas", protect(["super_admin"]), getMLAs);

// MC Admin Management
router.post("/create-mc", protect(["super_admin"]), createMC);
router.put("/update-mc/:id", protect(["super_admin"]), updateMC);
router.delete("/delete-mc/:id", protect(["super_admin"]), deleteMC);
router.get("/mcs", protect(["super_admin"]), getMCs);

export default router;
