import Issue from "../models/issues.js";
import Ward from "../models/ward.js";
import IssueHistory from "../models/issue_history.js";
import Notification from "../models/notifications.js";
import Councillor from "../models/Councillors.js";
import MC_Admin from "../models/mc_admins.js";
import User from "../models/User.js";

// Get issues for councillor's ward
export const getWardIssues = async (req, res) => {
  try {
    const councillor_id = req.user.id;
    
    // Find ward assigned to this councillor
    const ward = await User.findOne({ _id: councillor_id });
    if (!ward) {
      return res.status(404).json({ message: "No ward assigned to this councillor" });
    }

    // Get issues for this ward
    const issues = await Issue.find({ ward_id: ward.ward_id }).populate("ward_id","ward_name")

      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
export const getWards = async (req, res) => {
  try {
    const user_id = req.user.id;
    console.log("User ID:", user_id);
    const wards=await User.findOne({ _id: user_id }).populate("ward_id", "ward_name");
    console.log("Wards:", wards);
    res.json(wards);
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
    const { ward_id, notes } = req.body;
    const councillor_id = req.user.id;

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if issue is in correct status for verification
    if (issue.status !== "open") {
      return res.status(400).json({ message: "Issue is not in open status for verification" });
    }

    // Update issue with ward assignment and verification
    issue.ward_id = ward_id;
    issue.status = "verified_by_councillor";
    issue.verified_by_councillor_id = councillor_id;
    issue.verified_at = new Date();
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      assigned_ward_id: ward_id,
      assigned_by_councillor_id: councillor_id,
      status: "verified_by_councillor",
      action_type: ward_id ? "ward_assigned" : "verified",
      notes: notes || "Issue verified by councillor"
    });
    await history.save();

    // Get MC Admin for this councillor
    const councillor = await Councillor.findById(councillor_id);
    if (councillor) {
      const mcAdmin = await MC_Admin.findById(councillor.mc_admin_id);
      if (mcAdmin) {
        // Create notification for MC Admin
        const notification = new Notification({
          issue_id,
          recipient_id: mcAdmin._id,
          recipient_model: "MC_Admin",
          type: "Issue Verified - Ready for Department Assignment"
        });
        await notification.save();
      }
    }

    res.json({ 
      message: "Issue verified and assigned to ward", 
      issue,
      next_step: "MC Admin will assign department"
    });
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
    const { notes } = req.body;
    const councillor_id = req.user.id;

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if issue is in correct status for final verification
    if (issue.status !== "department_resolved") {
      return res.status(400).json({ message: "Issue must be department resolved before final verification" });
    }

    // Update issue status
    issue.status = "verified_resolved";
    issue.final_verified_by_councillor_id = councillor_id;
    issue.final_verified_at = new Date();
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      assigned_by_councillor_id: councillor_id,
      status: "verified_resolved",
      action_type: "final_verified",
      notes: notes || "Issue finally verified as resolved by councillor"
    });
    await history.save();

    // Notify user that issue is resolved
    const notification = new Notification({
      issue_id,
      recipient_id: issue.user_id,
      recipient_model: "User",
      type: "Issue Resolved - Please provide feedback"
    });
    await notification.save();

    res.json({ 
      message: "Issue marked as resolved", 
      issue,
      next_step: "User can now provide feedback"
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

