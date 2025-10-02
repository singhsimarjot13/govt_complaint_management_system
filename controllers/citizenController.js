import Issue from "../models/issues.js";
import IssueHistory from "../models/issue_history.js";
import Notification from "../models/notifications.js";
import Ward from "../models/ward.js";
import Department from "../models/dept.js";
import Reward from "../models/rewards.js";

// Create new issue
export const createIssue = async (req, res) => {
  try {
    const { 
      category, 
      description, 
      ward_id, 
      photos, 
      gps_coordinates 
    } = req.body;
    
    const user_id = req.user.id;

    // Find appropriate department based on category
    const department = await Department.findOne({ name: category });
    if (!department) {
      return res.status(400).json({ message: "Department not found for this category" });
    }

    const issue = new Issue({
      user_id,
      ward_id: ward_id || null, // Can be null if user doesn't know
      category,
      description,
      current_department_id: department._id,
      photos: photos || [],
      gps_coordinates: gps_coordinates || {},
      status: "open"
    });

    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id: issue._id,
      status: "open"
    });
    await history.save();

    // If ward is specified, notify councillor
    if (ward_id) {
      const ward = await Ward.findById(ward_id);
      if (ward && ward.councillor_id) {
        const notification = new Notification({
          issue_id: issue._id,
          recipient_id: ward.councillor_id,
          recipient_model: "Councillor",
          type: "Issue Assigned"
        });
        await notification.save();
      }
    }

    res.status(201).json({ 
      message: "Issue created successfully", 
      issue 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get user's issues
export const getUserIssues = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const issues = await Issue.find({ user_id })
      .populate('ward_id', 'name')
      .populate('current_department_id', 'name')
      .populate('current_worker_id', 'name email')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get single issue details
export const getIssueDetails = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const user_id = req.user.id;

    const issue = await Issue.findOne({ _id: issue_id, user_id })
      .populate('ward_id', 'name')
      .populate('current_department_id', 'name')
      .populate('current_worker_id', 'name email contact');

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Get issue history
    const history = await IssueHistory.find({ issue_id })
      .sort({ timestamp: -1 });

    res.json({ issue, history });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Submit feedback and rating
export const submitFeedback = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { rating, feedback_description } = req.body;
    const user_id = req.user.id;

    const issue = await Issue.findOne({ _id: issue_id, user_id });
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (issue.status !== "resolved") {
      return res.status(400).json({ message: "Can only provide feedback for resolved issues" });
    }

    // Update issue with feedback
    issue.feedback_rating = rating;
    issue.feedback_description = feedback_description;
    await issue.save();

    // Award points to user for providing feedback
    let userReward = await Reward.findOne({ user_id });
    if (!userReward) {
      userReward = new Reward({ user_id, points: 10 });
    } else {
      userReward.points += 10;
    }
    await userReward.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      status: `Feedback submitted - Rating: ${rating}/5`
    });
    await history.save();

    res.json({ 
      message: "Feedback submitted successfully", 
      issue,
      points_awarded: 10
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Reopen issue
export const reopenIssue = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { reason } = req.body;
    const user_id = req.user.id;

    const issue = await Issue.findOne({ _id: issue_id, user_id });
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (issue.status !== "resolved") {
      return res.status(400).json({ message: "Can only reopen resolved issues" });
    }

    // Update issue status
    issue.status = "reopened";
    issue.current_worker_id = null; // Reset worker assignment
    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      status: `Issue reopened - Reason: ${reason || 'Not satisfied with resolution'}`
    });
    await history.save();

    // Notify MC Admin directly (as per flow)
    const mcAdmin = await Department.findById(issue.current_department_id)
      .populate('mc_admin_id');
    
    if (mcAdmin) {
      const notification = new Notification({
        issue_id,
        recipient_id: mcAdmin.mc_admin_id,
        recipient_model: "MC_Admin",
        type: "Reopened"
      });
      await notification.save();
    }

    res.json({ 
      message: "Issue reopened successfully", 
      issue 
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all wards (for issue creation)
export const getWards = async (req, res) => {
  try {
    const wards = await Ward.find()

    
    res.json(wards);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get available categories/departments
export const getCategories = async (req, res) => {
  try {
    const departments = await Department.find()
      .select('name')
      .distinct('name');
    
    res.json(departments);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

