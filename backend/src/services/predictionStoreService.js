import Location from "../models/Location.js";
import Prediction from "../models/Prediction.js";

const normalizeLocationName = (locationName) => String(locationName || "Unknown Area").trim();

const normalizedKey = (locationName) => normalizeLocationName(locationName).toLowerCase();

export const upsertLocationSnapshot = async ({
  locationName,
  latitude,
  longitude,
  riskScore,
  riskLevel,
  incrementReportCount = false,
  reportDate = null
}) => {
  const name = normalizeLocationName(locationName);
  const now = new Date();

  const update = {
    $set: {
      name,
      normalizedName: normalizedKey(name),
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      },
      lastRiskScore: Number(riskScore),
      lastRiskLevel: riskLevel,
      lastPredictedAt: now
    }
  };

  if (incrementReportCount) {
    update.$inc = { reportCount: 1 };
    update.$set.lastReportAt = reportDate || now;
  }

  return Location.findOneAndUpdate(
    { normalizedName: normalizedKey(name) },
    update,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

export const recordPrediction = async ({
  locationName,
  diseaseType,
  latitude,
  longitude,
  temperature,
  rainfall,
  humidity,
  pastCases,
  prediction,
  requestedBy,
  relatedReport = null,
  incrementLocationReportCount = false,
  reportDate = null
}) => {
  const safeLocationName = normalizeLocationName(locationName);

  const predictionDoc = await Prediction.create({
    locationName: safeLocationName,
    diseaseType: diseaseType || "Unknown",
    location: {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)]
    },
    weather: {
      temperature: Number(temperature),
      rainfall: Number(rainfall),
      humidity: Number(humidity)
    },
    pastCases: Number(pastCases) || 0,
    riskScore: Number(prediction.risk_score),
    riskLevel: prediction.risk_level,
    explainability: {
      topFactors: (prediction.explainability?.top_factors || []).map((item) => ({
        factor: item.factor,
        contribution: item.contribution
      }))
    },
    source: prediction.source || "ai-engine",
    requestedBy,
    relatedReport
  });

  await upsertLocationSnapshot({
    locationName: safeLocationName,
    latitude,
    longitude,
    riskScore: prediction.risk_score,
    riskLevel: prediction.risk_level,
    incrementReportCount: incrementLocationReportCount,
    reportDate
  });

  return predictionDoc;
};
