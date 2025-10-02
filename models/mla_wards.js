import mongoose from "mongoose";

const mlaWardSchema = new mongoose.Schema(
  {
    mla_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MLA",
      required: true,
    },
    ward_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique MLA-Ward combinations
mlaWardSchema.index({ mla_id: 1, ward_id: 1 }, { unique: true });

export default mongoose.model("MLA_Ward", mlaWardSchema);