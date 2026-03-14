import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  lastRisk: "nhs19:lastRisk",
  tips: "nhs19:tips",
  heatmap: "nhs19:heatmap",
  alerts: "nhs19:alerts"
};

// --- Storage Lifespans (In Milliseconds) ---
const TTL = {
  RISK: 60 * 60 * 1000,          // 1 Hour (Weather/Risk changes fast)
  TIPS: 24 * 60 * 60 * 1000,     // 24 Hours
  MAP: 3 * 60 * 60 * 1000,       // 3 Hours
  ALERTS: 48 * 60 * 60 * 1000    // 48 Hours
};

const setJson = async (key, value) => {
  try {
    const payload = {
      data: value,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.error(`Cache Save Error [${key}]:`, err);
  }
};

const getJson = async (key, maxAge = null) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    
    // Check if data is too old
    if (maxAge && Date.now() - parsed.timestamp > maxAge) {
      await AsyncStorage.removeItem(key); // Auto-purge stale data
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.error(`Cache Read Error [${key}]:`, err);
    return null;
  }
};

// --- Risk Prediction Cache ---
export const cacheRiskResult = async (value) => setJson(KEYS.lastRisk, value);

export const getCachedRiskResult = async () => {
  const data = await getJson(KEYS.lastRisk, TTL.RISK);
  return data ? { value: data, cachedAt: new Date().toISOString() } : null;
};

// --- Prevention Tips Cache ---
export const cacheTips = async (tips) => setJson(KEYS.tips, tips);

export const getCachedTips = async () => {
  const data = await getJson(KEYS.tips, TTL.TIPS);
  return { tips: data || [] };
};

// --- Map & Trends Cache ---
export const cacheMapData = async ({ points, trends }) => 
  setJson(KEYS.heatmap, { points, trends });

export const getCachedMapData = async () => {
  const data = await getJson(KEYS.heatmap, TTL.MAP);
  return { 
    points: data?.points || [], 
    trends: data?.trends || [] 
  };
};

// --- Alerts Feed Cache ---
export const cacheAlerts = async (alerts) => setJson(KEYS.alerts, alerts);

export const getCachedAlerts = async () => {
  const data = await getJson(KEYS.alerts, TTL.ALERTS);
  return { alerts: data || [] };
};

// --- Utility: Clear all app data ---
export const clearAppCache = async () => {
  try {
    const allKeys = Object.values(KEYS);
    await AsyncStorage.multiRemove(allKeys);
  } catch (err) {
    console.error("Cache Clear Error:", err);
  }
};