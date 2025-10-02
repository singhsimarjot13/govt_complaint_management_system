import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createWorker,
  getWorkers,
  getDepartmentIssues,
  assignIssueToWorker,
  verifyWorkCompletion
} from "../controllers/departmentController.js";

const router = express.Router();

// Worker Management
router.post("/workers", protect(["department_admin"]), createWorker);
router.get("/workers", protect(["department_admin"]), getWorkers);

// Issue Management for Department Admins
router.get("/issues", protect(["department_admin"]), getDepartmentIssues);
router.put("/issues/:issue_id/assign", protect(["department_admin"]), assignIssueToWorker);
router.put("/issues/:issue_id/verify", protect(["department_admin"]), verifyWorkCompletion);

export default router;

