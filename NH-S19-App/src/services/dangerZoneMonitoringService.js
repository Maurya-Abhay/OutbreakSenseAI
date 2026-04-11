import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { playHighAlert, stopAlert } from "./soundAlertService";
import { sendLocalNotification } from "./notificationService";

const MONITORING_ENABLED_KEY = "danger_zone_monitoring_enabled";
const BATTERY_OPTIMIZED_KEY = "battery_optimized_mode";
const LAST_CHECKED_ZONE_KEY = "last_checked_danger_zone";
const ACTIVE_DANGER_ZONE_KEY = "active_danger_zone";

let isMonitoring = false;
let monitoringInterval = null;
let lastCheckTime = 0;

// Distance calculation (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get high-risk zones from API
 * Fallback to hardcoded zones if API fails
 */
const fetchHighRiskZones = async () => {
  try {
    const response = await fetch("http://localhost:5050/api/admin/alerts", {
      method: "GET",
      timeout: 5000
    });
    const data = await response.json();
    const alerts = data?.alerts || [];

    return alerts
      .filter(a => a.isActive && a.severity === "high")
      .map(a => ({
        name: a.locationName,
        lat: a.coordinates?.[1] || 28.7041, // Default to Delhi
        lon: a.coordinates?.[0] || 77.1025,
        radius: 1.5, // 1.5 km danger zone
        riskScore: a.riskScore || 80
      }));
  } catch (err) {
    console.log("Failed to fetch zones from API, using defaults");
    return getDefaultHighRiskZones();
  }
};

const getDefaultHighRiskZones = () => [
  { name: "Delhi Central", lat: 28.7041, lon: 77.1025, radius: 1.5, riskScore: 85 },
  { name: "Mumbai Downtown", lat: 19.0760, lon: 72.8777, radius: 1.5, riskScore: 82 },
];

/**
 * Check if location is in any danger zone
 */
const checkDangerZone = (latitude, longitude, zones) => {
  for (const zone of zones) {
    const distance = calculateDistance(latitude, longitude, zone.lat, zone.lon);
    if (distance <= zone.radius) {
      return {
        isDanger: true,
        zone: zone.name,
        distance: distance.toFixed(2),
        riskScore: zone.riskScore,
        lat: zone.lat,
        lon: zone.lon
      };
    }
  }
  return { isDanger: false, zone: null, distance: null };
};

/**
 * Get check interval based on battery optimization mode
 * Battery saver: 120-300 seconds (2-5 minutes)
 * Normal: 30-60 seconds
 */
const getCheckInterval = async () => {
  try {
    const isBatteryOptimized = await AsyncStorage.getItem(BATTERY_OPTIMIZED_KEY);
    
    if (isBatteryOptimized === "true") {
      // Battery saver mode: 2-5 minutes
      return Math.random() * 180000 + 120000; // 2-5 min
    } else {
      // Normal mode: 30-60 seconds
      return Math.random() * 30000 + 30000; // 30-60 sec
    }
  } catch {
    return 60000; // Default: 1 minute
  }
};

/**
 * Check current location against danger zones
 */
