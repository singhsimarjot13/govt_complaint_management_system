import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createIssue,
  getUserIssues,
  getIssueDetails,
  submitFeedback,
  reopenIssue,
  getWards,
  getCategories
} from "../controllers/citizenController.js";

const router = express.Router();

// Issue Management for Citizens
router.post("/issues", protect(["citizen"]), createIssue);
router.get("/issues", protect(["citizen"]), getUserIssues);
router.get("/issues/:issue_id", protect(["citizen"]), getIssueDetails);
router.put("/issues/:issue_id/feedback", protect(["citizen"]), submitFeedback);
router.put("/issues/:issue_id/reopen", protect(["citizen"]), reopenIssue);

// Helper routes
router.get("/wards", protect(["citizen"]), getWards);
router.get("/categories", protect(["citizen"]), getCategories);

export default router;

