import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { apiClient, getSocketBaseUrl } from "../services/apiClient";
import {
  cacheAlerts,
  cacheMapData,
  cacheTips,
  getCachedAlerts,
  getCachedMapData,
  getCachedTips
} from "../services/storageService";
import { connectSocket, disconnectSocket, subscribeLocationRoom, unsubscribeLocationRoom } from "../services/socketService";
import { sendLocalNotification } from "../services/notificationService";
import { haversineDistanceKm, sanitizeText } from "../utils/sanitize";

const normalizeAlertLevel = (value) => {
  const normalized = String(value || "").toLowerCase();

  if (normalized.includes("high")) {
    return "high";
  }

  if (normalized.includes("warn") || normalized.includes("medium")) {
    return "medium";
  }

  return "low";
};

const toAlert = ({ title, message, level = "low", locationName = "", source = "system", read = false }) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: sanitizeText(title, 80),
  message: sanitizeText(message, 240),
  level: normalizeAlertLevel(level),
  locationName: sanitizeText(locationName, 120),
  source,
  read,
  createdAt: new Date().toISOString()
});

export const useCitizenData = ({ currentLocation } = {}) => {
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  const [mapPoints, setMapPoints] = useState([]);
  const [trends, setTrends] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);

  const [alertsFeed, setAlertsFeed] = useState([]);

  const [networkState, setNetworkState] = useState({ isConnected: true, isInternetReachable: true });
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);

  // Network tracking ref for auto-refresh
  const wasOfflineRef = useRef(false);
  const lastSocketErrorAtRef = useRef(0);

  const isOffline = !networkState.isConnected || networkState.isInternetReachable === false;

  const appendAlert = useCallback((alertInput) => {
    const next = toAlert(alertInput);

    setAlertsFeed((prev) => {
      const merged = [next, ...prev].slice(0, 40);
      cacheAlerts(merged);
      return merged;
    });

    return next;
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setAlertsFeed((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      cacheAlerts(next);
      return next;
    });
  }, []);

  const clearAlerts = useCallback(() => {
    setAlertsFeed([]);
    cacheAlerts([]);
  }, []);

  const hydrateCachedState = useCallback(async () => {
    const [cachedTips, cachedMap, cachedAlerts] = await Promise.all([
      getCachedTips(),
      getCachedMapData(),
      getCachedAlerts()
    ]);

    if (Array.isArray(cachedTips?.tips) && cachedTips.tips.length) {
      setTips(cachedTips.tips);
      setUsingCachedData(true);
    }

    if (Array.isArray(cachedMap?.points) && cachedMap.points.length) {
      setMapPoints(cachedMap.points);
      setTrends(Array.isArray(cachedMap.trends) ? cachedMap.trends : []);
      setUsingCachedData(true);
    }

    if (Array.isArray(cachedAlerts?.alerts) && cachedAlerts.alerts.length) {
      setAlertsFeed(cachedAlerts.alerts);
    }
  }, []);

  const loadTips = useCallback(async ({ manual = false } = {}) => {
    try {
      setTipsLoading(true);
      const response = await apiClient.get("/citizen/tips");
      const nextTips = Array.isArray(response?.tips) ? response.tips.map((tip) => sanitizeText(tip, 220)) : [];

      setTips(nextTips);
      await cacheTips(nextTips);
      setUsingCachedData(false);

      if (manual) {
        appendAlert({
          title: "Tips refreshed",
          message: `Loaded ${nextTips.length} prevention tips from backend.`,
          level: "low",
          source: "tips"
        });
      }
    } catch {
      const cached = await getCachedTips();
      setTips(Array.isArray(cached?.tips) ? cached.tips : []);
      setUsingCachedData(true);
    } finally {
      setTipsLoading(false);
    }
  }, [appendAlert]);

  const loadMapData = useCallback(async ({ manual = false } = {}) => {
    try {
      setMapLoading(true);

      const [heatmap, trendResponse] = await Promise.all([
        apiClient.get("/risk/heatmap"),
        apiClient.get("/risk/trends?period=weekly")
      ]);

      const points = Array.isArray(heatmap?.points) ? heatmap.points : [];
      const trendRows = Array.isArray(trendResponse?.trends) ? trendResponse.trends : [];

      setMapPoints(points);
      setTrends(trendRows);
      setLastSyncAt(new Date().toISOString());
      setUsingCachedData(false);
      await cacheMapData({ points, trends: trendRows });

      if (manual) {
        const highZones = points.filter((point) => String(point.riskLevel || "").toLowerCase() === "high").length;
        appendAlert({
          title: "Risk map synced",
          message:
            highZones > 0
              ? `${highZones} high-risk outbreak zone(s) detected in latest update.`
              : "No high-risk zones in latest snapshot.",
          level: highZones > 0 ? "high" : "low",
          source: "map"
        });
      }
    } catch {
      const cached = await getCachedMapData();
      setMapPoints(Array.isArray(cached?.points) ? cached.points : []);
      setTrends(Array.isArray(cached?.trends) ? cached.trends : []);
      setUsingCachedData(true);
    } finally {
      setMapLoading(false);
    }
  }, [appendAlert]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadTips({ manual: true }), loadMapData({ manual: true })]);
  }, [loadMapData, loadTips]);

  // ── Initialize Network State and Setup Listener ──────────────────────────
  useEffect(() => {
    let mounted = true;

    (async () => {
      // Fetch ACTUAL current network state on app start (not just assume online)
      try {
        const currentNetState = await NetInfo.fetch();
        if (mounted) {
          setNetworkState({
            isConnected: Boolean(currentNetState.isConnected),
            isInternetReachable: currentNetState.isInternetReachable ?? true
          });
        }
      } catch (err) {
        console.warn("NetInfo fetch failed:", err);
      }
    })();

    hydrateCachedState().then(() => {
      if (!mounted) {
        return;
      }
      loadTips();
      loadMapData();
    });

    // Listen to future network state changes
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (mounted) {
        setNetworkState({
          isConnected: Boolean(state.isConnected),
          isInternetReachable: state.isInternetReachable ?? true
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribeNetInfo();
    };
  }, [hydrateCachedState, loadMapData, loadTips]);

  // Network Auto-Revalidation Logic (Without breaking existing flow)
  useEffect(() => {
    if (wasOfflineRef.current && !isOffline) {
      // User just came back online, sync silently
      loadMapData();
      loadTips();
    }
    wasOfflineRef.current = isOffline;
  }, [isOffline, loadMapData, loadTips]);

  useEffect(() => {
    const socket = connectSocket({
      baseUrl: getSocketBaseUrl(),
      onConnectError: (err) => {
        const now = Date.now();

        // Prevent alert spam on reconnect attempts.
        if (now - lastSocketErrorAtRef.current < 25_000) {
          return;
        }

        lastSocketErrorAtRef.current = now;
        appendAlert({
          title: "Realtime updates delayed",
          message: err?.message ? `Socket reconnecting: ${err.message}` : "Socket reconnecting in background.",
          level: "low",
          source: "socket"
        });
      },
      onAlert: async (payload) => {
        const level = normalizeAlertLevel(payload?.severity || payload?.level || "medium");
        const locationName = sanitizeText(payload?.locationName || payload?.location || "Nearby area", 120);

        appendAlert({
          title: payload?.title || "Outbreak alert",
          message: payload?.message || `${locationName} has an active dengue risk warning.`,
          level,
          locationName,
          source: "socket"
        });

        if (level === "high") {
          await sendLocalNotification({
            title: "Outbreak alert nearby",
            body: payload?.message || `${locationName} reported a high dengue alert.`,
            data: { type: "outbreak", locationName },
            highPriority: true
          });
        }
      },
      onReport: async (payload) => {
        const level = normalizeAlertLevel(payload?.aiRiskLevel || "low");
        const locationName = sanitizeText(payload?.locationName || "Nearby area", 120);

        appendAlert({
          title: "New citizen report",
          message: `${locationName} reported ${payload?.severity || "new"} symptoms.`,
          level,
          locationName,
          source: "socket"
        });

        if (level === "high") {
          await sendLocalNotification({
            title: "High risk report nearby",
            body: `${locationName} submitted a high-risk dengue report.`,
            data: { type: "report", locationName },
            highPriority: true
          });
        }
      },
      onDangerZone: async (payload) => {
        const locationName = sanitizeText(payload?.name || "Nearby area", 120);
        const riskScore = payload?.riskScore || 80;

        appendAlert({
          title: "⚠️ New danger zone confirmed",
          message: `${locationName} has been marked as a danger zone (Risk: ${riskScore}/100)`,
          level: riskScore >= 80 ? "high" : "medium",
          locationName,
          source: "danger-zone"
        });

        await sendLocalNotification({
          title: "⚠️ Danger Zone Alert",
          body: `${locationName} - Risk Level: ${riskScore}/100. Avoid if possible.`,
          data: { type: "danger-zone", locationName, zoneId: payload?.id },
          highPriority: true
        });

        // Refresh map data to show new zone
        await loadMapData();
      }
    });

    return () => {
      if (socket) {
        disconnectSocket();
      }
    };
  }, [appendAlert]);

  useEffect(() => {
    if (!currentLocation?.locationName) {
      return undefined;
    }

    subscribeLocationRoom(currentLocation.locationName);

    return () => {
      unsubscribeLocationRoom(currentLocation.locationName);
    };
  }, [currentLocation?.locationName]);

  const nearbyCasesCount = useMemo(() => {
    if (!currentLocation || !Array.isArray(mapPoints) || !mapPoints.length) {
      return 0;
    }

    return mapPoints.reduce((total, point) => {
      const distance = haversineDistanceKm(
        Number(currentLocation.latitude),
        Number(currentLocation.longitude),
        Number(point.latitude),
        Number(point.longitude)
      );

      if (!Number.isFinite(distance) || distance > 5) {
        return total;
      }

      return total + Number(point.totalReports || 0);
    }, 0);
  }, [currentLocation, mapPoints]);

  const communityRiskLevel = useMemo(() => {
    if (!mapPoints.length) {
      return "Low";
    }

    const high = mapPoints.some((point) => String(point.riskLevel || "").toLowerCase() === "high");
    if (high) {
      return "High";
    }

    const medium = mapPoints.some((point) => String(point.riskLevel || "").toLowerCase() === "medium");
    if (medium) {
      return "Medium";
    }

    return "Low";
  }, [mapPoints]);

  const weeklyPeak = useMemo(() => {
    if (!trends.length) {
      return 0;
    }

    return Math.max(...trends.map((entry) => Number(entry.averageRisk || 0)), 0);
  }, [trends]);

  const highRiskZones = useMemo(
    () => mapPoints.filter((point) => String(point.riskLevel || "").toLowerCase() === "high").length,
    [mapPoints]
  );

  const unreadAlerts = useMemo(() => alertsFeed.filter((alert) => !alert.read).length, [alertsFeed]);

  // STRICT RETURN CONTRACT (No variables renamed or removed)
  return {
    isOffline,
    usingCachedData,
    tips,
    tipsLoading,
    mapPoints,
    trends,
    mapLoading,
    alertsFeed,
    unreadAlerts,
    lastSyncAt,
    refreshAll,
    loadTips,
    loadMapData,
    appendAlert,
    markAllAlertsRead,
    clearAlerts,
    nearbyCasesCount,
    communityRiskLevel,
    weeklyPeak,
    highRiskZones
  };
};