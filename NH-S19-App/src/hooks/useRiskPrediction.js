import { useCallback, useEffect, useState, useRef } from "react";
import { apiClient } from "../services/apiClient";
import { cacheRiskResult, getCachedRiskResult } from "../services/storageService";
import { sendLocalNotification } from "../services/notificationService";
import { fetchCurrentWeather } from "../services/weatherService";
import { areValidCoordinates, buildQuery, clampNumber, parseNumber, sanitizeText } from "../utils/sanitize";

const normalizeExplainability = (result) => {
  const topFactors = result?.explainability?.top_factors || result?.aiExplainability?.topFactors || [];
  if (!Array.isArray(topFactors)) return [];

  return topFactors.slice(0, 5).map((f) => ({
    factor: sanitizeText(f.factor || f.name || "Environmental Factor", 60),
    contribution: Number(f.contribution || 0)
  }));
};

export const useRiskPrediction = ({ onHighRiskDetected } = {}) => {
  const [riskResult, setRiskResult] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState("");
  const [weatherSnapshot, setWeatherSnapshot] = useState(null);
  const [isOfflineResult, setIsOfflineResult] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  
  // Race condition prevent karne ke liye request tracker
  const requestCounter = useRef(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const cached = await getCachedRiskResult();
      if (mounted && cached?.value) {
        setRiskResult(cached.value);
        setWeatherSnapshot(cached.value?.weatherUsed || null);
        setLastCheckedAt(cached.cachedAt || cached.value?.checkedAt || null);
        setIsOfflineResult(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const runRiskCheck = useCallback(async ({ location, weatherOverride } = {}) => {
    if (!location || !areValidCoordinates(location.latitude, location.longitude)) {
      throw new Error("Precise location is required for AI prediction.");
    }

    const requestId = ++requestCounter.current;
    setRiskLoading(true);
    setRiskError("");

    const locName = sanitizeText(location.locationName || "Your Area", 120);

    try {
      // 🌦️ Weather Acquisition
      let weather = weatherOverride;
      if (!weather) {
        try {
          weather = await fetchCurrentWeather(location.latitude, location.longitude);
        } catch (wErr) {
          // Weather fail hone par purana snapshot use karne ki koshish
          if (weatherSnapshot) weather = weatherSnapshot;
          else throw new Error("Could not acquire weather data for prediction.");
        }
      }

      // 🛠️ Model Input Normalization
      const query = buildQuery({
        locationName: locName,
        latitude: location.latitude,
        longitude: location.longitude,
        temperature: clampNumber(weather.temperature, 10, 50, 28), // Optimized clamps
        rainfall: clampNumber(weather.rainfall, 0, 1000, 50),
        humidity: clampNumber(weather.humidity, 10, 100, 65)
      });

      // 🧠 AI Inference
      const response = await apiClient.get(`/prediction?${query}`);

      // Check if this request is still relevant
      if (requestId !== requestCounter.current) return;

      const payload = {
        ...response,
        explainabilityFactors: normalizeExplainability(response),
        checkedAt: new Date().toISOString(),
        weatherUsed: {
          temperature: parseNumber(weather.temperature, 28),
          rainfall: parseNumber(weather.rainfall, 50),
          humidity: parseNumber(weather.humidity, 65),
          source: weather.source || "satellite-live"
        }
      };

      setRiskResult(payload);
      setWeatherSnapshot(payload.weatherUsed);
      setLastCheckedAt(payload.checkedAt);
      setIsOfflineResult(false);
      await cacheRiskResult(payload);

      // 🚨 High Priority Alerting Logic
      const currentLevel = String(payload?.risk_level || "").toLowerCase();
      if (currentLevel === "high" || currentLevel === "critical") {
        await sendLocalNotification({
          title: "⚠️ High Dengue Risk Alert",
          body: `The AI model detected a critical risk level in ${locName}. Take immediate preventive measures.`,
          data: { type: "risk_alert", score: payload.risk_score },
          highPriority: true
        });

        if (onHighRiskDetected) onHighRiskDetected(payload, locName);
      }

      return payload;
    } catch (error) {
      if (requestId !== requestCounter.current) return;
      
      setRiskError(error?.message || "Prediction engine is currently unreachable.");
      
      // Sync with cache as fallback
      const cached = await getCachedRiskResult();
      if (cached?.value) {
        setRiskResult(cached.value);
        setIsOfflineResult(true);
        return cached.value;
      }
      throw error;
    } finally {
      if (requestId === requestCounter.current) setRiskLoading(false);
    }
  }, [onHighRiskDetected, weatherSnapshot]);

  return {
    riskResult,
    riskLoading,
    riskError,
    weatherSnapshot,
    isOfflineResult,
    lastCheckedAt,
    runRiskCheck
  };
};