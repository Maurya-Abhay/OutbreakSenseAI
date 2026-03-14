import { useCallback, useMemo, useRef, useState } from "react";
import { z } from "zod";
import api from "../api/client";

const RISK_CACHE_KEY = "nhs19_cached_risk_result";
const RISK_CACHE_TTL_MS = 20 * 60 * 1000;

const riskResponseSchema = z
  .object({
    risk_level: z.string().default("Low"),
    risk_score: z.coerce.number().min(0).max(1).default(0),
    source: z.string().optional(),
    explainability: z
      .object({
        top_factors: z
          .array(
            z.object({
              factor: z.string().default("unknown"),
              contribution: z.coerce.number().default(0)
            })
          )
          .default([])
      })
      .optional()
  })
  .passthrough();

const recommendationByRisk = {
  Low: [
    "Use mosquito repellent during dawn and dusk.",
    "Eliminate stagnant water around your home every 48 hours.",
    "Keep windows screened and sleep under a net when needed."
  ],
  Medium: [
    "Start household vector control and larvicide checks.",
    "Monitor symptoms in family members for 3 to 5 days.",
    "Report new fever cases quickly to local authorities."
  ],
  High: [
    "Urgent: Coordinate with local health workers for vector control.",
    "Avoid outdoor exposure during peak mosquito hours.",
    "Seek immediate medical advice for fever, vomiting, or bleeding signs."
  ]
};

const normalizeRiskLevel = (riskLevel) => {
  const normalized = String(riskLevel || "Low").toLowerCase();
  if (normalized.includes("high")) return "High";
  if (normalized.includes("med")) return "Medium";
  return "Low";
};

export const useRiskPrediction = () => {
  const [riskResult, setRiskResult] = useState(() => {
    const cached = localStorage.getItem(RISK_CACHE_KEY);
    if (!cached) return null;

    try {
      const parsed = JSON.parse(cached);

      // Backward compatible format: prior versions stored result directly.
      if (parsed && parsed.risk_level) {
        return riskResponseSchema.parse(parsed);
      }

      const ageMs = Date.now() - Number(parsed?.cachedAt || 0);
      if (!parsed?.cachedAt || ageMs > RISK_CACHE_TTL_MS) {
        return null;
      }

      return riskResponseSchema.parse(parsed.payload);
    } catch {
      return null;
    }
  });
  const [riskLoading, setRiskLoading] = useState(false);
  const [isOfflineResult, setIsOfflineResult] = useState(false);
  const debounceRef = useRef(null);

  const storeRiskResult = useCallback((nextResult) => {
    localStorage.setItem(
      RISK_CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        payload: nextResult
      })
    );
    setRiskResult(nextResult);
  }, []);

  const checkRisk = useCallback(
    async (params) => {
      setRiskLoading(true);

      try {
        const response = await api.get("/risk/current", { params });
        const parsed = riskResponseSchema.parse(response.data);
        setIsOfflineResult(false);
        storeRiskResult(parsed);
        return parsed;
      } catch (requestError) {
        const isNetworkIssue = !requestError.response || !navigator.onLine;

        if (isNetworkIssue) {
          const cached = localStorage.getItem(RISK_CACHE_KEY);
          if (cached) {
            try {
              const parsedCache = JSON.parse(cached);
              const payload = parsedCache?.payload || parsedCache;
              const parsed = riskResponseSchema.parse(payload);
              setIsOfflineResult(true);
              setRiskResult(parsed);
              return parsed;
            } catch {
              // Ignore invalid cache and rethrow original error below.
            }
          }
        }

        throw new Error(requestError.response?.data?.message || "Unable to calculate risk right now.");
      } finally {
        setRiskLoading(false);
      }
    },
    [storeRiskResult]
  );

  const checkRiskDebounced = useCallback(
    (params, delay = 350) =>
      new Promise((resolve, reject) => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(async () => {
          try {
            const result = await checkRisk(params);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      }),
    [checkRisk]
  );

  const riskLevel = useMemo(() => normalizeRiskLevel(riskResult?.risk_level), [riskResult?.risk_level]);

  const recommendations = useMemo(() => recommendationByRisk[riskLevel] || recommendationByRisk.Low, [riskLevel]);

  return {
    riskResult,
    riskLevel,
    riskLoading,
    isOfflineResult,
    recommendations,
    checkRisk,
    checkRiskDebounced,
    setRiskResult
  };
};