const checkLocationAndAlert = async () => {
  try {
    const now = Date.now();

    // Throttle: Don't check more than every 5 seconds
    if (now - lastCheckTime < 5000) return;
    lastCheckTime = now;

    // Get current location
    const location = await Location.getLastKnownPositionAsync();
    if (!location) return;

    const { latitude, longitude } = location.coords;
    const zones = await fetchHighRiskZones();

    // Check danger zone
    const zoneCheck = checkDangerZone(latitude, longitude, zones);

    // Get current state
    const activeZone = await AsyncStorage.getItem(ACTIVE_DANGER_ZONE_KEY);
    const wasInDanger = activeZone ? JSON.parse(activeZone) : null;

    if (zoneCheck.isDanger) {
      // Entered danger zone
      if (!wasInDanger || wasInDanger.zone !== zoneCheck.zone) {
        // New danger zone detected
        await AsyncStorage.setItem(ACTIVE_DANGER_ZONE_KEY, JSON.stringify(zoneCheck));

        // Store for UI display
        await AsyncStorage.setItem(
          LAST_CHECKED_ZONE_KEY,
          JSON.stringify({
            ...zoneCheck,
            timestamp: new Date().toISOString(),
            userLat: latitude,
            userLon: longitude
          })
        );

        // Play alert
        await playHighAlert().catch(() => {});

        // Send notification
        await sendLocalNotification({
          title: "⚠️ Danger Zone Alert",
          body: `You've entered ${zoneCheck.zone}. Risk level: ${zoneCheck.riskScore}/100`,
          highPriority: true
        }).catch(() => {});
      }
    } else {
      // Left danger zone
      if (wasInDanger) {
        await AsyncStorage.removeItem(ACTIVE_DANGER_ZONE_KEY);
        await stopAlert().catch(() => {});
      }
    }
  } catch (error) {
    console.log("Error checking location:", error.message);
  }
};

/**
 * Start background monitoring
 */
export const startBackgroundMonitoring = async () => {
  try {
    const isEnabled = await AsyncStorage.getItem(MONITORING_ENABLED_KEY);
    if (isEnabled !== "true") {
      console.log("Background monitoring is disabled in settings");
      return false;
    }

    if (isMonitoring) {
      console.log("Monitoring already running");
      return true;
    }

    // Request location permission
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      console.log("Location permission denied");
      return false;
    }

    isMonitoring = true;

    // Start periodic check
    const runCheck = async () => {
      await checkLocationAndAlert();
      const interval = await getCheckInterval();
      monitoringInterval = setTimeout(runCheck, interval);
    };

    // First check immediately
    await checkLocationAndAlert();

    // Schedule next check
    const interval = await getCheckInterval();
    monitoringInterval = setTimeout(runCheck, interval);

    console.log("✅ Background monitoring started");
    return true;
  } catch (error) {
    console.error("Error starting monitoring:", error);
    isMonitoring = false;
    return false;
  }
};

/**
 * Stop background monitoring
 */
export const stopBackgroundMonitoring = async () => {
  if (monitoringInterval) {
    clearTimeout(monitoringInterval);
    monitoringInterval = null;
  }
  isMonitoring = false;
  await stopAlert().catch(() => {});
  await AsyncStorage.removeItem(ACTIVE_DANGER_ZONE_KEY);
  console.log("✅ Background monitoring stopped");
};

/**
 * Enable/disable monitoring in settings
 */
export const setMonitoringEnabled = async (enabled) => {
  await AsyncStorage.setItem(MONITORING_ENABLED_KEY, enabled ? "true" : "false");

  if (enabled) {
    await startBackgroundMonitoring();
  } else {
    await stopBackgroundMonitoring();
  }

  return enabled;
};

export const isMonitoringEnabled = async () => {
  const value = await AsyncStorage.getItem(MONITORING_ENABLED_KEY);
  return value === "true";
};

/**
 * Battery optimization mode
 */
export const setBatteryOptimized = async (optimized) => {
  await AsyncStorage.setItem(BATTERY_OPTIMIZED_KEY, optimized ? "true" : "false");
  return optimized;
};

export const isBatteryOptimized = async () => {
  const value = await AsyncStorage.getItem(BATTERY_OPTIMIZED_KEY);
  return value === "true";
};

/**
 * Get current danger zone info
 */
export const getCurrentDangerZoneInfo = async () => {
  try {
    const data = await AsyncStorage.getItem(LAST_CHECKED_ZONE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Clear danger zone alert
 */
export const clearDangerZoneAlert = async () => {
  await AsyncStorage.removeItem(ACTIVE_DANGER_ZONE_KEY);
  await AsyncStorage.removeItem(LAST_CHECKED_ZONE_KEY);
  await stopAlert().catch(() => {});
};
