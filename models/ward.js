import mongoose from "mongoose";

const wardSchema = new mongoose.Schema(
  {
    ward_name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Ward = mongoose.models.Ward || mongoose.model('Ward', wardSchema);
export default Ward;
