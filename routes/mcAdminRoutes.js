import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCouncillor,
  updateCouncillor,
  deleteCouncillor,
  getCouncillors,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartments,
  createWard,
  updateWard,
  deleteWard,
  getWards,
  getIssuesForAssignment,
  assignIssueToDepartment,
  transferIssueToDepartment,
  setIssuePriority,
  getMCAnalytics
} from "../controllers/mcAdminController.js";

const router = express.Router();

// Councillor CRUD
router.post("/councillors", protect(["mc_admin"]), createCouncillor);
router.put("/councillors/:id", protect(["mc_admin"]), updateCouncillor);
router.delete("/councillors/:id", protect(["mc_admin"]), deleteCouncillor);
router.get("/councillors", protect(["mc_admin"]), getCouncillors);

// Department CRUD
router.post("/departments", protect(["mc_admin"]), createDepartment);
router.put("/departments/:id", protect(["mc_admin"]), updateDepartment);
router.delete("/departments/:id", protect(["mc_admin"]), deleteDepartment);
router.get("/departments", protect(["mc_admin"]), getDepartments);

// Ward CRUD
router.post("/wards", protect(["mc_admin"]), createWard);
router.put("/wards/:id", protect(["mc_admin"]), updateWard);
router.delete("/wards/:id", protect(["mc_admin"]), deleteWard);
router.get("/wards", protect(["mc_admin"]), getWards);

// Issue Management
router.get("/issues", protect(["mc_admin"]), getIssuesForAssignment);
router.put("/issues/:issue_id/assign", protect(["mc_admin"]), assignIssueToDepartment);
router.put("/issues/:issue_id/transfer", protect(["mc_admin"]), transferIssueToDepartment);
router.put("/issues/:issue_id/priority", protect(["mc_admin"]), setIssuePriority);
router.get("/analytics", protect(["mc_admin"]), getMCAnalytics);

export default router;
