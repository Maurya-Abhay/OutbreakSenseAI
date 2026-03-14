import api from "../api/client";
import { getMockDashboardBundle } from "../utils/mockData";

const mapSeverityToRisk = (severity) => {
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  if (severity === "low") return "Low";
  return undefined;
};

const requestWithFallback = async (requestFn, fallbackData) => {
  try {
    const response = await requestFn();
    return { data: response.data, fallback: false };
  } catch {
    return { data: fallbackData, fallback: true };
  }
};

const ensureHeatIntensity = (points) =>
  (points || []).map((point) => ({
    ...point,
    diseaseType: point.diseaseType || "Unknown",
    intensity: point.intensity ?? Math.round((point.averageRisk || 0) * 100)
  }));

const buildNotifications = ({ alerts, reports, seed = [] }) => {
  const alertNotifications = (alerts || []).slice(0, 4).map((alert) => ({
    id: `alert-${alert._id || alert.id}`,
    title: alert.title || "Risk alert",
    message: alert.message,
    createdAt: alert.createdAt,
    type: alert.severity === "high" ? "danger" : "info"
  }));

  const reportNotifications = (reports || []).slice(0, 3).map((report) => ({
    id: `report-${report.id}`,
    title: "New citizen report",
    message: `${report.locationName} submitted by ${report.reporterName}`,
    createdAt: report.createdAt,
    type: report.aiRiskLevel === "High" ? "danger" : "success"
  }));

  const generated = [...alertNotifications, ...reportNotifications];

  if (!generated.length) {
    return seed;
  }

  const uniqueById = new Map();
  [...generated, ...seed].forEach((entry) => {
    if (!entry?.id || uniqueById.has(entry.id)) {
      return;
    }

    uniqueById.set(entry.id, entry);
  });

  return [...uniqueById.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
};

export const fetchDashboardBundle = async ({ filters, period }) => {
  const mockBundle = getMockDashboardBundle({ filters, period });

  const commonParams = {};
  if (filters?.dateFrom) commonParams.dateFrom = filters.dateFrom;
  if (filters?.dateTo) commonParams.dateTo = filters.dateTo;
  if (filters?.location) commonParams.location = filters.location;
  if (filters?.severity) commonParams.severity = filters.severity;

  const heatmapParams = {
    dateFrom: filters?.dateFrom || undefined,
    dateTo: filters?.dateTo || undefined,
    severity: mapSeverityToRisk(filters?.severity)
  };

  const [dashboardRes, reportsRes, alertsRes, heatmapRes, trendsCurrentRes, trendsWeeklyRes, trendsMonthlyRes] =
    await Promise.all([
      requestWithFallback(() => api.get("/admin/dashboard"), {
        stats: mockBundle.stats,
        areaBreakdown: mockBundle.locationBreakdown,
        recentReports: []
      }),
      requestWithFallback(() => api.get("/admin/reports", { params: commonParams }), {
        reports: mockBundle.reports
      }),
      requestWithFallback(() => api.get("/admin/alerts"), { alerts: mockBundle.alerts }),
      requestWithFallback(() => api.get("/risk/heatmap", { params: heatmapParams }), {
        points: mockBundle.heatPoints
      }),
      requestWithFallback(
        () =>
          api.get("/risk/trends", {
            params: {
              period,
              dateFrom: filters?.dateFrom || undefined,
              dateTo: filters?.dateTo || undefined
            }
          }),
        { trends: mockBundle.trendsCurrent }
      ),
      requestWithFallback(
        () =>
          api.get("/risk/trends", {
            params: {
              period: "weekly",
              dateFrom: filters?.dateFrom || undefined,
              dateTo: filters?.dateTo || undefined
            }
          }),
        { trends: mockBundle.trendsWeekly }
      ),
      requestWithFallback(
        () =>
          api.get("/risk/trends", {
            params: {
              period: "monthly",
              dateFrom: filters?.dateFrom || undefined,
              dateTo: filters?.dateTo || undefined
            }
          }),
        { trends: mockBundle.trendsMonthly }
      )
    ]);

  const usedFallback = [
    dashboardRes,
    reportsRes,
    alertsRes,
    heatmapRes,
    trendsCurrentRes,
    trendsWeeklyRes,
    trendsMonthlyRes
  ].some((item) => item.fallback);

  const reports = reportsRes.data.reports || mockBundle.reports;
  const alerts = alertsRes.data.alerts || mockBundle.alerts;
  const regionBreakdown =
    dashboardRes.data.regionBreakdown ||
    dashboardRes.data.areaBreakdown ||
    mockBundle.regionBreakdown ||
    mockBundle.locationBreakdown;
  const diseaseBreakdown = dashboardRes.data.diseaseBreakdown || mockBundle.diseaseBreakdown || [];
  const totalReportsByDisease =
    dashboardRes.data.totalReportsByDisease ||
    diseaseBreakdown.reduce((acc, item) => {
      acc[item.diseaseType || "Unknown"] = Number(item.totalReports || 0);
      return acc;
    }, {});

  return {
    stats: dashboardRes.data.stats || mockBundle.stats,
    reports,
    alerts,
    heatPoints: ensureHeatIntensity(heatmapRes.data.points || mockBundle.heatPoints),
    trendsCurrent: trendsCurrentRes.data.trends || mockBundle.trendsCurrent,
    trendsWeekly: trendsWeeklyRes.data.trends || mockBundle.trendsWeekly,
    trendsMonthly: trendsMonthlyRes.data.trends || mockBundle.trendsMonthly,
    locationBreakdown: regionBreakdown,
    regionBreakdown,
    diseaseBreakdown,
    totalReportsByDisease,
    notifications: buildNotifications({
      alerts,
      reports,
      seed: usedFallback ? mockBundle.notifications : []
    }),
    dataSource: usedFallback ? "demo-mock" : "live-api"
  };
};

export const resolveAlertById = async (alertId) => {
  await api.patch(`/admin/alerts/${alertId}/resolve`);
};

export const updateReportVerification = async ({ reportId, verified }) => {
  await api.patch(`/admin/reports/${reportId}/verify`, { verified });
};

export const exportReports = async ({ format, filters }) => {
  const response = await api.get(`/admin/export/${format}`, {
    params: {
      dateFrom: filters?.dateFrom || undefined,
      dateTo: filters?.dateTo || undefined,
      location: filters?.location || undefined,
      severity: filters?.severity || undefined
    },
    responseType: "blob"
  });

  const mimeType = format === "csv" ? "text/csv" : "application/pdf";
  const blob = new Blob([response.data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `outbreaksense-${format}-export-${Date.now()}.${format}`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
