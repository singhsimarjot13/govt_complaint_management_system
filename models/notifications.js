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
        "Work Completed - Please verify",
        // Additional types referenced across controllers; mapping helper will normalize
        "Issue Verified - Ready for Department Assignment",
        "Issue Assigned - Please assign worker",
        "Issue Transferred - Please assign worker",
        "Issue Resolved - Please provide feedback"
        ,
        "Issue Assigned - Please start work",
        "Issue Ready for Final Verification"
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
