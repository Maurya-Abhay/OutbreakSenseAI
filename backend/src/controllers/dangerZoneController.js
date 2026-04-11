import mongoose from "mongoose";
import DangerZone from "../models/DangerZone.js";
import { invalidateCacheByPrefix } from "../services/cacheService.js";

export const listDangerZones = async (req, res, next) => {
  try {
    const { status = "active", page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 50));

    const query = {};
    if (status === "active" || status === "resolved") {
      query.status = status;
    }

    const [total, zones] = await Promise.all([
      DangerZone.countDocuments(query),
      DangerZone.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .populate("createdBy", "name")
        .populate("confirmedReportId", "locationName diseaseType severity")
    ]);

    return res.json({
      total,
      page: pageNum,
      limit: pageSize,
      zones: zones.map(z => ({
        id: z._id,
        name: z.name,
        description: z.description,
        coordinates: z.location.coordinates,
        radius: z.radius,
        riskScore: z.riskScore,
        severity: z.severity,
        status: z.status,
        createdBy: z.createdBy?.name || "System",
        createdAt: z.createdAt,
        confirmedReport: z.confirmedReportId ? {
          id: z.confirmedReportId._id,
          locationName: z.confirmedReportId.locationName,
          diseaseType: z.confirmedReportId.diseaseType
        } : null
      }))
    });
  } catch (error) {
    return next(error);
  }
};

export const getNearbyDangerZones = async (req, res, next) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const distanceKm = Math.min(50, Math.max(1, parseFloat(maxDistance) || 10));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ message: "Valid latitude and longitude required." });
    }

    const zones = await DangerZone.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat]
          },
          $maxDistance: distanceKm * 1000 // convert km to meters
        }
      },
      status: "active"
    })
      .limit(20)
      .populate("createdBy", "name");

    return res.json({
      zones: zones.map(z => ({
        id: z._id,
        name: z.name,
        coordinates: z.location.coordinates,
        radius: z.radius,
        riskScore: z.riskScore,
        severity: z.severity
      }))
    });
  } catch (error) {
    return next(error);
  }
};

export const getSingleZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(zoneId)) {
      return res.status(400).json({ message: "Invalid zone ID." });
    }

    const zone = await DangerZone.findById(zoneId)
      .populate("createdBy", "name")
      .populate("confirmedReportId", "locationName diseaseType severity symptoms");

    if (!zone) {
      return res.status(404).json({ message: "Danger zone not found." });
    }

    return res.json({ zone });
  } catch (error) {
    return next(error);
  }
};

export const createDangerZone = async (req, res, next) => {
  try {
    const { name, description, latitude, longitude, radius = 1.5, riskScore = 80, severity = "high" } = req.body;
    const { userId } = req;

    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: "name, latitude, and longitude are required." });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "Invalid coordinates." });
    }

    const zone = new DangerZone({
      name,
      description: description || "",
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      radius: Math.min(50, Math.max(0.1, parseFloat(radius) || 1.5)),
      riskScore: Math.min(100, Math.max(0, parseInt(riskScore) || 80)),
      severity: ["low", "medium", "high"].includes(severity) ? severity : "high",
      createdBy: userId,
      status: "active"
    });

    await zone.save();

    invalidateCacheByPrefix("danger-zones");

    // Send notification to all users
    const io = req.app.get("io");
    if (io) {
      io.emit("danger-zone:new", {
        id: zone._id,
        name: zone.name,
        coordinates: zone.location.coordinates,
        riskScore: zone.riskScore,
        message: `⚠️ New danger zone: ${zone.name}`
      });
    }

    return res.status(201).json({
      message: "Danger zone created.",
      zone
    });
  } catch (error) {
    return next(error);
  }
};

export const updateDangerZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const { name, description, radius, riskScore, severity, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(zoneId)) {
      return res.status(400).json({ message: "Invalid zone ID." });
    }

    const zone = await DangerZone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ message: "Danger zone not found." });
    }

    if (name) zone.name = name;
    if (description !== undefined) zone.description = description;
    if (radius) zone.radius = Math.min(50, Math.max(0.1, radius));
    if (riskScore !== undefined) zone.riskScore = Math.min(100, Math.max(0, riskScore));
    if (severity && ["low", "medium", "high"].includes(severity)) zone.severity = severity;
    if (status && ["active", "resolved"].includes(status)) zone.status = status;

    await zone.save();

    invalidateCacheByPrefix("danger-zones");

    return res.json({
      message: "Danger zone updated.",
      zone
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteDangerZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(zoneId)) {
      return res.status(400).json({ message: "Invalid zone ID." });
    }

    const zone = await DangerZone.findByIdAndDelete(zoneId);
    if (!zone) {
      return res.status(404).json({ message: "Danger zone not found." });
    }

    invalidateCacheByPrefix("danger-zones");

    return res.json({ message: "Danger zone deleted." });
  } catch (error) {
    return next(error);
  }
};

export const resolveDangerZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(zoneId)) {
      return res.status(400).json({ message: "Invalid zone ID." });
    }

    const zone = await DangerZone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ message: "Danger zone not found." });
    }

    zone.status = "resolved";
    await zone.save();

    invalidateCacheByPrefix("danger-zones");

    return res.json({
      message: "Danger zone marked as resolved.",
      zone
    });
  } catch (error) {
    return next(error);
  }
};
