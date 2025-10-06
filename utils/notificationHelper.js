import Notification from "../models/notifications.js";

// Centralized notification creation with enum normalization and awaited save
export async function createNotification({ issue_id, recipient_id, recipient_model, desiredType }) {
  // Allowed types per Notification model
  const allowedTypes = new Set([
    "Issue Assigned",
    "Status Update",
    "Reassigned",
    "Completed",
    "Reopened",
    "Work Completed - Please verify",
    "Issue Verified - Ready for Department Assignment",
    "Issue Assigned - Please assign worker",
    "Issue Transferred - Please assign worker",
    "Issue Resolved - Please provide feedback",
    "Issue Assigned - Please start work",
    "Issue Ready for Final Verification",
  ]);

  const type = allowedTypes.has(desiredType) ? desiredType : "Status Update";

  const notification = new Notification({
    issue_id,
    recipient_id,
    recipient_model,
    type,
  });
  const saved = await notification.save();
  return saved;
}


