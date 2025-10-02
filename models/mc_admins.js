import mongoose from "mongoose";

const mcAdminSchema = new mongoose.Schema(
  {
      email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      ref: "User"
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export default mongoose.model("MC_Admin", mcAdminSchema);
