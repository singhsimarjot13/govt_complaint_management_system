import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // FK → Users
      required: true,
    },
    ward_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward", // FK → Wards
      default: null, // null if user did not specify
    },
    category: {
      type: String,
      enum: ["Roads", "Sewage", "Water", "Electricity", "Other"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    current_department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department", // FK → Departments
      required: true,
    },
    current_worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker", // FK → Workers
      default: null, // optional
    },
    status: {
      type: String,
      enum: [
        "open",
        "in-progress", 
        "resolved",
        "reopened"
      ],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    gps_coordinates: {
      latitude: { type: Number, required: false },
      longitude: { type: Number, required: false }
    },
    photos: {
      type: [String], // array of photo URLs (Cloudinary)
      default: [],
    },
    feedback_rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    feedback_description: {
      type: String,
      trim: true,
      default: ""
    },
  },
  {
    timestamps: true, // createdAt & updatedAt auto-generate
  }
);

export default mongoose.model("Issue", issueSchema);
