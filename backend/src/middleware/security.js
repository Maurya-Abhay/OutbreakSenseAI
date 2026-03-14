import helmet from "helmet";
import rateLimit from "express-rate-limit";
import config from "../config/env.js";

const RATE_LIMIT_MESSAGE = {
  message: "Too many requests. Please try again shortly."
};

const buildLimiter = (max, options = {}) =>
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    ...RATE_LIMIT_MESSAGE,
    ...options
  });

export const globalRateLimit = buildLimiter(config.rateLimitMax, {
  skip: (req) => req.path === "/api/health"
});

export const authRateLimit = buildLimiter(config.authRateLimitMax);
export const reportRateLimit = buildLimiter(Math.max(10, Math.floor(config.rateLimitMax / 4)));

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
});

const sanitizePrimitive = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim();
};

const sanitizeValue = (value, depth = 0) => {
  if (depth > 10 || value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const sanitized = {};

    Object.entries(value).forEach(([rawKey, rawVal]) => {
      // Drop MongoDB operators and dotted keys to reduce injection surface.
      if (!rawKey || rawKey.startsWith("$")) {
        return;
      }

      const key = rawKey.replace(/\./g, "");
      sanitized[key] = sanitizeValue(rawVal, depth + 1);
    });

    return sanitized;
  }

  return sanitizePrimitive(value);
};

export const sanitizePayload = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }

  next();
};
