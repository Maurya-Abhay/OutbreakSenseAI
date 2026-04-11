import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { playHighAlert } from "./soundAlertService";

const LOCATION_TASK_NAME = "background-location-monitor";
const DANGER_ZONE_THRESHOLD = 0.5; // 0.5 km = 500 meters

// List of high-risk zones (latitude, longitude, radius in km)
const HIGH_RISK_ZONES = [
  { name: "Delhi Central", lat: 28.7041, lon: 77.1025, radius: 2 },
  { name: "Mumbai Downtown", lat: 19.0760, lon: 72.8777, radius: 2 },
  { name: "Bangalore Central", lat: 12.9716, lon: 77.5946, radius: 2 },
  { name: "Kolkata Central", lat: 22.5726, lon: 88.3639, radius: 2 },
  { name: "Hyderabad Central", lat: 17.3850, lon: 78.4867, radius: 2 },
];

/**
 * Calculate distance between two coordinates in km
 * Using Haversine formula
 */
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
 * Check if location is in danger zone
 */
const checkDangerZone = (latitude, longitude) => {
  for (const zone of HIGH_RISK_ZONES) {
    const distance = calculateDistance(latitude, longitude, zone.lat, zone.lon);
    if (distance <= zone.radius) {
      return { isDanger: true, zone: zone.name, distance };
    }
  }
  return { isDanger: false, zone: null, distance: null };
};

/**
 * Background location task handler
 * This runs even when app is in background or killed
 */
if (Platform.OS !== "web" && typeof TaskManager.defineTask === "function") {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.log("Background location error:", error.message);
      return;
    }

  if (data) {
    const { locations } = data;
    const { latitude, longitude } = locations[0];

    // Get stored last alert time to prevent spam
    let lastAlertTime = 0;
    try {
      const stored = await AsyncStorage.getItem("lastDangerAlert");
      lastAlertTime = stored ? parseInt(stored) : 0;
    } catch (err) {
      console.log("Error getting last alert time:", err.message);
    }

    const now = Date.now();
    const timeSinceLastAlert = now - lastAlertTime;

    // Check danger zone
    const { isDanger, zone, distance } = checkDangerZone(latitude, longitude);

    if (isDanger && timeSinceLastAlert > 30000) {
      // Alert only once per 30 seconds
      try {
        // Store alert time
        await AsyncStorage.setItem("lastDangerAlert", String(now));

        // Store current danger location for UI to display
        await AsyncStorage.setItem(
          "currentDangerLocation",
          JSON.stringify({
            latitude,
            longitude,
            zone,
            distance: distance.toFixed(2),
            timestamp: new Date().toLocaleTimeString()
          })
        );

        // Play alert sound
        await playHighAlert();

        // Log for debugging
        console.log(
          `🚨 DANGER ZONE DETECTED: ${zone} (${distance.toFixed(2)} km away)`
        );
      } catch (err) {
        console.log("Error handling danger alert:", err.message);
      }
    }
    }
  });
}

/**
 * Start background location monitoring
 * Returns: { success, error?, code? }
 */
export const startBackgroundLocationMonitoring = async () => {
  try {
    if (Platform.OS === "web") {
      return {
        success: false,
        error: "Background location monitoring is not supported on web",
        code: "WEB_UNSUPPORTED"
      };
    }

    // Check if task is already defined
    const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    console.log("Location task defined:", isTaskDefined);

    // Request permissions
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== "granted") {
      console.error("Foreground location permission denied by user");
      return { 
        success: false, 
        error: "Location permission required for danger zone alerts",
        code: "FOREGROUND_PERMISSION_DENIED"
      };
    }

    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== "granted") {
      console.warn("Background location permission denied (non-critical)");
      // Continue anyway - foreground permission is sufficient
    }

    // Start watching location with high accuracy every 10 seconds
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // 10 seconds
      distanceInterval: 100, // 100 meters
      foregroundService: {
        notificationTitle: "OutbreakSense Monitoring",
        notificationBody: "Monitoring dengue risk zones in real-time",
        notificationColor: "#F59E0B",
      },
    });

    console.log("✅ Background location monitoring started");
    return { success: true };
  } catch (error) {
    console.error("Error starting background location:", error.message);
    return { 
      success: false, 
      error: error.message,
      code: "LOCATION_SERVICE_ERROR"
    };
  }
};

/**
 * Stop background location monitoring
 */
export const stopBackgroundLocationMonitoring = async () => {
  try {
    if (Platform.OS === "web") {
      return;
    }

    const isProviding = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );

    if (isProviding) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log("✅ Background location monitoring stopped");
    }
  } catch (error) {
    console.error("Error stopping background location:", error.message);
  }
};

/**
 * Check if background monitoring is active
 */
export const isBackgroundMonitoringActive = async () => {
  try {
    if (Platform.OS === "web") {
      return false;
    }

    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch (err) {
    console.log("Error checking monitoring status:", err.message);
    return false;
  }
};

/**
 * Get current danger alert info (if any)
 */
export const getCurrentDangerAlert = async () => {
  try {
    const stored = await AsyncStorage.getItem("currentDangerLocation");
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (err) {
    console.log("Error getting danger alert:", err.message);
    return null;
  }
};

/**
 * Clear danger alert
 */
export const clearDangerAlert = async () => {
  try {
    await AsyncStorage.removeItem("currentDangerLocation");
    await AsyncStorage.removeItem("lastDangerAlert");
  } catch (err) {
    console.log("Error clearing danger alert:", err.message);
  }
};

/**
 * Get all high risk zones
 */
export const getHighRiskZones = () => HIGH_RISK_ZONES;
