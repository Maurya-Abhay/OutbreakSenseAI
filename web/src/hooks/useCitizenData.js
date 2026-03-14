import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { z } from "zod";
import api from "../api/client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5050";
const CACHE_KEY = "nhs19_citizen_data_cache";
const NOTIFICATION_KEY = "nhs19_citizen_browser_notifications";
const CACHE_TTL_MS = 15 * 60 * 1000;

const tipsSchema = z.object({ tips: z.array(z.string()).default([]) }).passthrough();

const heatPointSchema = z
  .object({
    locationName: z.string().default("Unknown Zone"),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    riskLevel: z.string().default("Medium"),
    averageRisk: z.coerce.number().min(0).max(1).default(0),
    totalReports: z.coerce.number().min(0).default(0),
    predictionTrend: z.string().optional(),
    intensity: z.coerce.number().optional()
  })
  .transform((point) => ({
    ...point,
    predictionTrend: point.predictionTrend || "Stable",
    intensity: point.intensity ?? Math.max(8, Math.round(point.averageRisk * 100))
  }));

const heatResponseSchema = z.object({ points: z.array(heatPointSchema).default([]) }).passthrough();

const trendItemSchema = z.object({
  label: z.string().default("N/A"),
  averageRisk: z.coerce.number().min(0).max(1).default(0),
  reportCount: z.coerce.number().min(0).default(0)
});

const trendResponseSchema = z.object({ trends: z.array(trendItemSchema).default([]) }).passthrough();

const historyItemSchema = z
  .object({
    id: z.string().optional(),
    _id: z.string().optional(),
    locationName: z.string().default("Unknown"),
    createdAt: z.string().default(() => new Date().toISOString()),
    aiRiskLevel: z.string().default("Medium"),
    aiRiskScore: z.coerce.number().default(0)
  })
  .passthrough();

const historyResponseSchema = z.object({ reports: z.array(historyItemSchema).default([]) }).passthrough();

const areaHistoryItemSchema = z
  .object({
    riskLevel: z.string().default("Unknown"),
    timestamp: z.string().optional(),
    createdAt: z.string().optional()
  })
  .passthrough();

const areaHistoryResponseSchema = z.object({ history: z.array(areaHistoryItemSchema).default([]) }).passthrough();

const normalizeAlert = (alert) => ({
  id: alert.id || alert._id || `${alert.locationName}-${Date.now()}`,
  locationName: String(alert.locationName || "Unknown area"),
  message: String(alert.message || "High-risk pattern detected."),
  severity: String(alert.severity || "medium"),
  createdAt: alert.createdAt || new Date().toISOString()
});

const getCachedData = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached);
    const ageMs = Date.now() - Number(parsed?.cachedAt || 0);

    if (!parsed?.cachedAt || ageMs > CACHE_TTL_MS) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const supportsNotifications = typeof window !== "undefined" && "Notification" in window;

