import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  MapPinned,
  Moon,
  Radar,
  RefreshCcw,
  Sun,
  WifiOff,
  ChevronRight,
  Sparkles,
  ThermometerSun,
  Droplets,
  Wind
} from "lucide-react";

// Components
import CitizenAlertsPanel from "../components/citizen/CitizenAlertsPanel";
import CitizenHistoryPanel from "../components/citizen/CitizenHistoryPanel";
import CitizenReportForm from "../components/citizen/CitizenReportForm";
import CitizenRiskForm from "../components/citizen/CitizenRiskForm";
import CitizenSkeletonCard from "../components/citizen/CitizenSkeletonCard";
import CitizenSubscriptionPanel from "../components/citizen/CitizenSubscriptionPanel";
import CitizenTipsPanel from "../components/citizen/CitizenTipsPanel";

// Hooks
import { useCitizenData } from "../hooks/useCitizenData";
import { useGeolocation } from "../hooks/useGeolocation";
import { useRiskPrediction } from "../hooks/useRiskPrediction";
import { useTheme } from "../hooks/useTheme";

// Utils
import { sanitizeCsvList, sanitizeText, toBoundedNumber } from "../utils/security";

const LazyRiskTrendChart = lazy(() => import("../components/charts/RiskTrendChart"));
const LazyCitizenRiskHeatmapMap = lazy(() => import("../components/map/RiskHeatmapMap"));

// --- SCHEMAS & DEFAULTS (Untouched) ---
const riskFormSchema = z.object({
  latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  temperature: z.coerce.number().min(-20).max(60),
  rainfall: z.coerce.number().min(0).max(1000),
  humidity: z.coerce.number().min(0).max(100)
});

const reportFormSchema = z.object({
  reporterName: z.string().min(2, "Name should have at least 2 characters").max(80),
  reporterEmail: z.string().email("Please enter a valid email"),
  age: z.coerce.number().int().min(1, "Age must be 1 to 120").max(120, "Age must be 1 to 120"),
  symptoms: z.string().min(3, "Add at least one symptom").max(500),
  diseaseType: z.enum(["Dengue", "Malaria", "COVID-19", "Chikungunya", "Flu", "Unknown"]),
  notes: z.string().max(500).optional().or(z.literal("")),
  severity: z.enum(["low", "medium", "high"]),
  locationName: z.string().min(2, "Location is required").max(120)
});

const subscriptionSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  locationName: z.string().min(2, "Location is required").max(120)
});

const riskDefaults = { latitude: "", longitude: "", temperature: 30, rainfall: 150, humidity: 72 };
const reportDefaults = {
  reporterName: "",
  reporterEmail: "",
  age: "",
  symptoms: "fever, headache",
  diseaseType: "Unknown",
  notes: "",
  severity: "medium",
  locationName: ""
};
const subscriptionDefaults = { email: "", locationName: "" };

// --- UI CONFIG ---
const statusTone = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
};

const communityTone = {
  Low: "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]",
  Medium: "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]",
  High: "text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]"
};

const riskBar = { Low: "bg-gradient-to-r from-emerald-400 to-emerald-500", Medium: "bg-gradient-to-r from-amber-400 to-amber-500", High: "bg-gradient-to-r from-rose-400 to-rose-500" };

const headerNavLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#risk-check", label: "Risk Check" },
  { href: "#report-case", label: "Report Case" },
  { href: "#risk-map", label: "Risk Map" },
  { href: "#forecast", label: "Forecast" }
];

// --- HELPER FUNCTIONS ---
const toRadians = (value) => (Number(value) * Math.PI) / 180;

const distanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeRiskLevel = (value) => {
  const level = String(value || "Low").toLowerCase();
  if (level.includes("high")) return "High";
  if (level.includes("med")) return "Medium";
  return "Low";
};

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// --- MAIN COMPONENT ---
const CitizenPortal = () => {
  const mapSectionRef = useRef(null);
  const [status, setStatus] = useState({ type: "info", message: "" });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapPickerEnabled, setMapPickerEnabled] = useState(true);

  const { isDark, toggleTheme } = useTheme();
  
  const {
    tips, heatPoints, trends, alertsFeed, history, areaHistory, dataLoading, historyLoading, reportSubmitting,
    subscriptionLoading, isOffline, usingCachedData, notificationsEnabled, notificationPermission, communityRiskLevel,
    loadCitizenData, refreshHistory, refreshAreaHistory, submitCitizenReport, subscribeForAlerts, enableBrowserNotifications, disableBrowserNotifications
  } = useCitizenData();

  const { detectingLocation, fetchingWeather, detectLocationWithWeather, scheduleWeatherFetch } = useGeolocation();
  const { riskResult, riskLevel, riskLoading, isOfflineResult, recommendations, checkRiskDebounced } = useRiskPrediction();

  // Forms
  const { register: registerRisk, watch: watchRisk, trigger: triggerRisk, setValue: setRiskValue, getValues: getRiskValues, formState: { errors: riskErrors } } = useForm({ resolver: zodResolver(riskFormSchema), mode: "onBlur", defaultValues: riskDefaults });
  const { register: registerReport, handleSubmit: handleSubmitReport, reset: resetReport, watch: watchReport, getValues: getReportValues, setValue: setReportValue, formState: { errors: reportErrors } } = useForm({ resolver: zodResolver(reportFormSchema), mode: "onBlur", defaultValues: reportDefaults });
  const { register: registerSubscription, handleSubmit: handleSubmitSubscription, reset: resetSubscription, formState: { errors: subscriptionErrors } } = useForm({ resolver: zodResolver(subscriptionSchema), mode: "onBlur", defaultValues: subscriptionDefaults });

  const watchedLatitude = watchRisk("latitude");
  const watchedLongitude = watchRisk("longitude");
  const watchedTemperature = watchRisk("temperature");
  const watchedRainfall = watchRisk("rainfall");
  const watchedHumidity = watchRisk("humidity");
  const watchedReportLocation = watchReport("locationName");

  // Effects & Memos (Untouched Logic)
  useEffect(() => {
    if (!watchedLatitude || !watchedLongitude) return;
    scheduleWeatherFetch(watchedLatitude, watchedLongitude, (weather) => {
      setRiskValue("temperature", weather.temperature, { shouldValidate: true });
      setRiskValue("humidity", weather.humidity, { shouldValidate: true });
      setRiskValue("rainfall", weather.rainfall, { shouldValidate: true });
    });
  }, [scheduleWeatherFetch, setRiskValue, watchedLatitude, watchedLongitude]);

  useEffect(() => {
    const latitude = Number(watchedLatitude);
    const longitude = Number(watchedLongitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setSelectedLocation((previous) => ({
      locationName: previous?.locationName || "Selected Point",
      latitude, longitude, riskLevel: previous?.riskLevel, predictionTrend: previous?.predictionTrend
    }));
  }, [watchedLatitude, watchedLongitude]);

  const hotspots = useMemo(() => [...heatPoints].filter((point) => Number(point.averageRisk || 0) >= 0.55 || normalizeRiskLevel(point.riskLevel) === "High").sort((a, b) => Number(b.averageRisk || 0) - Number(a.averageRisk || 0)).slice(0, 3), [heatPoints]);

  const nearbyCasesCount = useMemo(() => {
    const latitude = Number(watchedLatitude);
    const longitude = Number(watchedLongitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return 0;
    return heatPoints.reduce((sum, point) => {
      const km = distanceKm(latitude, longitude, Number(point.latitude), Number(point.longitude));
      return km <= 5 ? sum + Number(point.totalReports || 0) : sum;
    }, 0);
  }, [heatPoints, watchedLatitude, watchedLongitude]);

  const sevenDayForecast = useMemo(() => {
    const source = Array.isArray(trends) ? trends : [];
    const lastValue = source.length ? Number(source[source.length - 1].averageRisk || 0) : Number(riskResult?.risk_score || 0);
    const previousValue = source.length > 1 ? Number(source[source.length - 2].averageRisk || lastValue) : lastValue;
    const slope = lastValue - previousValue;

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);
      const projectedScore = Math.min(1, Math.max(0, lastValue + slope * (index + 1) * 0.55));
      const projectedLevel = normalizeRiskLevel(projectedScore >= 0.67 ? "High" : projectedScore >= 0.4 ? "Medium" : "Low");
      return { label: date.toLocaleDateString(undefined, { weekday: "short" }), score: projectedScore, level: projectedLevel };
    });
  }, [riskResult?.risk_score, trends]);

  const forecastPeakRisk = useMemo(() => sevenDayForecast.reduce((max, item) => Math.max(max, item.score), 0), [sevenDayForecast]);

  const environmentSnapshot = useMemo(
    () => [
      {
        id: "temp",
        label: "Temperature",
        value: `${Math.round(toBoundedNumber(watchedTemperature, -20, 60, 30))}°C`,
        tone: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-500/20",
        Icon: ThermometerSun
      },
      {
        id: "rain",
        label: "Rainfall",
        value: `${Math.round(toBoundedNumber(watchedRainfall, 0, 1000, 0))} mm`,
        tone: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-100 dark:bg-cyan-500/20",
        Icon: Droplets
      },
      {
        id: "humidity",
        label: "Humidity",
        value: `${Math.round(toBoundedNumber(watchedHumidity, 0, 100, 72))}%`,
        tone: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-100 dark:bg-violet-500/20",
        Icon: Wind
      }
    ],
    [watchedHumidity, watchedRainfall, watchedTemperature]
  );

  // Handlers (Untouched Logic)
  const applyDetectedLocation = useCallback(async () => {
    try {
      const detected = await detectLocationWithWeather();
      setRiskValue("latitude", detected.latitude, { shouldValidate: true });
      setRiskValue("longitude", detected.longitude, { shouldValidate: true });
      setRiskValue("temperature", detected.weather.temperature, { shouldValidate: true });
      setRiskValue("humidity", detected.weather.humidity, { shouldValidate: true });
      setRiskValue("rainfall", detected.weather.rainfall, { shouldValidate: true });
      setSelectedLocation({ locationName: "GPS Selected Point", latitude: detected.latitude, longitude: detected.longitude, predictionTrend: "Selected" });
      if (!getReportValues("locationName")) setReportValue("locationName", "GPS Selected Area", { shouldValidate: true });
      setStatus({ type: "success", message: "GPS and weather auto-detected successfully." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to detect location and weather." });
    }
  }, [detectLocationWithWeather, getReportValues, setReportValue, setRiskValue]);

  const handlePickFromMap = useCallback(() => {
    setMapPickerEnabled(true);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus({ type: "info", message: "Click any point on the map to select coordinates." });
  }, []);

  const handleMapSelect = useCallback((selection) => {
    const latitude = Number(selection.latitude);
    const longitude = Number(selection.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    setRiskValue("latitude", latitude, { shouldValidate: true });
    setRiskValue("longitude", longitude, { shouldValidate: true });
    setSelectedLocation(selection);
    setMapPickerEnabled(false);
    if (!getReportValues("locationName") && selection.locationName) {
      setReportValue("locationName", sanitizeText(selection.locationName, 120), { shouldValidate: true });
    }
    setStatus({ type: "info", message: `Location selected from map: ${selection.locationName || `${latitude}, ${longitude}`}` });
  }, [getReportValues, setReportValue, setRiskValue]);

  const handleRiskCheck = useCallback(async () => {
    const isValid = await triggerRisk(undefined, { shouldFocus: true });
    if (!isValid) { setStatus({ type: "warn", message: "Please fix coordinate and weather field errors." }); return; }
    const values = getRiskValues();
    try {
      await checkRiskDebounced({ latitude: Number(values.latitude), longitude: Number(values.longitude), temperature: Number(values.temperature), rainfall: Number(values.rainfall), humidity: Number(values.humidity) }, 320);
      setStatus({ type: "success", message: "Risk prediction completed." });
    } catch (error) { setStatus({ type: "error", message: error.message || "Failed to check risk." }); }
  }, [checkRiskDebounced, getRiskValues, triggerRisk]);

  const onSubmitReport = handleSubmitReport(async (values) => {
    let latitude = Number(getRiskValues("latitude"));
    let longitude = Number(getRiskValues("longitude"));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      try {
        const detected = await detectLocationWithWeather();
        latitude = detected.latitude; longitude = detected.longitude;
        setRiskValue("latitude", latitude, { shouldValidate: true });
        setRiskValue("longitude", longitude, { shouldValidate: true });
        setRiskValue("temperature", detected.weather.temperature, { shouldValidate: true });
        setRiskValue("humidity", detected.weather.humidity, { shouldValidate: true });
        setRiskValue("rainfall", detected.weather.rainfall, { shouldValidate: true });
      } catch {
        setStatus({ type: "warn", message: "Coordinates missing. Please use GPS or map picker before submitting." });
        return;
      }
    }
    const symptoms = sanitizeCsvList(values.symptoms, 500).split(",").map((item) => item.trim()).filter(Boolean);
    const payload = {
      reporterName: sanitizeText(values.reporterName, 80), reporterEmail: sanitizeText(values.reporterEmail, 120).toLowerCase(),
      age: toBoundedNumber(values.age, 1, 120, 30), symptoms, diseaseType: values.diseaseType, notes: sanitizeText(values.notes || "", 500), severity: values.severity,
      locationName: sanitizeText(values.locationName, 120) || "Citizen Area", latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)),
      weather: { temperature: toBoundedNumber(getRiskValues("temperature"), -20, 60, 30), rainfall: toBoundedNumber(getRiskValues("rainfall"), 0, 1000, 0), humidity: toBoundedNumber(getRiskValues("humidity"), 0, 100, 70) }
    };
    try {
      const response = await submitCitizenReport(payload);
      setStatus({ type: "success", message: response.message || "Report submitted successfully." });
      resetReport({
        ...reportDefaults,
        reporterEmail: payload.reporterEmail,
        locationName: payload.locationName,
        diseaseType: payload.diseaseType
      });
    } catch (error) { setStatus({ type: "error", message: error.message || "Failed to submit report." }); }
  });

  const handleHistoryRefresh = useCallback(async () => {
    const email = sanitizeText(getReportValues("reporterEmail"), 120).toLowerCase();
    if (!email) { setStatus({ type: "warn", message: "Enter your email to fetch report history." }); return; }
    try {
      await refreshHistory(email);
      const locationName = sanitizeText(getReportValues("locationName"), 120);
      if (locationName) await refreshAreaHistory(locationName);
      setStatus({ type: "success", message: "Loaded report history." });
    } catch (error) { setStatus({ type: "error", message: error.message || "Unable to fetch report history." }); }
  }, [getReportValues, refreshAreaHistory, refreshHistory]);

  const onSubmitSubscription = handleSubmitSubscription(async (values) => {
    const payload = { email: sanitizeText(values.email, 120).toLowerCase(), locationName: sanitizeText(values.locationName, 120), preferredChannel: "email" };
    try {
      const response = await subscribeForAlerts(payload);
      setStatus({ type: "success", message: response.message || "Alert subscription created." });
      resetSubscription(subscriptionDefaults);
    } catch (error) { setStatus({ type: "error", message: error.message || "Failed to subscribe for alerts." }); }
  });

  const handleEnableNotifications = useCallback(async () => {
    try {
      const message = await enableBrowserNotifications();
      setStatus({ type: "success", message });
    } catch (error) { setStatus({ type: "warn", message: error.message || "Unable to enable browser notifications." }); }
  }, [enableBrowserNotifications]);

  const handleDisableNotifications = useCallback(() => {
    disableBrowserNotifications();
    setStatus({ type: "info", message: "Browser notifications disabled." });
  }, [disableBrowserNotifications]);

  const showOfflineBanner = isOffline || usingCachedData || isOfflineResult;
  const selectedLatitude = Number(watchedLatitude);
  const selectedLongitude = Number(watchedLongitude);
  const hasSelectedCoordinates = Number.isFinite(selectedLatitude) && Number.isFinite(selectedLongitude);
  const resolvedLocationName = sanitizeText(selectedLocation?.locationName || watchedReportLocation || "Location not selected", 120) || "Location not selected";
  const resolvedCoordinates = hasSelectedCoordinates
    ? `${selectedLatitude.toFixed(4)}, ${selectedLongitude.toFixed(4)}`
    : "Use GPS or map picker";
  const personalRiskSummary = riskResult
    ? `${riskLevel} (${Math.round((Number(riskResult?.risk_score) || 0) * 100)}%)`
    : "Pending assessment";
  const personalRiskToneClass = riskResult
    ? communityTone[riskLevel] || communityTone.Low
    : isDark
      ? "text-slate-200"
      : "text-slate-800";
  const liveModeLabel = showOfflineBanner ? "Cached feed" : "Live feed";
  const currentYear = new Date().getFullYear();
  const pageTheme = isDark ? "dark" : "light";
  const sectionShellClass = isDark ? "border-white/10 bg-slate-900/55" : "border-white/40 bg-white/40";
  const sectionShell = `rounded-3xl border p-1 backdrop-blur-xl ${sectionShellClass}`;
  const heroMainCardClass = isDark ? "border-white/10 bg-slate-900/72" : "border-white/40 bg-white/60";
  const heroSideCardClass = isDark ? "border-white/10 bg-slate-900/72" : "border-white/40 bg-white/60";
  const miniStatCardClass = isDark ? "border-white/10 bg-slate-900/62" : "border-white/40 bg-white/60";
  const forecastPanelClass = isDark ? "border-white/10 bg-slate-900/72" : "border-white/40 bg-white/60";
  const forecastItemClass = isDark
    ? "border-white/10 bg-slate-800/70 hover:bg-slate-800"
    : "border-white/50 bg-white/50 hover:bg-white";
  const forecastFocusClass = isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-slate-50";
  const footerClass = isDark
    ? "mt-12 border-t border-white/10 bg-slate-950/70 backdrop-blur-2xl"
    : "mt-12 border-t border-slate-200/60 bg-white/50 backdrop-blur-2xl";

  return (
    <div className={isDark ? "dark" : ""} data-theme={pageTheme}>
      <div
        className={`relative min-h-screen overflow-hidden scroll-smooth selection:bg-blue-500/30 transition-colors duration-300 ${
          isDark ? "bg-[#0B1120] text-slate-50" : "bg-slate-50 text-slate-900"
        }`}
      >
        {/* Next-Gen Animated Background */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[10%] h-[40rem] w-[40rem] animate-pulse rounded-full bg-blue-500/10 blur-[120px] transition-colors duration-1000 dark:bg-blue-600/10"></div>
          <div className="absolute -bottom-[10%] -right-[10%] h-[40rem] w-[40rem] animate-pulse rounded-full bg-teal-500/10 blur-[120px] transition-colors duration-1000 delay-500 dark:bg-teal-600/10"></div>
        </div>

        {/* Floating Header */}
        <header className="fixed inset-x-0 top-0 z-[70]">
          <div className="mx-auto max-w-[1440px] px-4 pt-3 md:px-6">
            <div
              className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 backdrop-blur-xl transition-all md:px-4 ${
                isDark
                  ? "border-white/10 bg-slate-900/88 shadow-[0_8px_30px_rgb(0,0,0,0.35)]"
                  : "border-white/50 bg-white/85 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
              }`}
            >
              <Link to="/" className="group flex items-center gap-3" aria-label="Citizen portal home">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 transition-transform group-hover:scale-105">
                  <Activity className="h-5 w-5 text-white" />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"></div>
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">OutbreakSense AI</h1>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Health Intelligence</p>
                </div>
              </Link>

              <nav className="hidden items-center gap-1 md:flex" aria-label="Citizen portal sections">
                {headerNavLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-400"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  aria-pressed={isDark}
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span className="hidden lg:inline">{isDark ? "Light" : "Dark"}</span>
                </button>
                <button
                  type="button"
                  onClick={loadCitizenData}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  aria-label="Refresh portal data"
                >
                  <RefreshCcw className={`h-4 w-4 ${dataLoading ? "animate-spin" : ""}`} />
                </button>
                <Link
                  to="/admin/login"
                  className="hidden h-10 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 lg:flex"
                  aria-label="Go to admin login"
                >
                  Admin Portal
                </Link>
              </div>
            </div>

            <nav
              className="mt-2 flex gap-2 overflow-x-auto rounded-xl border border-white/30 bg-white/75 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 md:hidden"
              aria-label="Citizen section quick links"
            >
              {headerNavLinks.map((item) => (
                <a
                  key={`mobile-${item.href}`}
                  href={item.href}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-400"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/admin/login"
                className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900"
                aria-label="Go to admin login"
              >
                Admin Portal
              </Link>
            </nav>
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-[1440px] space-y-6 px-4 pb-8 pt-32 md:px-6 md:pt-24">
          {/* Next-Gen Hero / Overview Bento Grid */}
          <motion.section
            id="overview"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid scroll-mt-32 grid-cols-1 gap-4 lg:grid-cols-12"
          >
            {/* Main Welcome Card */}
            <motion.div variants={itemVariants} className={`group relative overflow-hidden rounded-3xl border p-6 shadow-xl backdrop-blur-2xl md:p-7 lg:col-span-8 ${heroMainCardClass}`}>
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl transition-opacity group-hover:opacity-70 dark:bg-blue-600/20"></div>
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-400/30 dark:text-blue-300">
                    <Sparkles className="h-3.5 w-3.5" /> AI Powered Defense
                  </span>
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                    Community Health <br /><span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-teal-400">Intelligence Portal</span>
                  </h2>
                  <p className="mt-3 max-w-lg text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 md:text-base">
                    Predict neighborhood risk, submit case reports instantly, and receive real-time outbreak safety guidance powered by machine learning.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#report-case" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:shadow-blue-500/50 active:translate-y-0 dark:bg-blue-500">
                    Report a Case <ChevronRight className="h-4 w-4" />
                  </a>
                  <a href="#risk-check" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80">
                    Check My Risk
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Community Risk Snapshot */}
            <motion.div variants={itemVariants} className={`relative overflow-hidden rounded-3xl border p-5 shadow-xl backdrop-blur-2xl md:p-6 lg:col-span-4 ${heroSideCardClass}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Community Risk</p>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Your area live signal</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${isDark ? "border-white/15 bg-white/5 text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>
                  {liveModeLabel}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-slate-100 dark:border-slate-800">
                  <div className={`absolute inset-0 rounded-full border-8 border-l-transparent border-t-transparent animate-[spin_4s_linear_infinite] ${communityRiskLevel === "High" ? "border-rose-500" : communityRiskLevel === "Medium" ? "border-amber-500" : "border-emerald-500"}`}></div>
                  <span className={`text-xl font-black ${communityTone[communityRiskLevel] || communityTone.Low}`}>{communityRiskLevel}</span>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Current Status</p>
                  <p className={`mt-1 truncate text-lg font-black ${personalRiskToneClass}`}>{personalRiskSummary}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {riskResult ? "Based on your latest risk check" : "Run risk check to generate personal status"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <div className={`rounded-2xl border p-3 ${isDark ? "border-white/10 bg-slate-800/70" : "border-slate-200/70 bg-white/70"}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Location Name</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">{resolvedLocationName}</p>
                </div>

                <div className={`rounded-2xl border p-3 ${isDark ? "border-white/10 bg-slate-800/70" : "border-slate-200/70 bg-white/70"}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Coordinates</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{resolvedCoordinates}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-2xl border border-blue-500/15 bg-blue-500/5 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="inline-flex items-center gap-1.5"><MapPinned className="h-3.5 w-3.5 text-blue-500" /> Nearby cases: {nearbyCasesCount}</span>
                <span className="inline-flex items-center gap-1.5"><Radar className="h-3.5 w-3.5 text-rose-500" /> Hotspots: {hotspots.length}</span>
              </div>
            </motion.div>

            {/* Mini Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-12 xl:grid-cols-6">
              <div className={`group flex items-center justify-between rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md ${miniStatCardClass}`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Nearby Cases (&lt;5km)</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white md:text-3xl">{nearbyCasesCount}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400">
                  <MapPinned className="h-5 w-5" />
                </div>
              </div>

              <div className={`group flex items-center justify-between rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md ${miniStatCardClass}`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Hotspots Detected</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white md:text-3xl">{hotspots.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 transition-transform group-hover:scale-110 dark:bg-rose-500/20 dark:text-rose-400">
                  <Radar className="h-5 w-5" />
                </div>
              </div>

              <div className={`group flex items-center justify-between rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md ${miniStatCardClass}`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">7-Day Peak Forecast</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white md:text-3xl">{Math.round(forecastPeakRisk * 100)}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 transition-transform group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-400">
                  <Activity className="h-5 w-5" />
                </div>
              </div>

              {environmentSnapshot.map((metric) => (
                <div
                  key={metric.id}
                  className={`group flex items-center justify-between rounded-2xl border p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md ${miniStatCardClass}`}
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">{metric.label}</p>
                    <p className="mt-1 text-xl font-black text-slate-900 dark:text-white md:text-2xl">{metric.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${metric.bg}`}>
                    <metric.Icon className={`h-5 w-5 ${metric.tone}`} />
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.section>

          {/* System Status Notifications */}
          <AnimatePresence>
            {(showOfflineBanner || status.message) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                {showOfflineBanner && (
                  <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-700 backdrop-blur-md dark:text-amber-300">
                    <WifiOff className="h-5 w-5" /> Offline mode active. Showing cached intelligence.
                  </div>
                )}
                {status.message && (
                  <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold backdrop-blur-md ${statusTone[status.type] || statusTone.info}`}>
                    <Activity className="h-5 w-5" /> {status.message}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Grid Sections */}
          <div id="risk-check" className="grid scroll-mt-32 grid-cols-1 gap-5 xl:grid-cols-12">
            <div className={`xl:col-span-8 ${sectionShell}`}>
              <CitizenRiskForm
                register={registerRisk}
                watch={watchRisk}
                errors={riskErrors}
                onDetectLocation={applyDetectedLocation}
                onCheckRisk={handleRiskCheck}
                loading={riskLoading || detectingLocation}
                weatherLoading={fetchingWeather}
                riskResult={riskResult}
                riskLevel={riskLevel}
                recommendations={recommendations}
                onPickFromMap={handlePickFromMap}
                dataLoading={dataLoading}
                offlineResult={isOfflineResult}
                isDark={isDark}
              />
            </div>
            <div className={`xl:col-span-4 ${sectionShell}`}>
              <CitizenAlertsPanel
                alerts={alertsFeed}
                loading={dataLoading}
                notificationsEnabled={notificationsEnabled}
                notificationPermission={notificationPermission}
                onEnableNotifications={handleEnableNotifications}
                onDisableNotifications={handleDisableNotifications}
                isDark={isDark}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <section id="report-case" className={`scroll-mt-32 shadow-2xl shadow-blue-500/5 xl:col-span-8 ${sectionShell}`}>
              <CitizenReportForm
                register={registerReport}
                errors={reportErrors}
                loading={reportSubmitting}
                onSubmit={onSubmitReport}
                onUseCurrentGps={applyDetectedLocation}
                dataLoading={dataLoading}
                isDark={isDark}
              />
            </section>

            <div className="space-y-5 xl:col-span-4">
              <div className={sectionShell}>
                <CitizenTipsPanel tips={tips} loading={dataLoading} isDark={isDark} />
              </div>
              <div className={sectionShell}>
                <CitizenSubscriptionPanel
                  register={registerSubscription}
                  errors={subscriptionErrors}
                  onSubmit={onSubmitSubscription}
                  loading={subscriptionLoading}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>

          <section className={sectionShell}>
            <CitizenHistoryPanel
              history={history}
              areaHistory={areaHistory}
              locationName={getReportValues("locationName")}
              loading={dataLoading}
              refreshing={historyLoading}
              onRefresh={handleHistoryRefresh}
              isDark={isDark}
            />
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <section id="risk-map" ref={mapSectionRef} className={`scroll-mt-32 overflow-hidden shadow-2xl xl:col-span-8 ${sectionShell}`}>
              <Suspense fallback={<CitizenSkeletonCard rows={6} isDark={isDark} />}>
                <LazyCitizenRiskHeatmapMap
                  points={heatPoints}
                  loading={dataLoading}
                  title="Interactive Risk Map"
                  subtitle="Explore high-risk clusters or select your exact coordinates."
                  enablePicker={mapPickerEnabled}
                  selectedLocation={selectedLocation}
                  onSelectLocation={handleMapSelect}
                />
              </Suspense>
            </section>

            <section id="forecast" className={`scroll-mt-32 flex flex-col rounded-3xl border p-6 shadow-xl backdrop-blur-xl xl:col-span-4 ${forecastPanelClass}`} aria-labelledby="forecast-heading">
              <div className="mb-6">
                <h3 id="forecast-heading" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  <Activity className="h-6 w-6 text-blue-500" /> 7-Day Trajectory
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">AI forecasted risk levels based on environmental factors and current trends.</p>
              </div>

              <div className="flex-1 space-y-3">
                {sevenDayForecast.map((entry, idx) => (
                  <div key={entry.label} className={`group flex flex-col gap-1 rounded-2xl border p-3 transition-all ${forecastItemClass}`}>
                    <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-2">
                        <span className="w-6 text-xs text-slate-400">{idx === 0 ? "Tmr" : entry.label}</span>
                      </span>
                      <span>{Math.round(entry.score * 100)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/50">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(5, Math.round(entry.score * 100))}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className={`h-full rounded-full ${riskBar[entry.level] || riskBar.Low}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-6 rounded-2xl border p-4 ${forecastFocusClass}`}>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Key Focus Zones</p>
                {hotspots.length ? (
                  <ul className="mt-3 space-y-2 text-sm text-slate-800 dark:text-slate-200">
                    {hotspots.map((zone) => (
                      <li key={`${zone.locationName}-${zone.latitude}-${zone.longitude}`} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 truncate font-medium"><MapPinned className="h-4 w-4 text-rose-500" /> {zone.locationName}</span>
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">{Math.round(Number(zone.averageRisk || 0) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Environment looks safe. No active hotspots.</p>
                )}
              </div>
            </section>
          </div>

          <section className={sectionShell}>
            <Suspense fallback={<CitizenSkeletonCard rows={6} isDark={isDark} />}>
              <LazyRiskTrendChart
                data={trends}
                loading={dataLoading}
                title="Predictive AI Trends"
                subtitle="Historical patterns merged with advanced machine learning projections."
              />
            </Suspense>
          </section>
        </main>

        {/* Modern Footer */}
        <footer className={footerClass}>
          <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-6">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
              <div className="md:col-span-2">
                <Link to="/" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Activity className="h-4 w-4" />
                  </div>
                  <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">OutbreakSense AI Portal</span>
                </Link>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  A next-generation community-first surveillance platform. Empowering citizens with predictive intelligence to prevent and control outbreaks.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Navigation</p>
                <ul className="mt-4 space-y-2 text-sm font-medium">
                  {headerNavLinks.map((item) => (
                    <li key={`footer-${item.href}`}>
                      <a href={item.href} className="text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Emergency</p>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Severe symptoms like persistent vomiting or bleeding require immediate attention.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                  Helpline: 16263
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-200/60 pt-6 dark:border-white/10 sm:flex-row">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">© {currentYear} OutbreakSense AI Platform. All rights reserved.</p>
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 sm:mt-0">Built for public resilience.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CitizenPortal;