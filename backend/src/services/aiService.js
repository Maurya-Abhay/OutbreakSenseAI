import axios from "axios";
import config from "../config/env.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const scoreToLevel = (score) => {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
};

const fallbackPrediction = ({ temperature, rainfall, humidity, pastCases }) => {
  const normalizedTemp = clamp((temperature - 24) / 14, 0, 1);
  const normalizedRain = clamp(rainfall / 320, 0, 1);
  const normalizedHumidity = clamp((humidity - 40) / 60, 0, 1);
  const normalizedCases = clamp(pastCases / 20, 0, 1);

  const weightedScore =
    normalizedTemp * 0.2 +
    normalizedRain * 0.3 +
    normalizedHumidity * 0.2 +
    normalizedCases * 0.3;

  const roundedScore = Number(weightedScore.toFixed(3));

  return {
    risk_score: roundedScore,
    risk_level: scoreToLevel(roundedScore),
    explainability: {
      top_factors: [
        { factor: "rainfall", contribution: Number((normalizedRain * 0.3).toFixed(3)) },
        { factor: "past_cases", contribution: Number((normalizedCases * 0.3).toFixed(3)) },
        { factor: "temperature", contribution: Number((normalizedTemp * 0.2).toFixed(3)) }
      ]
    },
    source: "fallback"
  };
};

const normalizeExplainability = (explainability) => {
  const factors = Array.isArray(explainability?.top_factors) ? explainability.top_factors : [];

  return {
    top_factors: factors
      .map((factor) => ({
        factor: String(factor.factor || "unknown"),
        contribution: Number(clamp(toNumber(factor.contribution, 0), 0, 1).toFixed(3))
      }))
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 5)
  };
};

const normalizePrediction = (payload, source = "ai-engine") => {
  const riskScore = Number(clamp(toNumber(payload?.risk_score, 0), 0, 1).toFixed(3));
  const riskLevel = ["Low", "Medium", "High"].includes(payload?.risk_level)
    ? payload.risk_level
    : scoreToLevel(riskScore);

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    explainability: normalizeExplainability(payload?.explainability),
    source
  };
};

export const predictRisk = async ({
  latitude,
  longitude,
  temperature,
  rainfall,
  humidity,
  pastCases,
  diseaseType
}) => {
  const payload = {
    latitude,
    longitude,
    temperature,
    rainfall,
    humidity,
    past_cases: pastCases,
    disease_type: diseaseType || "Unknown"
  };

  try {
    const response = await axios.post(`${config.aiEngineUrl}/predict`, payload, {
      timeout: 6000
    });

    return normalizePrediction(response.data, "ai-engine");
  } catch (error) {
    console.warn("AI engine unreachable, using fallback prediction:", error.message);
    return fallbackPrediction({ temperature, rainfall, humidity, pastCases, diseaseType });
  }
};

export const predictRiskBatch = async (batchPayload) => {
  try {
    const response = await axios.post(`${config.aiEngineUrl}/predict-batch`, { points: batchPayload }, {
      timeout: 9000
    });

    const points = Array.isArray(response.data?.points) ? response.data.points : [];
    return points.map((item) => ({
      ...item,
      ...normalizePrediction(item, "ai-engine")
    }));
  } catch (error) {
    console.warn("AI batch prediction failed, using fallback batch:", error.message);

    return batchPayload.map((point) => {
      const prediction = fallbackPrediction({
        temperature: point.temperature,
        rainfall: point.rainfall,
        humidity: point.humidity,
        pastCases: point.past_cases,
        diseaseType: point.disease_type
      });

      return {
        ...point,
        risk_score: prediction.risk_score,
        risk_level: prediction.risk_level,
        explainability: prediction.explainability
      };
    });
  }
};
