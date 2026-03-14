import dayjs from "dayjs";
import Alert from "../models/Alert.js";
import AlertSubscription from "../models/AlertSubscription.js";
import Report from "../models/Report.js";
import { buildReportsCsv, buildReportsPdf } from "../services/exportService.js";
import {
  buildCacheKey,
  getCacheValue,
  invalidateCacheByPrefix,
  setCacheValue
} from "../services/cacheService.js";

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

const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const buildDateFilter = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  const filter = {};
  if (dateFrom) filter.$gte = new Date(dateFrom);
  if (dateTo) filter.$lte = new Date(dateTo);
  return filter;
};

const buildReportQuery = ({ dateFrom, dateTo, location, severity, diseaseType }) => {
  const query = {};
  const dateFilter = buildDateFilter(dateFrom, dateTo);
  if (dateFilter) {
    query.createdAt = dateFilter;
  }

  if (location) {
    query.locationName = {
      $regex: escapeRegExp(sanitizeText(location, 120)),
      $options: "i"
    };
  }

  if (severity) {
    query.severity = severity;
  }

  const normalizedDiseaseType = normalizeDiseaseType(diseaseType, { fallback: null });
  if (normalizedDiseaseType) {
    query.diseaseType = normalizedDiseaseType;
  }

  return query;
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const cacheKey = buildCacheKey("admin-dashboard-summary", {
      role: req.user?.role || "admin"
    });
    const cached = getCacheValue(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const sevenDaysAgo = dayjs().subtract(7, "day").toDate();

    const [
      totalReports,
      highRiskReports,
      mediumRiskReports,
      activeAlerts,
      reportsThisWeek,
      recentReports,
      regionBreakdownRaw,
      diseaseBreakdownRaw
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ aiRiskLevel: "High" }),
      Report.countDocuments({ aiRiskLevel: "Medium" }),
      Alert.countDocuments({ isActive: true }),
      Report.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Report.find().sort({ createdAt: -1 }).limit(10),
      Report.aggregate([
        {
          $group: {
            _id: "$locationName",
            totalReports: { $sum: 1 },
            avgRiskScore: { $avg: "$aiRiskScore" }
          }
        },
        { $sort: { totalReports: -1 } },
        { $limit: 12 }
      ]),
      Report.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$diseaseType", "Unknown"] },
            totalReports: { $sum: 1 },
            avgRiskScore: { $avg: "$aiRiskScore" }
          }
        },
        { $sort: { totalReports: -1 } }
      ])
    ]);

    const diseaseBreakdown = diseaseBreakdownRaw.map((item) => ({
      diseaseType: DISEASE_TYPES.includes(item._id) ? item._id : "Unknown",
      totalReports: item.totalReports,
      avgRiskScore: Number((item.avgRiskScore || 0).toFixed(3))
    }));

    const regionBreakdown = regionBreakdownRaw.map((area) => ({
      locationName: area._id,
      totalReports: area.totalReports,
      avgRiskScore: Number((area.avgRiskScore || 0).toFixed(3))
    }));

    const totalReportsByDisease = diseaseBreakdown.reduce((acc, item) => {
      acc[item.diseaseType] = item.totalReports;
      return acc;
    }, {});

    const payload = {
      stats: {
        totalReports,
        highRiskReports,
        mediumRiskReports,
        activeAlerts,
        reportsThisWeek
      },
      recentReports: recentReports.map((report) => ({
        id: report._id,
        locationName: report.locationName,
        riskLevel: report.aiRiskLevel,
        riskScore: report.aiRiskScore,
        createdAt: report.createdAt
      })),
      areaBreakdown: regionBreakdown,
      regionBreakdown,
      diseaseBreakdown,
      totalReportsByDisease
    };

    setCacheValue(cacheKey, payload, 20_000);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const { includeResolved } = req.query;
    const query = includeResolved === "true" ? {} : { isActive: true };

    const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(100);
    return res.json({ alerts });
  } catch (error) {
    return next(error);
  }
};

export const resolveAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { isActive: false },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Alert not found." });
    }

    invalidateCacheByPrefix("admin-dashboard-summary");

    return res.json({ message: "Alert resolved.", alert });
  } catch (error) {
    return next(error);
  }
};

export const exportReportsCsv = async (req, res, next) => {
  try {
    const dateFrom = req.query?.dateFrom ? toDate(req.query.dateFrom) : null;
    const dateTo = req.query?.dateTo ? toDate(req.query.dateTo) : null;

    if ((req.query?.dateFrom && !dateFrom) || (req.query?.dateTo && !dateTo)) {
      return res.status(400).json({ message: "dateFrom/dateTo must be valid date values." });
    }

    const query = buildReportQuery({ ...req.query, dateFrom, dateTo });
    const reports = await Report.find(query).sort({ createdAt: -1 }).limit(5000);
    const csv = buildReportsCsv(reports);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=reports-${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    return next(error);
  }
};

export const exportReportsPdf = async (req, res, next) => {
  try {
    const dateFrom = req.query?.dateFrom ? toDate(req.query.dateFrom) : null;
    const dateTo = req.query?.dateTo ? toDate(req.query.dateTo) : null;

    if ((req.query?.dateFrom && !dateFrom) || (req.query?.dateTo && !dateTo)) {
      return res.status(400).json({ message: "dateFrom/dateTo must be valid date values." });
    }

    const query = buildReportQuery({ ...req.query, dateFrom, dateTo });
    const reports = await Report.find(query).sort({ createdAt: -1 }).limit(500);
    const pdfBuffer = await buildReportsPdf(reports);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=reports-${Date.now()}.pdf`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
};

export const listAlertSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await AlertSubscription.find().sort({ createdAt: -1 }).limit(500);
    return res.json({ subscriptions });
  } catch (error) {
    return next(error);
  }
};
