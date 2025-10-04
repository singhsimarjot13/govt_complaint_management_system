import User from "../models/User.js";
import Worker from "../models/workers.js";
import Issue from "../models/issues.js";
import IssueHistory from "../models/issue_history.js";
import Notification from "../models/notifications.js";
import Department from "../models/dept.js";
import Ward from "../models/ward.js";

// Create worker in department
export const createWorker = async (req, res) => {
  try {
    const { name, email, password, contact, photo } = req.body;
    const department_admin_id = req.user.id;
    
    // Find department managed by this admin
    const department = await Department.findOne({ admin_id: department_admin_id });
    if (!department) {
      return res.status(404).json({ message: "Department not found for this admin" });
    }

    // 1. Create user account for worker
    const newUser = new User({
      name,
      email,
      password,
      role: "worker"
    });
    await newUser.save();

    // 2. Create worker record
    const worker = new Worker({
      name,
      email,
      contact,
      department_id: department._id
    });
    await worker.save();

    res.status(201).json({ message: "Worker created successfully", worker });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all workers in department
export const getWorkers = async (req, res) => {
  try {
    const department_admin_id = req.user.id;
    
    const department = await Department.findOne({ admin_id: department_admin_id });
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const workers = await Worker.find({ department_id: department._id });
    res.json(workers);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get issues assigned to department
export const getDepartmentIssues = async (req, res) => {
  try {
    const department_admin_id = req.user.id;
    
    const department = await Department.findOne({ admin_id: department_admin_id });
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const issues = await Issue.find({ current_department_id: department._id })
      .populate('user_id', 'name email')
      .populate('ward_id', 'ward_name')
      .populate('current_worker_id', 'name email')
      .populate('assigned_by_mc_admin_id', 'name')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Assign issue to worker
export const assignIssueToWorker = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { worker_id, notes } = req.body;
    const department_admin_id = req.user.id;

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if issue is in correct status for worker assignment
    if (issue.status !== "assigned_to_department") {
      return res.status(400).json({ message: "Issue must be assigned to department before worker assignment" });
    }

    // Verify worker belongs to this department
    const department = await Department.findOne({ admin_id: department_admin_id });
    const worker = await Worker.findOne({ _id: worker_id, department_id: department._id });
    
    if (!worker) {
      return res.status(400).json({ message: "Worker not found in your department" });
    }

    // Update issue
    const previousWorker = issue.current_worker_id;
    issue.current_worker_id = worker_id;
    issue.status = "in-progress";
    issue.assigned_by_department_admin_id = department_admin_id;
    issue.assigned_to_worker_at = new Date();
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      previous_worker_id: previousWorker,
      new_worker_id: worker_id,
      assigned_by_department_admin_id: department_admin_id,
      status: "in-progress",
      action_type: "worker_assigned",
      notes: notes || "Issue assigned to worker by department admin"
    });
    await history.save();

    // Notify worker
    const workerUser = await User.findOne({ email: worker.email });
    const notification = new Notification({
      issue_id,
      recipient_id: workerUser._id,
      recipient_model: "User",
      type: "Issue Assigned - Please start work"
    });
    await notification.save();

    res.json({ 
      message: "Issue assigned to worker", 
      issue,
      next_step: "Worker will start work and upload photos"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Verify work completion
export const verifyWorkCompletion = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { notes } = req.body;
    const department_admin_id = req.user.id;
    
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if issue is in correct status for department verification
    if (issue.status !== "resolved_by_worker") {
      return res.status(400).json({ message: "Issue must be resolved by worker before department verification" });
    }

    // Update issue status - work verified by department
    issue.status = "department_resolved";
    issue.department_verified_by_id = department_admin_id;
    issue.department_verified_at = new Date();
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      assigned_by_department_admin_id: department_admin_id,
      status: "department_resolved",
      action_type: "department_verified",
      notes: notes || "Work completion verified by department admin"
    });
    await history.save();

    // Notify councillor for final verification
    if (issue.ward_id) {
      const ward = await Ward.findById(issue.ward_id);
      if (ward && ward.councillor_id) {
        const notification = new Notification({
          issue_id,
          recipient_id: ward.councillor_id,
          recipient_model: "Councillor",
          type: "Issue Ready for Final Verification"
        });
        await notification.save();
      }
    }

    res.json({ 
      message: "Work completion verified", 
      issue,
      next_step: "Councillor will perform final verification"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Transfer issue to different department
export const transferIssueToDepartment = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { new_department_id, reason, notes } = req.body;
    const department_admin_id = req.user.id;
    
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if issue is in correct status for transfer
    if (!["assigned_to_department", "in-progress", "resolved_by_worker"].includes(issue.status)) {
      return res.status(400).json({ message: "Issue cannot be transferred in current status" });
    }
    console.log(issue.current_department_id);
    // Verify the issue belongs to current department
    const currentDepartment = await Department.findOne({ admin_id: department_admin_id });
    console.log(currentDepartment._id);
    if (!currentDepartment || issue.current_department_id.toString() !== currentDepartment._id.toString()) {
      return res.status(400).json({ message: "Issue does not belong to your department" });
    }

    // Update issue with new department
    const previousDepartment = issue.current_department_id;
    issue.current_department_id = new_department_id;
    issue.current_worker_id = null; // Reset worker assignment
    issue.status = "assigned_to_department";
    issue.assigned_by_department_admin_id = department_admin_id;
    issue.assigned_to_department_at = new Date();
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      previous_department_id: previousDepartment,
      new_department_id: new_department_id,
      assigned_by_department_admin_id: department_admin_id,
      status: "assigned_to_department",
      action_type: "transferred",
      notes: notes || `Issue transferred to new department. Reason: ${reason || 'Department reassignment'}`
    });
    await history.save();

    // Notify new department admin
    const newDepartment = await Department.findById(new_department_id);
    if (newDepartment) {
      const notification = new Notification({
        issue_id,
        recipient_id: newDepartment.admin_id,
        recipient_model: "User",
        type: "Issue Transferred - Please assign worker"
      });
      await notification.save();
    }

    res.json({ 
      message: "Issue transferred to new department", 
      issue,
      next_step: "New Department Admin will assign worker"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all departments for transfer
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('admin_id', 'name email')
      .select('name admin_id');
    
    res.json(departments);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Change worker assignment
export const changeWorker = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { new_worker_id, notes } = req.body;
    const department_admin_id = req.user.id;

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if issue is in correct status for worker change
    if (!["assigned_to_department", "in-progress", "resolved_by_worker"].includes(issue.status)) {
      return res.status(400).json({ message: "Issue cannot have worker changed in current status" });
    }

    // Verify the issue belongs to current department
    const currentDepartment = await Department.findOne({ admin_id: department_admin_id });
    if (!currentDepartment || issue.current_department_id.toString() !== currentDepartment._id.toString()) {
      return res.status(400).json({ message: "Issue does not belong to your department" });
    }

    // Verify new worker belongs to this department
    const newWorker = await Worker.findOne({ _id: new_worker_id, department_id: currentDepartment._id });
    if (!newWorker) {
      return res.status(400).json({ message: "Worker not found in your department" });
    }

    // Update issue with new worker
    const previousWorker = issue.current_worker_id;
    issue.current_worker_id = new_worker_id;
    issue.status = issue.status === "resolved_by_worker" ? "in-progress" : issue.status; // Reset to in-progress if it was resolved
    issue.assigned_by_department_admin_id = department_admin_id;
    issue.assigned_to_worker_at = new Date();
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      previous_worker_id: previousWorker,
      new_worker_id: new_worker_id,
      assigned_by_department_admin_id: department_admin_id,
      status: issue.status,
      action_type: "worker_changed",
      notes: notes || `Worker changed from ${previousWorker?.name || 'unassigned'} to ${newWorker.name}`
    });
    await history.save();

    // Notify new worker
    const workerUser = await User.findOne({ email: newWorker.email });
    if (workerUser) {
      const notification = new Notification({
        issue_id,
        recipient_id: workerUser._id,
        recipient_model: "User",
        type: "Issue Assigned - Please start work"
      });
      await notification.save();
    }

    res.json({ 
      message: "Worker changed successfully", 
      issue,
      next_step: "New worker will start work"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

