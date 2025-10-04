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
        "verified_by_councillor",
        "assigned_to_department", 
        "in-progress",
        "resolved_by_worker",
        "department_resolved",
        "verified_resolved",
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
    // Workflow tracking fields
    verified_by_councillor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Councillor",
      default: null
    },
    assigned_by_mc_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MC_Admin",
      default: null
    },
    assigned_by_department_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Department Admin user
      default: null
    },
    resolved_by_worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      default: null
    },
    department_verified_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Department Admin user
      default: null
    },
    final_verified_by_councillor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Councillor",
      default: null
    },
    // Worker execution fields
    worker_photos: {
      type: [String], // array of after-work photo URLs
      default: []
    },
    worker_notes: {
      type: String,
      trim: true,
      default: ""
    },
    // Timestamps for workflow stages
    verified_at: {
      type: Date,
      default: null
    },
    assigned_to_department_at: {
      type: Date,
      default: null
    },
    assigned_to_worker_at: {
      type: Date,
      default: null
    },
    resolved_by_worker_at: {
      type: Date,
      default: null
    },
    department_verified_at: {
      type: Date,
      default: null
    },
    final_verified_at: {
      type: Date,
      default: null
    },
  },
  {
    timestamps: true, // createdAt & updatedAt auto-generate
  }
);

export default mongoose.model("Issue", issueSchema);
