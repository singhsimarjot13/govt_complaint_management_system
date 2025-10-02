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
    status: {
      type: String,
      enum: [
        "open",
        "in-progress", 
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
