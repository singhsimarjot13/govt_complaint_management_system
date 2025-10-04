import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createIssue,
  getUserIssues,
  getIssueDetails,
  submitFeedback,
  reopenIssue,
  getWards,
  getCategories,
  getWardsByCity,
  getCities,
  uploadImage,
  getAllIssuesForVoting,
  voteOnIssue,
  removeVote
} from "../controllers/citizenController.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Issue Management for Citizens
router.post("/issues", protect(["citizen"]), createIssue);
router.get("/issues", protect(["citizen"]), getUserIssues);
router.get("/issues/:issue_id", protect(["citizen"]), getIssueDetails);
router.put("/issues/:issue_id/feedback", protect(["citizen"]), submitFeedback);
router.put("/issues/:issue_id/reopen", protect(["citizen"]), reopenIssue);

// Voting routes
router.get("/all-issues", protect(["citizen"]), getAllIssuesForVoting);
router.post("/issues/:issue_id/vote", protect(["citizen"]), voteOnIssue);
router.delete("/issues/:issue_id/vote", protect(["citizen"]), removeVote);

// Helper routes
router.get("/wards", protect(["citizen"]), getWards);
router.get("/categories", protect(["citizen"]), getCategories);
router.get("/cities", protect(["citizen"]), getCities);
router.get("/wards/:city", protect(["citizen"]), getWardsByCity);
router.post("/upload-image", protect(["citizen"]), upload.single('image'), uploadImage);

export default router;

