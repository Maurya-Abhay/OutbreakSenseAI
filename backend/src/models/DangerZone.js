import mongoose from "mongoose";

const dangerZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
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
    radius: { type: Number, default: 1.5, min: 0.1, max: 50 }, // in km
    riskScore: { type: Number, default: 80, min: 0, max: 100 },
    severity: { type: String, enum: ["low", "medium", "high"], default: "high" },
    confirmedReportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "resolved"], default: "active" },
    notificationSent: { type: Boolean, default: false },
    notificationSentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Geospatial index for nearby zone queries
dangerZoneSchema.index({ "location": "2dsphere" });

export default mongoose.model("DangerZone", dangerZoneSchema);
