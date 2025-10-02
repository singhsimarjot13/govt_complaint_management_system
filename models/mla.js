import mongoose from "mongoose";

const mlaSchema = new mongoose.Schema(
  {
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
    constituency_location: {
      type: String,
      required: true,
      trim: true,
    },
    wards: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward"
    }]
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export default mongoose.model("MLA", mlaSchema);
