import { useCallback, useState } from "react";
import * as Location from "expo-location";
import { areValidCoordinates, sanitizeText } from "../utils/sanitize";

// Address builder ko thoda aur robust banaya
const buildLocationName = (address = {}) => {
  const pieces = [
    address.district, 
    address.city || address.subregion, 
    address.region
  ]
    .map((item) => sanitizeText(item, 60))
    .filter(Boolean);

  if (!pieces.length) return "Current Location";
  // Pehle do relevant pieces uthayenge (e.g., "South Delhi, Delhi")
  return [...new Set(pieces)].slice(0, 2).join(", ");
};

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("undetermined");
  const [error, setError] = useState("");

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

      // Optimization: Pehle last known location check karein (Fast response)
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown && !location) {
        // Sirf tab set karein agar hamare paas koi location nahi hai
        const initialLoc = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          locationName: "Approx. Location",
          source: "gps-last-known",
          timestamp: new Date().toISOString()
        };
        setLocation(initialLoc);
      }

      // Ab actual fresh location fetch karein
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000, // 10 seconds timeout
      });

      const latitude = Number(current.coords.latitude.toFixed(6));
      const longitude = Number(current.coords.longitude.toFixed(6));

      let locationName = "Current Location";
      try {
        // Reverse Geocode with a short delay/timeout safe check
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverse?.[0]) {
          locationName = buildLocationName(reverse[0]);
        }
      } catch (e) {
        console.log("Geocoding failed, using coordinates as name.");
      }

      const next = {
        latitude,
        longitude,
        locationName,
        source: "gps-fresh",
        timestamp: new Date().toISOString(),
        accuracy: current.coords.accuracy
      };

      setLocation(next);
      return next;
    } catch (err) {
      const message = err?.message || "GPS detection failed.";
      setError(message);
      // Fallback: Agar location bilkul nahi mili, default set kar sakte hain (optional)
    } finally {
      setLoading(false);
    }
  }, [requestPermission, location]);

  return {
    location,
    loading,
    error,
    permissionStatus,
    requestPermission,
    detectLocation,
    setManualLocation
  };
};