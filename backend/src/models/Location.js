import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, index: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coords) => Array.isArray(coords) && coords.length === 2,
          message: "Coordinates must include [longitude, latitude]."
        }
      }
    },
    reportCount: { type: Number, default: 0 },
    lastRiskScore: { type: Number, default: 0 },
    lastRiskLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    lastPredictedAt: { type: Date, default: null },
    lastReportAt: { type: Date, default: null }
  },
  { timestamps: true }
);

locationSchema.index({ location: "2dsphere" });
locationSchema.index({ lastRiskLevel: 1, lastPredictedAt: -1 });
locationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

const Location = mongoose.model("Location", locationSchema);

export default Location;