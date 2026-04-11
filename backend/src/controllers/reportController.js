import dayjs from "dayjs";
import mongoose from "mongoose";
import Report from "../models/Report.js";
import { predictRisk } from "../services/aiService.js";
import { maybeCreateRiskAlert } from "../services/alertService.js";
import { invalidateCacheByPrefix } from "../services/cacheService.js";
import { recordPrediction } from "../services/predictionStoreService.js";
import { sendReportConfirmation } from "../services/emailService.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const normalizeEmail = (value) => sanitizeText(value, 160).toLowerCase();

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

const normalizeRoomKey = (locationName) =>
  sanitizeText(locationName, 120)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

const parseOptionalBoolean = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  return undefined;
};

const normalizeSymptoms = (symptoms) => {
  if (Array.isArray(symptoms)) {
    return symptoms.map((item) => sanitizeText(item, 80)).filter(Boolean).slice(0, 20);
  }

  if (typeof symptoms === "string") {
    return symptoms
      .split(",")
      .map((item) => sanitizeText(item, 80))
      .filter(Boolean)
      .slice(0, 20);
  }

  return [];
};

const serializeVerifiedBy = (verifiedBy) => {
  if (!verifiedBy) {
    return null;
  }

  if (typeof verifiedBy === "object") {
    return {
      id: verifiedBy._id || verifiedBy.id || null,
      name: verifiedBy.name
    };
  }

  return { id: verifiedBy };
};

const serializeReport = (report, { includeReporterEmail = true } = {}) => {
  const payload = {
    id: report._id,
    reporterName: report.reporterName,
    diseaseType: report.diseaseType || "Unknown",
    age: report.age,
    symptoms: report.symptoms,
    notes: report.notes,
    severity: report.severity,
    locationName: report.locationName,
    latitude: report.location.coordinates[1],
    longitude: report.location.coordinates[0],
    weather: report.weather,
    aiRiskScore: report.aiRiskScore,
    aiRiskLevel: report.aiRiskLevel,
    aiPredictionSource: report.aiPredictionSource,
    aiExplainability: report.aiExplainability,
    isVerified: report.isVerified,
    verifiedAt: report.verifiedAt,
    verifiedBy: serializeVerifiedBy(report.verifiedBy),
    createdAt: report.createdAt
  };

  if (includeReporterEmail) {
    payload.reporterEmail = report.reporterEmail;
  }

  return payload;
};

const buildReportQuery = ({ dateFrom, dateTo, location, severity, diseaseType, verified }) => {
  const query = {};

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = dateFrom;
    if (dateTo) query.createdAt.$lte = dateTo;
  }

  if (location) {
    query.locationName = { $regex: escapeRegExp(sanitizeText(location, 120)), $options: "i" };
  }

  if (severity) {
    query.severity = severity;
  }

  const normalizedDiseaseType = normalizeDiseaseType(diseaseType, { fallback: null });
  if (normalizedDiseaseType) {
    query.diseaseType = normalizedDiseaseType;
  }

  const verifiedFilter = parseOptionalBoolean(verified);
  if (verifiedFilter !== undefined) {
    query.isVerified = verifiedFilter;
  }

  return query;
};

