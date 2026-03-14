import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    locationName: { type: String, required: true, trim: true },
    diseaseType: {
      type: String,
      enum: ["Dengue", "Malaria", "COVID-19", "Chikungunya", "Flu", "Unknown"],
      default: "Unknown"
    },
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
      temperature: { type: Number, required: true },
      rainfall: { type: Number, required: true },
      humidity: { type: Number, required: true }
    },
    pastCases: { type: Number, default: 0 },
    riskScore: { type: Number, required: true, min: 0, max: 1 },
    riskLevel: { type: String, enum: ["Low", "Medium", "High"], required: true },
    explainability: {
      topFactors: [{ factor: String, contribution: Number }]
    },
    source: { type: String, enum: ["ai-engine", "fallback"], default: "ai-engine" },
    requestedBy: { type: String, enum: ["risk-api", "report-submission"], required: true },
    relatedReport: { type: mongoose.Schema.Types.ObjectId, ref: "Report", default: null }
  },
  { timestamps: true }
);

predictionSchema.index({ location: "2dsphere" });
predictionSchema.index({ locationName: 1, createdAt: -1 });
predictionSchema.index({ requestedBy: 1, createdAt: -1 });
predictionSchema.index({ source: 1, createdAt: -1 });

const Prediction = mongoose.model("Prediction", predictionSchema);

export default Prediction;