export const useCitizenData = () => {
  const [tips, setTips] = useState([]);
  const [heatPoints, setHeatPoints] = useState([]);
  const [trends, setTrends] = useState([]);
  const [alertsFeed, setAlertsFeed] = useState([]);
  const [history, setHistory] = useState([]);
  const [areaHistory, setAreaHistory] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [usingCachedData, setUsingCachedData] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState(
    supportsNotifications ? Notification.permission : "unsupported"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(() =>
    localStorage.getItem(NOTIFICATION_KEY) === "enabled"
  );

  useEffect(() => {
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const showBrowserNotification = useCallback(
    (alert) => {
      if (!supportsNotifications || !notificationsEnabled || notificationPermission !== "granted") {
        return;
      }

      const safeAlert = normalizeAlert(alert);
      // Uses Notification API as an optional hackathon-friendly browser alert feature.
      new Notification(`Disease Alert: ${safeAlert.locationName}`, {
        body: safeAlert.message,
        icon: "/favicon.ico",
        tag: safeAlert.id
      });
    },
    [notificationPermission, notificationsEnabled]
  );

  const enableBrowserNotifications = useCallback(async () => {
    if (!supportsNotifications) {
      throw new Error("Browser notifications are not supported in this browser.");
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission !== "granted") {
      setNotificationsEnabled(false);
      localStorage.removeItem(NOTIFICATION_KEY);
      throw new Error("Notification permission was not granted.");
    }

    setNotificationsEnabled(true);
    localStorage.setItem(NOTIFICATION_KEY, "enabled");
    return "Browser notifications enabled.";
  }, []);

  const disableBrowserNotifications = useCallback(() => {
    setNotificationsEnabled(false);
    localStorage.removeItem(NOTIFICATION_KEY);
  }, []);

  const loadCitizenData = useCallback(async () => {
    setDataLoading(true);

    try {
      const [tipsRes, heatRes, trendRes] = await Promise.all([
        api.get("/citizen/tips"),
        api.get("/risk/heatmap"),
        api.get("/risk/trends", { params: { period: "weekly" } })
      ]);

      const parsedTips = tipsSchema.parse(tipsRes.data);
      const parsedHeat = heatResponseSchema.parse(heatRes.data);
      const parsedTrend = trendResponseSchema.parse(trendRes.data);

      const snapshot = {
        cachedAt: Date.now(),
        tips: parsedTips.tips,
        heatPoints: parsedHeat.points,
        trends: parsedTrend.trends
      };

      setTips(snapshot.tips);
      setHeatPoints(snapshot.heatPoints);
      setTrends(snapshot.trends);
      setUsingCachedData(false);
      localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
      return snapshot;
    } catch (requestError) {
      const cached = getCachedData();

      if (cached) {
        setTips(Array.isArray(cached.tips) ? cached.tips : []);
        setHeatPoints(Array.isArray(cached.heatPoints) ? cached.heatPoints : []);
        setTrends(Array.isArray(cached.trends) ? cached.trends : []);
        setUsingCachedData(true);
        return cached;
      }

      throw new Error(requestError.response?.data?.message || "Unable to load citizen dashboard data.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    loadCitizenData().catch(() => {
      if (mounted) {
        setUsingCachedData(true);
      }
    });

    let refreshTimeout = null;
    const scheduleRefresh = () => {
      if (refreshTimeout) {
        return;
      }

      refreshTimeout = setTimeout(() => {
        loadCitizenData().catch(() => {
          setUsingCachedData(true);
        });
        refreshTimeout = null;
      }, 420);
    };

    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 600,
      reconnectionDelayMax: 3500,
      timeout: 8000
    });

    socket.on("alert:new", (incomingAlert) => {
      const normalized = normalizeAlert(incomingAlert);
      setAlertsFeed((prev) => [normalized, ...prev].slice(0, 8));
      showBrowserNotification(normalized);
      scheduleRefresh();
    });

    socket.on("report:new", () => {
      scheduleRefresh();
    });

    return () => {
      mounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      socket.disconnect();
    };
  }, [loadCitizenData, showBrowserNotification]);

  const refreshHistory = useCallback(async (email) => {
    if (!email) {
      throw new Error("Email is required to fetch report history.");
    }

    setHistoryLoading(true);

    try {
      const response = await api.get("/reports/history", { params: { email } });
      const parsed = historyResponseSchema.parse(response.data);
      setHistory(parsed.reports);
      return parsed.reports;
    } catch (requestError) {
      throw new Error(requestError.response?.data?.message || "Unable to fetch report history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshAreaHistory = useCallback(async (locationName) => {
    if (!locationName) {
      setAreaHistory([]);
      return [];
    }

    try {
      const response = await api.get(`/risk/history/${encodeURIComponent(locationName)}`);
      const parsed = areaHistoryResponseSchema.parse(response.data);
      setAreaHistory(parsed.history);
      return parsed.history;
    } catch {
      setAreaHistory([]);
      return [];
    }
  }, []);

  const submitCitizenReport = useCallback(
    async (payload) => {
      setReportSubmitting(true);

      try {
        const response = await api.post("/reports", payload);

        if (payload.reporterEmail) {
          await refreshHistory(payload.reporterEmail);
        }

        if (payload.locationName) {
          await refreshAreaHistory(payload.locationName);
        }

        await loadCitizenData();
        return response.data;
      } catch (requestError) {
        throw new Error(requestError.response?.data?.message || "Failed to submit report.");
      } finally {
        setReportSubmitting(false);
      }
    },
    [loadCitizenData, refreshAreaHistory, refreshHistory]
  );

  const subscribeForAlerts = useCallback(async (payload) => {
    setSubscriptionLoading(true);

    try {
      const response = await api.post("/citizen/subscriptions", payload);
      return response.data;
    } catch (requestError) {
      throw new Error(requestError.response?.data?.message || "Failed to subscribe for alerts.");
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  const communityRiskLevel = useMemo(() => {
    if (!heatPoints.length) return "Low";

    const average = heatPoints.reduce((sum, point) => sum + Number(point.averageRisk || 0), 0) / heatPoints.length;
    if (average >= 0.67) return "High";
    if (average >= 0.4) return "Medium";
    return "Low";
  }, [heatPoints]);

  return {
    tips,
    heatPoints,
    trends,
    alertsFeed,
    history,
    areaHistory,
    dataLoading,
    historyLoading,
    reportSubmitting,
    subscriptionLoading,
    isOffline,
    usingCachedData,
    notificationsEnabled,
    notificationPermission,
    communityRiskLevel,
    loadCitizenData,
    refreshHistory,
    refreshAreaHistory,
    submitCitizenReport,
    subscribeForAlerts,
    enableBrowserNotifications,
    disableBrowserNotifications
  };
};
