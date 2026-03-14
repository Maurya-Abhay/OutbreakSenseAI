import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    locationName: { type: String, required: true },
    severity: { type: String, enum: ["medium", "high"], required: true },
    riskScore: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

alertSchema.index({ isActive: 1, createdAt: -1 });
alertSchema.index({ locationName: 1, isActive: 1, createdAt: -1 });

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
