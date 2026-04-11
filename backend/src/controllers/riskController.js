import dayjs from "dayjs";
import Report from "../models/Report.js";
import { predictRisk, predictRiskBatch } from "../services/aiService.js";
import { recordPrediction } from "../services/predictionStoreService.js";
import { 
  buildCacheKey, 
  getCacheValue, 
  setCacheValue,
  getCachedLocationPrediction,
  setCachedLocationPrediction,
  invalidateLocationPrediction
} from "../services/cacheService.js";

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoundedNumber = (value, min, max, fallback) => {
  const parsed = toNumber(value, fallback);
  return Math.min(max, Math.max(min, parsed));
};

const sanitizeText = (value, maxLength = 120) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);

const DISEASE_TYPES = ["Dengue", "Malaria", "COVID-19", "Chikungunya", "Flu", "Unknown"];

const normalizeDiseaseType = (value, { fallback = "Unknown" } = {}) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (normalized === "dengue") return "Dengue";
  if (normalized === "malaria") return "Malaria";
  if (normalized === "covid19") return "COVID-19";
  if (normalized === "chikungunya") return "Chikungunya";
  if (normalized === "flu") return "Flu";
  if (normalized === "unknown") return "Unknown";

  return fallback;
};

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const countNearbyPastCases = async ({ latitude, longitude, days = 30, maxDistanceMeters = 5000 }) => {
  const sinceDate = dayjs().subtract(days, "day").toDate();

  const result = await Report.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "distance",
        maxDistance: maxDistanceMeters,
        spherical: true,
        query: {
          createdAt: { $gte: sinceDate }
        }
      }
    },
    {
      $count: "total"
    }
  ]);

  return result[0]?.total || 0;
};

const scoreToWeight = (score) => Number((score * 100).toFixed(1));

const fallbackHeatmap = [
  {
    locationName: "City Center",
    latitude: 23.8103,
    longitude: 90.4125,
    averageRisk: 0.35,
    riskLevel: "Low",
    totalReports: 3,
    diseaseType: "Unknown"
  },
  {
    locationName: "North Zone",
    latitude: 23.855,
    longitude: 90.42,
    averageRisk: 0.62,
    riskLevel: "Medium",
    totalReports: 6,
    diseaseType: "Unknown"
  },
  {
    locationName: "River Belt",
    latitude: 23.74,
    longitude: 90.38,
    averageRisk: 0.79,
    riskLevel: "High",
    totalReports: 8,
    diseaseType: "Unknown"
  }
];

export const getCurrentRisk = async (req, res, next) => {
  try {
    const latitude = toNumber(req.query.latitude, NaN);
    const longitude = toNumber(req.query.longitude, NaN);
    const diseaseTypeInput = sanitizeText(req.query.diseaseType || "", 40);
    const normalizedDiseaseType = diseaseTypeInput
      ? normalizeDiseaseType(diseaseTypeInput, { fallback: null })
      : "Unknown";

    if (!normalizedDiseaseType) {
      return res
        .status(400)
        .json({ message: `diseaseType must be one of: ${DISEASE_TYPES.join(", ")}.` });
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: "latitude and longitude query params are required." });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "latitude/longitude are outside valid geographic ranges." });
    }

    const temperature = toBoundedNumber(req.query.temperature, -20, 60, 30);
    const rainfall = toBoundedNumber(req.query.rainfall, 0, 1500, 150);
    const humidity = toBoundedNumber(req.query.humidity, 0, 100, 70);

    const pastCases = await countNearbyPastCases({
      latitude,
      longitude
    });

    const prediction = await predictRisk({
      latitude,
      longitude,
      temperature,
      rainfall,
      humidity,
      pastCases,
      diseaseType: normalizedDiseaseType
    });

    const locationName = sanitizeText(req.query.locationName || "Live Query Area", 120);

    await recordPrediction({
      locationName,
      latitude,
      longitude,
      temperature,
      rainfall,
      humidity,
      pastCases,
      diseaseType: normalizedDiseaseType,
      prediction,
      requestedBy: "risk-api"
    });

    return res.json({
      location: { latitude, longitude, locationName },
      inputs: { temperature, rainfall, humidity, pastCases, diseaseType: normalizedDiseaseType },
      ...prediction
    });
  } catch (error) {
    return next(error);
  }
};