const readPagination = ({ page = 1, limit = 20 }) => {
  const pageNumber = Math.max(toNumber(page, 1), 1);
  const pageSize = Math.min(Math.max(toNumber(limit, 20), 1), 100);

  return {
    pageNumber,
    pageSize
  };
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

export const submitCitizenReport = async (req, res, next) => {
  try {
    const {
      reporterName,
      reporterEmail,
      name,
      email,
      age,
      symptoms,
      diseaseType,
      notes,
      severity,
      locationName,
      latitude,
      longitude
    } = req.body;
    const weather = req.body?.weather || {};

    const reporterNameInput = reporterName ?? name;
    const reporterEmailInput = reporterEmail ?? email;

    if (!reporterNameInput || !locationName || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Missing required fields for report submission." });
    }

    const normalizedReporterName = sanitizeText(reporterNameInput, 80);
    const normalizedLocationName = sanitizeText(locationName, 120);
    const normalizedReporterEmail = reporterEmailInput ? normalizeEmail(reporterEmailInput) : undefined;
    const normalizedDiseaseType =
      diseaseType === undefined || diseaseType === null || diseaseType === ""
        ? "Unknown"
        : normalizeDiseaseType(diseaseType, { fallback: null });

    if (!normalizedDiseaseType) {
      return res.status(400).json({
        message: `diseaseType must be one of: ${DISEASE_TYPES.join(", ")}.`
      });
    }

    if (normalizedReporterEmail && !emailRegex.test(normalizedReporterEmail)) {
      return res.status(400).json({ message: "Invalid reporter email format." });
    }

    const hasAge = !(age === undefined || age === null || age === "");
    const normalizedAge = hasAge ? Math.round(toNumber(age, NaN)) : null;
    if (hasAge && (!Number.isFinite(normalizedAge) || normalizedAge < 1 || normalizedAge > 120)) {
      return res.status(400).json({ message: "Age must be between 1 and 120." });
    }

    const numericLatitude = toNumber(latitude, NaN);
    const numericLongitude = toNumber(longitude, NaN);

    if (!Number.isFinite(numericLatitude) || !Number.isFinite(numericLongitude)) {
      return res.status(400).json({ message: "Latitude and longitude must be valid numbers." });
    }

    if (numericLatitude < -90 || numericLatitude > 90 || numericLongitude < -180 || numericLongitude > 180) {
      return res.status(400).json({ message: "Latitude/longitude are outside valid geographic ranges." });
    }

    const temperature = toBoundedNumber(weather.temperature, -20, 60, 30);
    const rainfall = toBoundedNumber(weather.rainfall, 0, 1500, 140);
    const humidity = toBoundedNumber(weather.humidity, 0, 100, 70);

    const pastCases = await countNearbyPastCases({
      latitude: numericLatitude,
      longitude: numericLongitude
    });

    // Pull prediction from AI engine (or fallback scoring if AI engine is unavailable).
    const prediction = await predictRisk({
      latitude: numericLatitude,
      longitude: numericLongitude,
      temperature,
      rainfall,
      humidity,
      pastCases,
      diseaseType: normalizedDiseaseType
    });

    const report = await Report.create({
      reporterName: normalizedReporterName,
      reporterEmail: normalizedReporterEmail,
      age: normalizedAge,
      symptoms: normalizeSymptoms(symptoms),
      diseaseType: normalizedDiseaseType,
      notes: sanitizeText(notes || "", 500),
      severity: ["low", "medium", "high"].includes(severity) ? severity : "medium",
      locationName: normalizedLocationName,
      location: {
        type: "Point",
        coordinates: [numericLongitude, numericLatitude]
      },
      weather: {
        temperature,
        rainfall,
        humidity
      },
      aiRiskScore: prediction.risk_score,
      aiRiskLevel: prediction.risk_level,
      aiPredictionSource: prediction.source || "ai-engine",
      aiExplainability: {
        topFactors: (prediction.explainability?.top_factors || []).map((factor) => ({
          factor: factor.factor,
          contribution: factor.contribution
        }))
      }
    });

    await recordPrediction({
      locationName: report.locationName,
      latitude: numericLatitude,
      longitude: numericLongitude,
      temperature,
      rainfall,
      humidity,
      pastCases,
      diseaseType: normalizedDiseaseType,
      prediction,
      requestedBy: "report-submission",
      relatedReport: report._id,
      incrementLocationReportCount: true,
      reportDate: report.createdAt
    });

    // Emit real-time updates so web/mobile maps refresh instantly.
    const io = req.app.get("io");
    if (io) {
      const publicReport = serializeReport(report, { includeReporterEmail: false });
      const roomKey = normalizeRoomKey(report.locationName);

      io.to("public").emit("report:new", publicReport);
      io.to("admin").emit("report:new:admin", serializeReport(report));

      if (roomKey) {
        io.to(`location:${roomKey}`).emit("report:new", publicReport);
      }
    }

    await maybeCreateRiskAlert({
      locationName: report.locationName,
      riskScore: report.aiRiskScore,
      io
    });

    invalidateCacheByPrefix("risk-heatmap");
    invalidateCacheByPrefix("risk-trends");
    invalidateCacheByPrefix("admin-dashboard-summary");

    // Send confirmation email asynchronously (don't block response)
    if (normalizedReporterEmail) {
      setImmediate(() => {
        const reportUrl = process.env.APP_URL
          ? `${process.env.APP_URL}/reports/${report._id}`
          : "https://app.outbreaksense.ai/reports";

        sendReportConfirmation({
          email: normalizedReporterEmail,
          recipientName: normalizedReporterName || "User",
          reportId: report._id.toString(),
          locationName: report.locationName,
          reportUrl
        }).catch(err => {
          console.error(`Failed to send report confirmation to ${normalizedReporterEmail}:`, err.message);
        });
      });
    }

    return res.status(201).json({
      message: "Disease report submitted successfully.",
      report: serializeReport(report)
    });
  } catch (error) {
    return next(error);
  }
};

export const getCitizenReportHistory = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.query?.email);
    const locationName = sanitizeText(req.query?.locationName || "", 120);

    if (!email) {
      return res.status(400).json({ message: "email query param is required." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email query value." });
    }

    const query = {
      reporterEmail: email
    };

    if (locationName) {
      query.locationName = { $regex: `^${escapeRegExp(locationName)}$`, $options: "i" };
    }

    const reports = await Report.find(query).sort({ createdAt: -1 }).limit(100);

    return res.json({ reports: reports.map((report) => serializeReport(report, { includeReporterEmail: false })) });
  } catch (error) {
    return next(error);
  }
};

