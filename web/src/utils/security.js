import DOMPurify from "dompurify";

export const sanitizeText = (value, maxLength = 400) => {
  const source = String(value ?? "").trim().slice(0, maxLength);
  return DOMPurify.sanitize(source, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

export const sanitizeCsvList = (value, maxLength = 500) =>
  sanitizeText(value, maxLength)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");

export const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toBoundedNumber = (value, min, max, fallback = min) => {
  const parsed = toSafeNumber(value, fallback);
  return Math.min(max, Math.max(min, parsed));
};
