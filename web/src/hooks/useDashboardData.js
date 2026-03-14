import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { AUTH_TOKEN_KEY } from "../api/client";
import {
  exportReports,
  fetchDashboardBundle,
  resolveAlertById,
  updateReportVerification
} from "../services/dashboardService";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5050";

const initialFilters = {
  dateFrom: "",
  dateTo: "",
  location: "",
  severity: ""
};

export const useDashboardData = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [period, setPeriod] = useState("weekly");

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [heatPoints, setHeatPoints] = useState([]);
  const [trendsCurrent, setTrendsCurrent] = useState([]);
  const [trendsWeekly, setTrendsWeekly] = useState([]);
  const [trendsMonthly, setTrendsMonthly] = useState([]);
  const [locationBreakdown, setLocationBreakdown] = useState([]);
  const [regionBreakdown, setRegionBreakdown] = useState([]);
  const [diseaseBreakdown, setDiseaseBreakdown] = useState([]);
  const [totalReportsByDisease, setTotalReportsByDisease] = useState({});
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [realtimeHint, setRealtimeHint] = useState("");
  const [dataSource, setDataSource] = useState("live-api");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      try {
        const bundle = await fetchDashboardBundle({ filters, period });
        setStats(bundle.stats);
        setReports(bundle.reports);
        setAlerts(bundle.alerts);
        setHeatPoints(bundle.heatPoints);
        setTrendsCurrent(bundle.trendsCurrent);
        setTrendsWeekly(bundle.trendsWeekly);
        setTrendsMonthly(bundle.trendsMonthly);
        setLocationBreakdown(bundle.locationBreakdown);
        setRegionBreakdown(bundle.regionBreakdown || bundle.locationBreakdown || []);
        setDiseaseBreakdown(bundle.diseaseBreakdown || []);
        setTotalReportsByDisease(bundle.totalReportsByDisease || {});
        setNotifications(bundle.notifications);
        setDataSource(bundle.dataSource);
        setLastUpdated(new Date().toISOString());
      } catch {
        setError("Unable to load dashboard insights right now.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [filters, period]
  );

  useEffect(() => {
    loadData();
  }, [loadData, refreshTick]);

  useEffect(() => {
    if (!realtimeHint) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setRealtimeHint("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [realtimeHint]);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      return undefined;
    }

    let refreshTimeout = null;
    const scheduleRefresh = () => {
      if (refreshTimeout) {
        return;
      }

      refreshTimeout = setTimeout(() => {
        setRefreshTick((previous) => previous + 1);
        refreshTimeout = null;
      }, 450);
    };

    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 600,
      reconnectionDelayMax: 3500,
      timeout: 8000,
      auth: {
        token
      }
    });

    socket.on("report:new:admin", (report) => {
      setRealtimeHint(`New report from ${report.locationName} entered the stream.`);
      scheduleRefresh();
    });

    socket.on("report:new", (report) => {
      setRealtimeHint(`Realtime update from ${report.locationName}.`);
      scheduleRefresh();
    });

    socket.on("alert:new", (alert) => {
      setRealtimeHint(`High-risk alert: ${alert.locationName}`);
      scheduleRefresh();
    });

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      socket.disconnect();
    };
  }, []);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const refresh = () => {
    setRefreshTick((previous) => previous + 1);
  };

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setRealtimeHint("Notification inbox cleared.");
  }, []);

  const resolveAlert = async (alertId) => {
    try {
      await resolveAlertById(alertId);
      setRealtimeHint("Alert resolved successfully.");
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to resolve selected alert.");
    }
  };

  const toggleReportVerification = async (reportId, verified) => {
    try {
      await updateReportVerification({ reportId, verified });
      setRealtimeHint(verified ? "Report verified." : "Report moved back to pending.");
      refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update report verification.");
    }
  };

  const downloadExport = async (format) => {
    try {
      await exportReports({ format, filters });
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Failed to export ${format.toUpperCase()} file.`);
    }
  };

  return useMemo(
    () => ({
      filters,
      updateFilter,
      setFilters,
      period,
      setPeriod,
      stats,
      reports,
      alerts,
      heatPoints,
      trendsCurrent,
      trendsWeekly,
      trendsMonthly,
      locationBreakdown,
      regionBreakdown,
      diseaseBreakdown,
      totalReportsByDisease,
      notifications,
      loading,
      error,
      realtimeHint,
      dataSource,
      lastUpdated,
      refresh,
      clearNotifications,
      resolveAlert,
      toggleReportVerification,
      downloadExport
    }),
    [
      filters,
      period,
      stats,
      reports,
      alerts,
      heatPoints,
      trendsCurrent,
      trendsWeekly,
      trendsMonthly,
      locationBreakdown,
      regionBreakdown,
      diseaseBreakdown,
      totalReportsByDisease,
      notifications,
      loading,
      error,
      realtimeHint,
      dataSource,
      lastUpdated,
      clearNotifications
    ]
  );
};
