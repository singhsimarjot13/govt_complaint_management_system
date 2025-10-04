import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    issue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
    },
    voter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vote_type: {
      type: String,
      enum: ["exists", "not_exists"],
      required: true,
    },
    // Ensure one vote per citizen per issue
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure one vote per citizen per issue
voteSchema.index({ issue_id: 1, voter_id: 1 }, { unique: true });

export default mongoose.model("Vote", voteSchema);