export const getHeatmapRisk = async (req, res, next) => {
  try {
    const dateFrom = req.query?.dateFrom ? toDate(req.query.dateFrom) : null;
    const dateTo = req.query?.dateTo ? toDate(req.query.dateTo) : null;
    const severity = sanitizeText(req.query?.severity || "", 24);
    const diseaseTypeInput = sanitizeText(req.query?.diseaseType || "", 40);
    const diseaseType = diseaseTypeInput
      ? normalizeDiseaseType(diseaseTypeInput, { fallback: null })
      : "";
    
    // Pagination params
    const page = Math.max(1, toNumber(req.query?.page, 1));
    const limit = Math.min(100, Math.max(1, toNumber(req.query?.limit, 50)));
    const skip = (page - 1) * limit;

    if ((req.query?.dateFrom && !dateFrom) || (req.query?.dateTo && !dateTo)) {
      return res.status(400).json({ message: "dateFrom/dateTo must be valid date values." });
    }

    if (severity && !["Low", "Medium", "High"].includes(severity)) {
      return res.status(400).json({ message: "severity must be one of Low, Medium, High." });
    }

    if (diseaseTypeInput && !diseaseType) {
      return res
        .status(400)
        .json({ message: `diseaseType must be one of: ${DISEASE_TYPES.join(", ")}.` });
    }

    const cacheKey = buildCacheKey("risk-heatmap", {
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      severity,
      diseaseType,
      page,
      limit
    });
    const cached = getCacheValue(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }
    if (severity) {
      matchStage.aiRiskLevel = severity;
    }
    if (diseaseType) {
      matchStage.diseaseType = diseaseType;
    }

    // Get total count for pagination
    const totalCount = await Report.countDocuments(matchStage);

    const grouped = await Report.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$locationName",
          location: { $last: "$location.coordinates" },
          averageRisk: { $avg: "$aiRiskScore" },
          totalReports: { $sum: 1 },
          latestRiskLevel: { $last: "$aiRiskLevel" },
          latestWeather: { $last: "$weather" },
          latestDiseaseType: { $last: "$diseaseType" }
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);

    if (!grouped.length) {
      const payload = {
        points: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
      setCacheValue(cacheKey, payload, 45_000);
      return res.json(payload);
    }

    const aiInputBatch = grouped.map((item) => ({
      location_name: item._id,
      latitude: item.location[1],
      longitude: item.location[0],
      temperature: item.latestWeather?.temperature ?? 30,
      rainfall: item.latestWeather?.rainfall ?? 150,
      humidity: item.latestWeather?.humidity ?? 70,
      past_cases: item.totalReports,
      disease_type: item.latestDiseaseType || "Unknown"
    }));

    // Check cache for each location to avoid redundant predictions
    const cachedPredictions = {};
    const uncachedInputs = [];
    const uncachedItemIndexes = [];

    for (let i = 0; i < aiInputBatch.length; i++) {
      const item = aiInputBatch[i];
      const cached = getCachedLocationPrediction(item.location_name);
      
      if (cached) {
        cachedPredictions[item.location_name] = cached;
        console.log(`[Heatmap] Cache HIT for ${item.location_name}`);
      } else {
        uncachedInputs.push(item);
        uncachedItemIndexes.push(i);
      }
    }

    // Only predict uncached locations
    let freshPredictions = [];
    if (uncachedInputs.length > 0) {
      console.log(`[Heatmap] Cache MISS for ${uncachedInputs.length}/${aiInputBatch.length} locations`);
      freshPredictions = await predictRiskBatch(uncachedInputs);
      
      // Cache fresh predictions
      for (const pred of freshPredictions) {
        setCachedLocationPrediction(pred.location_name, pred);
      }
    } else {
      console.log(`[Heatmap] All ${aiInputBatch.length} locations cached - using cache`);
    }

    // Merge cached and fresh predictions
    const predictionLookup = {
      ...cachedPredictions,
      ...freshPredictions.reduce((acc, item) => {
        acc[item.location_name] = item;
        return acc;
      }, {})
    };

    const points = grouped.map((item) => {
      const prediction = predictionLookup[item._id];
      const averageRisk = prediction?.risk_score ?? item.averageRisk;

      return {
        locationName: item._id,
        latitude: item.location[1],
        longitude: item.location[0],
        averageRisk: Number(averageRisk.toFixed(3)),
        riskLevel: prediction?.risk_level || item.latestRiskLevel,
        totalReports: item.totalReports,
        intensity: scoreToWeight(averageRisk),
        diseaseType: item.latestDiseaseType || "Unknown",
        explainability: prediction?.explainability || null
      };
    });

    const payload = {
      points,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
    setCacheValue(cacheKey, payload, 45_000);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

export const getRiskTrends = async (req, res, next) => {
  try {
    const period = req.query?.period === "monthly" ? "monthly" : "weekly";
    const dateFrom = req.query?.dateFrom ? toDate(req.query.dateFrom) : null;
    const dateTo = req.query?.dateTo ? toDate(req.query.dateTo) : null;

    if ((req.query?.dateFrom && !dateFrom) || (req.query?.dateTo && !dateTo)) {
      return res.status(400).json({ message: "dateFrom/dateTo must be valid date values." });
    }

    const cacheKey = buildCacheKey("risk-trends", {
      period,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString()
    });
    const cached = getCacheValue(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    const query = {};
    if (Object.keys(dateFilter).length) {
      query.createdAt = dateFilter;
    }

    const dateFormat = period === "monthly" ? "%Y-%m" : "%Y-%U";

    const trends = await Report.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          averageRisk: { $avg: "$aiRiskScore" },
          reportCount: { $sum: 1 },
          highRiskCount: {
            $sum: {
              $cond: [{ $eq: ["$aiRiskLevel", "High"] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const payload = {
      period,
      trends: trends.map((item) => ({
        label: item._id,
        averageRisk: Number(item.averageRisk.toFixed(3)),
        reportCount: item.reportCount,
        highRiskCount: item.highRiskCount
      }))
    };

    setCacheValue(cacheKey, payload, 35_000);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

export const getLocationHistory = async (req, res, next) => {
  try {
    const locationName = sanitizeText(decodeURIComponent(req.params.locationName || ""), 120);

    if (!locationName) {
      return res.status(400).json({ message: "locationName path param is required." });
    }

    // Pagination params
    const page = Math.max(1, toNumber(req.query?.page, 1));
    const limit = Math.min(100, Math.max(1, toNumber(req.query?.limit, 20)));
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Report.countDocuments({
      locationName: { $regex: `^${locationName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
    });

    const reports = await Report.find({
      locationName: { $regex: `^${locationName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      locationName,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      history: reports.map((report) => ({
        id: report._id,
        date: report.createdAt,
        riskScore: report.aiRiskScore,
        riskLevel: report.aiRiskLevel,
        diseaseType: report.diseaseType || "Unknown",
        symptoms: report.symptoms,
        severity: report.severity
      }))
    });
  } catch (error) {
    return next(error);
  }
};
