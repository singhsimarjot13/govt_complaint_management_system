import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department", // FK → Departments
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
      ref: "User"
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export default mongoose.model("Worker", workerSchema);
