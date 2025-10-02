import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // FK → Users
      required: true,
      unique: true, // each user has one reward record
    },
    points: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String], // array of badge names
      default: [],
    },
    leaderboard_rank: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export default mongoose.model("Reward", rewardSchema);
