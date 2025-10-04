import mongoose from "mongoose";

const councillorSchema = new mongoose.Schema(
  {
    ward_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward", // FK → Wards
      required: true,
    },
    mc_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MC_Admin", // FK → MC_Admin who created this councillor
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      ref:"User"
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export default mongoose.model("Councillor", councillorSchema);
