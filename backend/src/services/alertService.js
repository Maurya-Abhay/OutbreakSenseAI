import dayjs from "dayjs";
import Alert from "../models/Alert.js";

const normalizeRoomKey = (locationName) =>
  String(locationName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

export const maybeCreateRiskAlert = async ({ locationName, riskScore, io }) => {
  if (riskScore < 0.7) {
    return null;
  }

  const cutoff = dayjs().subtract(6, "hour").toDate();
  const existingRecentAlert = await Alert.findOne({
    locationName,
    createdAt: { $gte: cutoff },
    isActive: true
  });

  if (existingRecentAlert) {
    return existingRecentAlert;
  }

  const alert = await Alert.create({
    title: "High Disease Outbreak Risk Detected",
    message: `High risk predicted for ${locationName}. Intensify prevention and awareness activities.`,
    locationName,
    severity: "high",
    riskScore
  });

  if (io) {
    const payload = {
      id: alert._id,
      title: alert.title,
      message: alert.message,
      locationName: alert.locationName,
      severity: alert.severity,
      riskScore: alert.riskScore,
      createdAt: alert.createdAt
    };

    const roomKey = normalizeRoomKey(alert.locationName);
    io.to("public").emit("alert:new", payload);
    io.to("admin").emit("alert:new", payload);

    if (roomKey) {
      io.to(`location:${roomKey}`).emit("alert:new", payload);
    }
  }

  return alert;
};
