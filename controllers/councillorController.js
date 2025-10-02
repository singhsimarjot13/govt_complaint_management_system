import Issue from "../models/issues.js";
import Ward from "../models/ward.js";
import IssueHistory from "../models/issue_history.js";
import Notification from "../models/notifications.js";

// Get issues for councillor's ward
export const getWardIssues = async (req, res) => {
  try {
    const councillor_id = req.user.id;
    
    // Find ward assigned to this councillor
    const ward = await Ward.findOne({ councillor_id });
    if (!ward) {
      return res.status(404).json({ message: "No ward assigned to this councillor" });
    }

    // Get issues for this ward
    const issues = await Issue.find({ ward_id: ward._id })
      .populate('user_id', 'name email')
      .populate('current_department_id', 'name')
      .populate('current_worker_id', 'name email')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get unassigned issues (no ward selected by user)
export const getUnassignedIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ ward_id: null })
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Verify and assign ward to issue
export const verifyIssue = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { ward_id } = req.body;
    const councillor_id = req.user.id;

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Update issue with ward assignment
    issue.ward_id = ward_id;
    issue.status = "in-progress";
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      assigned_ward_id: ward_id,
      assigned_by_councillor_id: councillor_id,
      status: "Assigned"
    });
    await history.save();

    // Create notification for MC Admin
    const notification = new Notification({
      issue_id,
      recipient_id: req.user.mc_admin_id, // Need to get MC Admin ID
      recipient_model: "MC_Admin",
      type: "Issue Assigned"
    });
    await notification.save();

    res.json({ message: "Issue verified and assigned to ward", issue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Forward verified issue to MC Admin
export const forwardToMCAdmin = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const councillor_id = req.user.id;

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Update issue status
    issue.status = "in-progress";
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      status: "Forwarded to MC Admin"
    });
    await history.save();

    res.json({ message: "Issue forwarded to MC Admin", issue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Mark issue as resolved (final verification)
export const markResolved = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const councillor_id = req.user.id;

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Update issue status
    issue.status = "resolved";
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      status: "Verified and Resolved"
    });
    await history.save();

    // Notify user
    const notification = new Notification({
      issue_id,
      recipient_id: issue.user_id,
      recipient_model: "User",
      type: "Completed"
    });
    await notification.save();

    res.json({ message: "Issue marked as resolved", issue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

