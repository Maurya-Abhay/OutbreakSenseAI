import dayjs from "dayjs";
import Alert from "../models/Alert.js";
import AlertSubscription from "../models/AlertSubscription.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import DangerZone from "../models/DangerZone.js";
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
      Report.find().sort({ createdAt: -1 }).limit(10).populate("verifiedBy", "name email"),
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
      // Mobile app fields
      pendingReports: await Report.countDocuments({ submissionStatus: "pending" }),
      activeDangerZones: await DangerZone.countDocuments({ status: "active" }),
      totalUsers: await User.countDocuments(),
      alertsThisWeek: reportsThisWeek,
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
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, parseInt(req.query.limit || "20", 10)); // Max 100 per page
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      AlertSubscription.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      AlertSubscription.countDocuments()
    ]);

    return res.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

// ─── User Management ──────────────────────────────────────────────────────────

export const getSystemStats = async (req, res, next) => {
  try {
    const cacheKey = buildCacheKey("admin-system-stats");
    const cached = getCacheValue(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const [totalUsers, adminCount, citizenCount, totalReports, verifiedReports, activeAlerts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "citizen" }),
      Report.countDocuments(),
      Report.countDocuments({ isVerified: true }),
      Alert.countDocuments({ isActive: true })
    ]);

    const sevenDaysAgo = dayjs().subtract(7, "day").toDate();
    const reportsThisWeek = await Report.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const usersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const payload = {
      timestamp: new Date().toISOString(),
      users: {
        total: totalUsers,
        admins: adminCount,
        citizens: citizenCount,
        newThisWeek: usersThisWeek
      },
      reports: {
        total: totalReports,
        verified: verifiedReports,
        pendingVerification: totalReports - verifiedReports,
        newThisWeek: reportsThisWeek
      },
      alerts: {
        active: activeAlerts
      },
      health: {
        status: "operational",
        timestamp: new Date().toISOString()
      }
    };

    setCacheValue(cacheKey, payload, 30_000);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, parseInt(req.query.limit || "20", 10));
    const skip = (page - 1) * limit;
    const role = req.query.role ? (req.query.role === "admin" ? "admin" : "citizen") : undefined;

    const query = role ? { role } : {};
    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    return res.json({
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || null,
        location: u.location || null,
        isVerified: u.isVerified,
        isBanned: Boolean(u.isBanned),
        banReason: u.banReason || null,
        createdAt: u.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Get user's reports count
    const reportsCount = await Report.countDocuments({ createdBy: userId });

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      location: user.location || null,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      reportsCount
    });
  } catch (error) {
    return next(error);
  }
};

export const banUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return res.status(400).json({ message: "Ban reason is required." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isBanned: true,
          banReason: reason.trim().slice(0, 200),
          bannedAt: new Date(),
          bannedBy: req.user._id
        }
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    invalidateCacheByPrefix("admin");

    return res.json({
      message: "User banned successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const unbanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: { isBanned: false },
        $unset: { banReason: "", bannedAt: "", bannedBy: "" }
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    invalidateCacheByPrefix("admin");

    return res.json({
      message: "User unbanned successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent admins from deleting each other
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (targetUser.role === "admin" && targetUser._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Cannot delete other admin accounts." });
    }

    // Delete user's reports as well
    await Report.deleteMany({ createdBy: userId });
    await User.findByIdAndDelete(userId);

    invalidateCacheByPrefix("admin");

    return res.json({ message: "User and associated data deleted successfully." });
  } catch (error) {
    return next(error);
  }
};

export const grantAdminAccess = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role: "admin" } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    invalidateCacheByPrefix("admin");

    return res.json({
      message: "Admin access granted.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const revokeAdminAccess = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role: "citizen" } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    invalidateCacheByPrefix("admin");

    return res.json({
      message: "Admin access revoked.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

