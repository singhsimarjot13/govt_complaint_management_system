import mongoose from "mongoose";

const issueHistorySchema = new mongoose.Schema(
  {
    issue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue", // FK → Issues
      required: true,
    },
    previous_department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department", // nullable
      default: null,
    },
    new_department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department", // nullable
      default: null,
    },
    previous_worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker", // nullable
      default: null,
    },
    new_worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker", // nullable
      default: null,
    },
    assigned_ward_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward", // councillor assigns ward
      default: null,
    },
    assigned_by_councillor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Councillor", // nullable
      default: null,
    },
    assigned_by_mc_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MC_Admin",
      default: null,
    },
    assigned_by_department_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Department Admin
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    action_type: {
      type: String,
      enum: [
        "created",
        "verified",
        "ward_assigned",
        "department_assigned",
        "worker_assigned",
        "work_started",
        "work_completed",
        "department_verified",
        "final_verified",
        "feedback_submitted",
        "reopened",
        "transferred",
        "priority_updated",
        "Forwarded to MC Admin",
        "worker_changed"
      ],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "open",
        "verified_by_councillor",
        "assigned_to_department", 
        "in-progress",
        "resolved_by_worker",
        "department_resolved",
        "verified_resolved",
        "resolved",
        "reopened"
      ],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false, // __v disable
  }
);

export default mongoose.model("Issue_History", issueHistorySchema);
