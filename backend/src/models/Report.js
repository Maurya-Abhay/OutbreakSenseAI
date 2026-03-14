import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterName: { type: String, required: true, trim: true },
    reporterEmail: { type: String, trim: true, lowercase: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    symptoms: [{ type: String }],
    diseaseType: {
      type: String,
      required: true,
      enum: ["Dengue", "Malaria", "COVID-19", "Chikungunya", "Flu", "Unknown"],
      default: "Unknown"
    },
    notes: { type: String, default: "" },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    locationName: { type: String, required: true, trim: true },
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
    weather: {
      temperature: { type: Number, default: 30 },
      rainfall: { type: Number, default: 150 },
      humidity: { type: Number, default: 70 }
    },
    aiRiskScore: { type: Number, default: 0 },
    aiRiskLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    aiPredictionSource: { type: String, enum: ["ai-engine", "fallback"], default: "ai-engine" },
    aiExplainability: {
      topFactors: [{ factor: String, contribution: Number }]
    },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

reportSchema.index({ location: "2dsphere" });
reportSchema.index({ locationName: 1, createdAt: -1 });
reportSchema.index({ severity: 1, createdAt: -1 });
reportSchema.index({ diseaseType: 1, createdAt: -1 });
reportSchema.index({ aiRiskLevel: 1, createdAt: -1 });
reportSchema.index({ reporterEmail: 1, createdAt: -1 });
reportSchema.index({ isVerified: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