export const listReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const dateFrom = req.query?.dateFrom ? toDate(req.query.dateFrom) : null;
    const dateTo = req.query?.dateTo ? toDate(req.query.dateTo) : null;

    if ((req.query?.dateFrom && !dateFrom) || (req.query?.dateTo && !dateTo)) {
      return res.status(400).json({ message: "dateFrom/dateTo must be valid date values." });
    }

    const query = buildReportQuery({ ...req.query, dateFrom, dateTo });
    const { pageNumber, pageSize } = readPagination({ page, limit });

    const [total, reports] = await Promise.all([
      Report.countDocuments(query),
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
    ]);

    return res.json({
      total,
      page: pageNumber,
      limit: pageSize,
      reports: reports.map((report) => serializeReport(report, { includeReporterEmail: false }))
    });
  } catch (error) {
    return next(error);
  }
};

export const listReportsForAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const dateFrom = req.query?.dateFrom ? toDate(req.query.dateFrom) : null;
    const dateTo = req.query?.dateTo ? toDate(req.query.dateTo) : null;

    if ((req.query?.dateFrom && !dateFrom) || (req.query?.dateTo && !dateTo)) {
      return res.status(400).json({ message: "dateFrom/dateTo must be valid date values." });
    }

    const query = buildReportQuery({ ...req.query, dateFrom, dateTo });
    const { pageNumber, pageSize } = readPagination({ page, limit });

    const [total, reports] = await Promise.all([
      Report.countDocuments(query),
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .populate("verifiedBy", "name")
    ]);

    return res.json({
      total,
      page: pageNumber,
      limit: pageSize,
      reports: reports.map(serializeReport)
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyReportStatus = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const verified = parseOptionalBoolean(req.body?.verified);

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "Invalid report id." });
    }

    if (verified === undefined) {
      return res.status(400).json({ message: "verified must be true or false." });
    }

    const update = verified
      ? {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: req.user._id
        }
      : {
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null
        };

    const report = await Report.findByIdAndUpdate(reportId, update, { new: true }).populate(
      "verifiedBy",
      "name"
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    invalidateCacheByPrefix("admin-dashboard-summary");
    invalidateCacheByPrefix("risk-heatmap");
    invalidateCacheByPrefix("risk-trends");

    return res.json({
      message: verified ? "Report marked as verified." : "Report marked as unverified.",
      report: serializeReport(report)
    });
  } catch (error) {
    return next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════
// NEW: Admin Report Confirmation (creates danger zone)
// ═══════════════════════════════════════════════════════════════════════════════════

export const confirmReportAndCreateZone = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { userId } = req;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "Invalid report id." });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    if (report.submissionStatus === "confirmed") {
      return res.status(400).json({ message: "Report already confirmed." });
    }

    // Import DangerZone model
    const DangerZone = mongoose.model("DangerZone");

    // Update report status
    report.submissionStatus = "confirmed";
    report.isVerified = true;
    report.verifiedBy = userId;
    report.verifiedAt = new Date();
    await report.save();

    // Create or update danger zone
    let dangerZone = await DangerZone.findOne({
      name: report.locationName
    });

    if (!dangerZone) {
      dangerZone = new DangerZone({
        name: report.locationName,
        description: `Confirmed dengue cases. Disease: ${report.diseaseType}`,
        location: report.location,
        radius: 1.5,
        riskScore: report.aiRiskScore || 80,
        severity: report.severity,
        confirmedReportId: report._id,
        createdBy: userId,
        status: "active"
      });
      await dangerZone.save();
    }

    // Send confirmation email if enabled
    if (report.sendConfirmationEmail && report.reporterEmail) {
      setImmediate(() => {
        sendReportConfirmation({
          email: report.reporterEmail,
          recipientName: report.reporterName || "User",
          reportId: report._id.toString(),
          locationName: report.locationName,
          status: "confirmed"
        }).catch(err => {
          console.error(`Failed to send confirmation email:`, err.message);
        });
      });
    }

    invalidateCacheByPrefix("admin-dashboard");
    invalidateCacheByPrefix("risk-heatmap");

    // Notify all users about new danger zone via socket
    const io = req.app.get("io");
    if (io) {
      io.emit("danger-zone:new", {
        id: dangerZone._id,
        name: dangerZone.name,
        location: dangerZone.location,
        riskScore: dangerZone.riskScore,
        message: `⚠️ New danger zone confirmed: ${dangerZone.name}. Disease: ${report.diseaseType}`
      });
    }

    return res.json({
      message: "Report confirmed and danger zone created.",
      report: serializeReport(report),
      dangerZone
    });
  } catch (error) {
    return next(error);
  }
};

