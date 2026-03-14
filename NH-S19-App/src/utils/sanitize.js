/**
 * Text ko clean karta hai aur script tags/control characters hatata hai.
 * Dengue reports mein users aksar emojis ya weird characters daal dete hain.
 */
export const sanitizeText = (value, maxLength = 160) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Control characters
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Script tag removal
    .replace(/[<>]/g, "") // Tag symbols removal
    .trim()
    .slice(0, maxLength);

export const normalizeEmail = (value) => sanitizeText(value, 160).toLowerCase();

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));

/**
 * Symptoms ko array ya string se clean karke ek uniform list banata hai.
 */
export const sanitizeSymptoms = (value) => {
  const items = Array.isArray(value) 
    ? value 
    : String(value || "").split(",");

  return items
    .map((item) => sanitizeText(item, 80))
    .filter(Boolean)
    .slice(0, 15); // Limit to 15 symptoms for UI stability
};

export const clampNumber = (value, min, max, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const parseNumber = (value, fallback = NaN) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * GPS Accuracy filter ke saath coordinates check karta hai.
 */
export const areValidCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

/**
 * API Requests ke liye clean Query String banata hai.
 */
export const buildQuery = (params) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value).trim())}`)
    .join("&");

/**
 * Do points ke beech ka rasta (displacement) calculate karta hai.
 * 
 */
export const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

/**
 * Phone numbers se spaces aur special chars hatata hai.
 */
export const sanitizePhone = (value) => {
  return String(value || "").replace(/[^\d+]/g, "").slice(0, 15);
};