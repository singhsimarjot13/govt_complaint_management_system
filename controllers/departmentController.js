import User from "../models/User.js";
import Worker from "../models/workers.js";
import Issue from "../models/issues.js";
import IssueHistory from "../models/issue_history.js";
import Notification from "../models/notifications.js";
import Department from "../models/dept.js";

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
      photo: photo || "",
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
      .populate('ward_id', 'name')
      .populate('current_worker_id', 'name email')
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
    const { worker_id } = req.body;
    const department_admin_id = req.user.id;

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
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
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      previous_worker_id: previousWorker,
      new_worker_id: worker_id,
      status: "Assigned"
    });
    await history.save();

    // Notify worker
    const workerUser = await User.findOne({ email: worker.email });
    const notification = new Notification({
      issue_id,
      recipient_id: workerUser._id,
      recipient_model: "User",
      type: "Issue Assigned"
    });
    await notification.save();

    res.json({ message: "Issue assigned to worker", issue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Verify work completion
export const verifyWorkCompletion = async (req, res) => {
  try {
    const { issue_id } = req.params;
    
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Update issue status - work verified by department
    issue.status = "resolved"; // Will be further verified by councillor
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      status: "Work Verified by Department"
    });
    await history.save();

    res.json({ message: "Work completion verified", issue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

