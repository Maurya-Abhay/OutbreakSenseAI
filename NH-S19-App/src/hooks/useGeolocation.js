import { useCallback, useState, useRef, useEffect } from "react";
import * as Location from "expo-location";
import { areValidCoordinates, sanitizeText } from "../utils/sanitize";

// Detailed address builder - shows district, city, state
const buildLocationName = (address = {}) => {
  if (!address) return "Current Location";
  
  // Build complete location details
  const parts = [];
  
  // Skip Plus Code names like "FQ28+2R4"
  const isPlusCode = (str) => /^[A-Z0-9]{2,4}\+[A-Z0-9]{2,4}$/.test(str);
  
  // Street address / Name / Locality (most specific)
  if (address.name && address.name.length > 0 && !isPlusCode(address.name)) {
    parts.push(sanitizeText(address.name, 60));
  }
  if (address.street && address.street.length > 0) {
    parts.push(sanitizeText(address.street, 60));
  }
  
  // City / Municipality
  if (address.city && address.city.length > 0) {
    parts.push(sanitizeText(address.city, 60));
  } else if (address.subregion && address.subregion.length > 0) {
    parts.push(sanitizeText(address.subregion, 60));
  }
  
  // District / County
  if (address.district && address.district.length > 0) {
    parts.push(`Dist. ${sanitizeText(address.district, 40)}`);
  }
  
  // State / Province / Region
  if (address.region && address.region.length > 0) {
    parts.push(sanitizeText(address.region, 50));
  }
  
  // Country
  if (address.country && address.country.length > 0) {
    parts.push(sanitizeText(address.country, 30));
  }
  
  const filtered = parts.filter((p) => p && p.length > 0);
  
  if (!filtered.length) {
    // Fallback: use latitude, longitude format
    if (address.latitude && address.longitude) {
      return `📍 ${Number(address.latitude).toFixed(3)}°, ${Number(address.longitude).toFixed(3)}°`;
    }
    return "Current Location";
  }
  
  // Return detailed format
  return filtered.join(", ").slice(0, 180); // Max 180 chars to fit in UI
};

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("undetermined");
  const [error, setError] = useState("");
  const autoDetectionIntervalRef = useRef(null);

  const requestPermission = useCallback(async ({ requestIfNeeded = true } = {}) => {
    const current = await Location.getForegroundPermissionsAsync();
    let next = current;

    if (current.status !== "granted" && requestIfNeeded) {
      next = await Location.requestForegroundPermissionsAsync();
    }

    setPermissionStatus(next.status);
    return next;
  }, []);

  const setManualLocation = useCallback(({ latitude, longitude, locationName }) => {
    if (!areValidCoordinates(latitude, longitude)) return;

    setLocation({
      latitude: Number(latitude),
      longitude: Number(longitude),
      locationName: sanitizeText(locationName || "Manual Pin", 120),
      source: "manual",
      timestamp: new Date().toISOString()
    });
  }, []);

  const detectLocation = useCallback(async ({ requestIfNeeded = true } = {}) => {
    setLoading(true);
    setError("");

    try {
      const permission = await requestPermission({ requestIfNeeded });
      if (permission.status !== "granted") {
        throw new Error("Location permission denied.");
      }

      // FAST: Try last known location first
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown && !location) {
        const initialLoc = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          locationName: "Previous Location",
          source: "gps-last-known",
          timestamp: new Date().toISOString()
        };
        setLocation(initialLoc);
      }

      // Get fresh location with REDUCED timeout (5 sec instead of 10)
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 5000, // Reduced from 10s to 5s for faster response
      });

      const latitude = Number(current.coords.latitude.toFixed(6));
      const longitude = Number(current.coords.longitude.toFixed(6));
      let locationName = "Current Location";

      // IMPORTANT: Return coordinates immediately, geocode in background
      const next = {
        latitude,
        longitude,
        locationName,
        source: "gps-fresh",
        timestamp: new Date().toISOString(),
        accuracy: current.coords.accuracy
      };

      setLocation(next);

      // Non-blocking: Geocode in background (don't wait, don't block UI)
      Location.reverseGeocodeAsync({ latitude, longitude })
        .then((reverse) => {
          if (reverse?.[0]) {
            const addr = reverse[0];
            
            // DEBUG: Log all available fields
            console.log("📍 GEOCODING RESPONSE:", JSON.stringify(addr, null, 2));
            
            const address = buildLocationName(addr);
            console.log("📍 BUILT LOCATION NAME:", address);
            
            setLocation((prev) => ({
              ...prev,
              locationName: address,
              source: "gps-fresh-geocoded"
            }));
          }
        })
        .catch(() => {
          // Silent fail - we already have coordinates
        });

      return next;
    } catch (err) {
      const message = err?.message || "GPS detection failed.";
      setError(message);
      
      // FALLBACK: Use last known if available
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          const fallback = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            locationName: "Last Known Location",
            source: "gps-fallback",
            timestamp: new Date().toISOString()
          };
          setLocation(fallback);
          return fallback;
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [requestPermission, location]);

  // ── Automatic Periodic Location Detection ────────────────────────────────
  // Background location polling with optimized intervals
  const startAutoLocationDetection = useCallback(
    ({ intervalMs = 120000 } = {}) => {
      // 120000ms = 2 minutes default (faster for maps/reports)
      if (autoDetectionIntervalRef.current) {
        clearInterval(autoDetectionIntervalRef.current);
      }

      // Immediately detect on first call (non-blocking)
      detectLocation({ requestIfNeeded: false }).catch(console.log);

      // Set up faster periodic polling
      autoDetectionIntervalRef.current = setInterval(() => {
        detectLocation({ requestIfNeeded: false }).catch(console.log);
      }, intervalMs);

      // Return cleanup function
      return () => {
        if (autoDetectionIntervalRef.current) {
          clearInterval(autoDetectionIntervalRef.current);
          autoDetectionIntervalRef.current = null;
        }
      };
    },
    [detectLocation]
  );

  // Stop auto detection manually if needed
  const stopAutoLocationDetection = useCallback(() => {
    if (autoDetectionIntervalRef.current) {
      clearInterval(autoDetectionIntervalRef.current);
      autoDetectionIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoDetectionIntervalRef.current) {
        clearInterval(autoDetectionIntervalRef.current);
      }
    };
  }, []);

  return {
    location,
    loading,
    error,
    permissionStatus,
    requestPermission,
    detectLocation,
    setManualLocation,
    startAutoLocationDetection,
    stopAutoLocationDetection
  };
};