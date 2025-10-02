import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAssignedIssues,
  updateIssueStatus,
  markWorkDone,
  getWorkerProfile
} from "../controllers/workerController.js";

const router = express.Router();

// Worker Issue Management
router.get("/issues", protect(["worker"]), getAssignedIssues);
router.put("/issues/:issue_id/status", protect(["worker"]), updateIssueStatus);
router.put("/issues/:issue_id/complete", protect(["worker"]), markWorkDone);
router.get("/profile", protect(["worker"]), getWorkerProfile);

export default router;

