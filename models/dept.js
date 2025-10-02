import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["Roads", "Sewerage", "Water", "Electricity", "Other"],
      required: true,
    },
    mc_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MC_Admin", // FK → MC_Admin who created this department
      required: true,
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // FK → User with role 'department_admin'
      required: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export default mongoose.model("Department", departmentSchema);