// Admin rejects a report
export const rejectReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ message: "Invalid report id." });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    if (report.submissionStatus === "rejected") {
      return res.status(400).json({ message: "Report already rejected." });
    }

    report.submissionStatus = "rejected";
    report.rejectionReason = sanitizeText(reason, 300) || "No reason provided";
    await report.save();

    // Send rejection email if enabled
    if (report.sendConfirmationEmail && report.reporterEmail) {
      setImmediate(() => {
        sendReportConfirmation({
          email: report.reporterEmail,
          recipientName: report.reporterName || "User",
          reportId: report._id.toString(),
          status: "rejected",
          reason: report.rejectionReason
        }).catch(err => {
          console.error(`Failed to send rejection email:`, err.message);
        });
      });
    }

    invalidateCacheByPrefix("admin-dashboard");

    return res.json({
      message: "Report rejected.",
      report: serializeReport(report)
    });
  } catch (error) {
    return next(error);
  }
};

// List pending reports for admin
export const listPendingReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { pageNumber, pageSize } = readPagination({ page, limit });

    const [total, reports] = await Promise.all([
      Report.countDocuments({ submissionStatus: "pending" }),
      Report.find({ submissionStatus: "pending" })
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
    ]);

    return res.json({
      total,
      page: pageNumber,
      limit: pageSize,
      reports: reports.map(r => serializeReport(r))
    });
  } catch (error) {
    return next(error);
  }
};
