import Issue from "../models/issues.js";
import IssueHistory from "../models/issue_history.js";
import Notification from "../models/notifications.js";
import Worker from "../models/workers.js";
import User from "../models/User.js";

// Get issues assigned to worker
export const getAssignedIssues = async (req, res) => {
  try {
    const worker_email = req.user.email;
    
    // Find worker record
    const worker = await Worker.findOne({ email: worker_email });
    if (!worker) {
      return res.status(404).json({ message: "Worker record not found" });
    }

    const issues = await Issue.find({ current_worker_id: worker._id })
      .populate('user_id', 'name email')
      .populate('ward_id', 'name')
      .populate('current_department_id', 'name')
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
    
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Verify this worker is assigned to this issue
    const worker = await Worker.findOne({ email: req.user.email });
    if (!worker || issue.current_worker_id.toString() !== worker._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this issue" });
    }

    const previousStatus = issue.status;
    issue.status = status;
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      status: `Status updated to ${status}`
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
    const worker = await Worker.findOne({ email: req.user.email });
    if (!worker || issue.current_worker_id.toString() !== worker._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this issue" });
    }

    // Add work completion photos to existing photos array
    if (work_photos && work_photos.length > 0) {
      issue.photos = [...issue.photos, ...work_photos];
    }

    issue.status = "resolved"; // Worker marks as done
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      status: "Work completed by worker"
    });
    await history.save();

    // Notify department admin
    const departmentAdmin = await User.findById(issue.current_department_id);
    if (departmentAdmin) {
      const notification = new Notification({
        issue_id,
        recipient_id: departmentAdmin._id,
        recipient_model: "User",
        type: "Status Update"
      });
      await notification.save();
    }

    res.json({ 
      message: "Work marked as completed", 
      issue,
      notes: notes || "Work completed successfully"
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

