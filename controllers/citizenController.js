import Issue from "../models/issues.js";
import IssueHistory from "../models/issue_history.js";
import Notification from "../models/notifications.js";
import { createNotification } from "../utils/notificationHelper.js";
import Ward from "../models/ward.js";
import Department from "../models/dept.js";
import Reward from "../models/rewards.js";
import MC_Admin from "../models/mc_admins.js";
import Councillor from "../models/Councillors.js";
import Vote from "../models/votes.js";
import cloudinary from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
      status: "open",
      action_type: "created",
      notes: "Issue created by citizen"
    });
    await history.save();

    // If ward is specified, notify councillor
    if (ward_id) {
      const ward = await Ward.findById(ward_id);
      if (ward && ward.councillor_id) {
        await createNotification({
          issue_id: issue._id,
          recipient_id: ward.councillor_id,
          recipient_model: "Councillor",
          desiredType: "Issue Assigned",
        });
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
      .populate('ward_id', 'ward_name')
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

    if (issue.status !== "verified_resolved") {
      return res.status(400).json({ message: "Can only provide feedback for verified resolved issues" });
    }

    // Update issue with feedback and mark as resolved
    issue.feedback_rating = rating;
    issue.feedback_description = feedback_description;
    issue.status = "resolved"; // Final status after feedback
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
      status: "resolved",
      action_type: "feedback_submitted",
      notes: `Feedback submitted - Rating: ${rating}/5`
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

    // Store values to preserve
    const preservedValues = {
      user_id: issue.user_id,
      ward_id: issue.ward_id,
      category: issue.category,
      description: issue.description,
      status: "reopened",
      priority: issue.priority,
      gps_coordinates: issue.gps_coordinates,
      photos: issue.photos,
      verified_by_councillor_id: issue.verified_by_councillor_id,
      verified_at: issue.verified_at
    };

    // Clear all fields except preserved ones
    const fieldsToClear = [
      'current_department_id', 'current_worker_id', 'feedback_rating', 'feedback_description',
      'assigned_by_mc_admin_id', 'assigned_by_department_admin_id', 'resolved_by_worker_id',
      'department_verified_by_id', 'final_verified_by_councillor_id', 'worker_photos',
      'worker_notes', 'assigned_to_department_at', 'assigned_to_worker_at', 'resolved_by_worker_at',
      'department_verified_at', 'final_verified_at'
    ];

    // Reset all fields to default values
    fieldsToClear.forEach(field => {
      issue[field] = field === 'worker_photos' ? [] : 
                    field === 'worker_notes' || field === 'feedback_description' ? "" :
                    field === 'feedback_rating' ? null : null;
    });

    // Set preserved values
    Object.keys(preservedValues).forEach(key => {
      issue[key] = preservedValues[key];
    });

    await issue.save();

    // Create history entry
    const history = new IssueHistory({
      issue_id,
      status: "reopened",
      action_type: "reopened",
      notes: `Issue reopened - Reason: ${reason || 'Not satisfied with resolution'}. All workflow data cleared.`
    });
    await history.save();

    // Notify MC Admin directly (as per flow)
    const mcAdmin = await Department.findById(issue.current_department_id)
      .populate('mc_admin_id');
    
    if (mcAdmin) {
      await createNotification({
        issue_id,
        recipient_id: mcAdmin.mc_admin_id,
        recipient_model: "MC_Admin",
        desiredType: "Reopened",
      });
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

// Get wards by city
export const getWardsByCity = async (req, res) => {
  try {
    const { city } = req.params;
    console.log("City:", city); 
    // Find MC Admin by city
    const mcAdmin = await MC_Admin.findOne({ city: city });
    console.log("MC Admin:", mcAdmin);
    if (!mcAdmin) {
      return res.status(404).json({ message: "MC Admin not found for this city" });
    }

    // Find all councillors linked to this MC Admin
    const councillors = await Councillor.find({ mc_admin_id: mcAdmin.user_id });
    
    // Get ward IDs from councillors
    const wardIds = councillors.map(councillor => councillor.ward_id);
    console.log("Ward IDs:", wardIds);
    // Fetch wards
    const wards = await Ward.find({ _id: { $in: wardIds } });
    console.log("Wards:", wards);
    res.json(wards);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all cities (MC Admin cities)
export const getCities = async (req, res) => {
  try {
    const cities = await MC_Admin.find()
      .select('city')
      .distinct('city');
    
    res.json(cities);
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
        { resource_type: "auto",
          folder: "govt_records"
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

// Get all issues for voting (excluding user's own issues)
export const getAllIssuesForVoting = async (req, res) => {
  try {
    const user_id = req.user.id;

    const issues = await Issue.find({ user_id: { $ne: user_id } })
      .populate('user_id', 'name')
      .populate('ward_id', 'ward_name')
      .populate('current_department_id', 'name')
      .populate('current_worker_id', 'name')
      .sort({ createdAt: -1 });

    // Get vote counts for each issue
    const issuesWithVotes = await Promise.all(
      issues.map(async (issue) => {
        const existsVotes = await Vote.countDocuments({ 
          issue_id: issue._id, 
          vote_type: 'exists' 
        });
        const notExistsVotes = await Vote.countDocuments({ 
          issue_id: issue._id, 
          vote_type: 'not_exists' 
        });
        
        // Check if current user has voted
        const userVote = await Vote.findOne({ 
          issue_id: issue._id, 
          voter_id: user_id 
        });

        return {
          ...issue.toObject(),
          voteCounts: {
            exists: existsVotes,
            notExists: notExistsVotes,
            total: existsVotes + notExistsVotes
          },
          userVote: userVote ? userVote.vote_type : null
        };
      })
    );

    res.json(issuesWithVotes);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Vote on an issue
export const voteOnIssue = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { vote_type } = req.body;
    const voter_id = req.user.id;

    // Check if issue exists and is not user's own issue
    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (issue.user_id.toString() === voter_id) {
      return res.status(400).json({ message: "Cannot vote on your own issue" });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({ issue_id, voter_id });
    
    if (existingVote) {
      // Update existing vote
      existingVote.vote_type = vote_type;
      await existingVote.save();
    } else {
      // Create new vote
      const vote = new Vote({
        issue_id,
        voter_id,
        vote_type
      });
      await vote.save();
    }

    // Get updated vote counts
    const existsVotes = await Vote.countDocuments({ 
      issue_id, 
      vote_type: 'exists' 
    });
    const notExistsVotes = await Vote.countDocuments({ 
      issue_id, 
      vote_type: 'not_exists' 
    });

    res.json({ 
      message: "Vote recorded successfully",
      voteCounts: {
        exists: existsVotes,
        notExists: notExistsVotes,
        total: existsVotes + notExistsVotes
      },
      userVote: vote_type
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Remove vote from an issue
export const removeVote = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const voter_id = req.user.id;

    const vote = await Vote.findOneAndDelete({ issue_id, voter_id });
    
    if (!vote) {
      return res.status(404).json({ message: "Vote not found" });
    }

    // Get updated vote counts
    const existsVotes = await Vote.countDocuments({ 
      issue_id, 
      vote_type: 'exists' 
    });
    const notExistsVotes = await Vote.countDocuments({ 
      issue_id, 
      vote_type: 'not_exists' 
    });

    res.json({ 
      message: "Vote removed successfully",
      voteCounts: {
        exists: existsVotes,
        notExists: notExistsVotes,
        total: existsVotes + notExistsVotes
      },
      userVote: null
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

