import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    issue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue", // FK → Issues
      required: true,
    },
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipient_model", // dynamic reference
    },
    recipient_model: {
      type: String,
      required: true,
      enum: ["User", "Councillor", "MC_Admin", "Worker"], // specify which collection
    },
    type: {
      type: String,
      enum: [
        "Issue Assigned",
        "Status Update",
        "Reassigned",
        "Completed",
        "Reopened",
      ],
      required: true,
    },
    read_flag: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

export default mongoose.model("Notification", notificationSchema);
