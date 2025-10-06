import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getWardIssues,
  getUnassignedIssues,
  verifyIssue,

  markResolved,
  getWards,
  setIssuePriorityByCouncillor
} from "../controllers/councillorController.js";

const router = express.Router();

// Issue Management for Councillors
router.get("/ward-issues", protect(["councillor"]), getWardIssues);
router.get("/wards", protect(["councillor"]), getWards);
router.get("/unassigned-issues", protect(["councillor"]), getUnassignedIssues);
router.put("/issues/:issue_id/verify", protect(["councillor"]), verifyIssue);

router.put("/issues/:issue_id/resolve", protect(["councillor"]), markResolved);
router.put("/issues/:issue_id/priority", protect(["councillor"]), setIssuePriorityByCouncillor);

export default router;

