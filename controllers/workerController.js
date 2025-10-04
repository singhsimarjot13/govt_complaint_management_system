import Issue from "../models/issues.js";
import IssueHistory from "../models/issue_history.js";
import Notification from "../models/notifications.js";
import Worker from "../models/workers.js";
import User from "../models/User.js";
import Department from "../models/dept.js";
import cloudinary from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Get issues assigned to worker
export const getAssignedIssues = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Use findById to get a single user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the worker with the user's email
    const worker = await Worker.findOne({ email: user.email });
    if (!worker) {
      return res.status(404).json({ message: "Worker record not found" });
    }

    console.log(worker._id);

    // Fetch issues assigned to this worker
    const issues = await Issue.find({ current_worker_id: worker._id })
      .populate('user_id', 'name email')
      .populate('ward_id', 'ward_name')
      .populate('current_department_id', 'name')
      .populate('assigned_by_department_admin_id', 'name')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Update issue status
export const updateIssueStatus = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { status } = req.body;

    // Find the issue
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    console.log("Issue worker ID:", issue.current_worker_id);
    console.log("Logged-in worker ID:", req.user.id);

    // Use req.user.id directly and compare with ObjectId
    const workerId = mongoose.Types.ObjectId(req.user.id);

    if (!issue.current_worker_id.equals(workerId)) {
      return res.status(403).json({ message: "Not authorized to update this issue" });
    }

    // Update status
    const previousStatus = issue.status;
    issue.status = status;
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      status: `Status updated from "${previousStatus}" to "${status}"`
    });
    await history.save();

    res.json({ message: "Issue status updated", issue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// Upload work completion photos and mark as done
export const markWorkDone = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { work_photos, notes } = req.body; // work_photos should be array of Cloudinary URLs
    
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Verify this worker is assigned to this issue
    const userdoc=await User.findById(req.user.id);
    console.log(userdoc.email);
    const worker=await Worker.findOne({email:userdoc.email});
    console.log(worker._id);
    console.log(issue.current_worker_id);
    const workerId=worker.id;

    if (!workerId || issue.current_worker_id.toString() !== workerId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this issue" });
    }

    // Check if issue is in correct status for work completion
    if (issue.status !== "in-progress") {
      return res.status(400).json({ message: "Issue must be in-progress before marking as done" });
    }

    // Add work completion photos to worker_photos array
    if (work_photos && work_photos.length > 0) {
      issue.worker_photos = [...issue.worker_photos, ...work_photos];
    }

    // Update issue status and worker info
    issue.status = "resolved_by_worker";
    issue.resolved_by_worker_id = worker._id;
    issue.resolved_by_worker_at = new Date();
    issue.worker_notes = notes || "Work completed by worker";
    await issue.save();

    // Create or update history entry
    const existingHistory = await IssueHistory.findOne({ 
      issue_id, 
      action_type: "work_completed" 
    });
    
    if (existingHistory) {
      // Update existing history entry
      existingHistory.new_worker_id = worker._id;
      existingHistory.status = "resolved_by_worker";
      existingHistory.notes = notes || "Work completed by worker";
      existingHistory.timestamp = new Date();
      await existingHistory.save();
    } else {
      // Create new history entry
      const history = new IssueHistory({
        issue_id,
        new_worker_id: worker._id,
        status: "resolved_by_worker",
        action_type: "work_completed",
        notes: notes || "Work completed by worker"
      });
      await history.save();
    }

    // Notify department admin for verification
    const department = await Department.findById(worker.department_id);
    if (department) {
      const notification = new Notification({
        issue_id,
        recipient_id: department.admin_id,
        recipient_model: "User",
        type: "Work Completed - Please verify"
      });
      await notification.save();
    }

    res.json({ 
      message: "Work marked as completed", 
      issue,
      next_step: "Department Admin will verify work completion"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Upload image to Cloudinary
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        { 
          resource_type: "auto",
          folder: "worker_photos"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({ 
      message: "Image uploaded successfully", 
      imageUrl: result.secure_url 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get worker profile
export const getWorkerProfile = async (req, res) => {
  try {
    const worker = await Worker.findOne({ email: req.user.email })
      .populate('department_id', 'name');
    
    if (!worker) {
      return res.status(404).json({ message: "Worker profile not found" });
    }

    res.json(worker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

