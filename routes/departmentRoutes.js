import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createWorker,
  getWorkers,
  getDepartmentIssues,
  assignIssueToWorker,
  verifyWorkCompletion,
  transferIssueToDepartment,
  getDepartments,
  changeWorker
} from "../controllers/departmentController.js";

const router = express.Router();

// Worker Management
router.post("/workers", protect(["department_admin"]), createWorker);
router.get("/workers", protect(["department_admin"]), getWorkers);

// Issue Management for Department Admins
router.get("/issues", protect(["department_admin"]), getDepartmentIssues);
router.put("/issues/:issue_id/assign", protect(["department_admin"]), assignIssueToWorker);
router.put("/issues/:issue_id/verify", protect(["department_admin"]), verifyWorkCompletion);
router.put("/issues/:issue_id/transfer", protect(["department_admin"]), transferIssueToDepartment);
router.put("/issues/:issue_id/change-worker", protect(["department_admin"]), changeWorker);

// Department Management
router.get("/departments", protect(["department_admin"]), getDepartments);

export default router;

