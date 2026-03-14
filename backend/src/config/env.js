import dotenv from "dotenv";

dotenv.config();

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "y", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseList = (value, fallback) =>
  String(value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const configuredCorsOrigins = parseList(
  process.env.CORS_ORIGIN,
  "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081"
);
const devCorsOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8081"];
const corsOrigins = Array.from(new Set([...configuredCorsOrigins, ...(isProduction ? [] : devCorsOrigins)]));
const socketCorsOrigins = parseList(process.env.SOCKET_CORS_ORIGIN, corsOrigins.join(","));
const devOriginPattern =
  /^https?:\/\/(?:(?:localhost|127\.0\.0\.1)|(?:10(?:\.\d{1,3}){3})|(?:192\.168(?:\.\d{1,3}){2})|(?:172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}))(?::\d+)?$/i;

const jwtSecret = process.env.JWT_SECRET || (isProduction ? "" : "dev-only-change-this-secret");

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (corsOrigins.includes(origin)) {
    return true;
  }

  return nodeEnv !== "production" && devOriginPattern.test(origin);
};

const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5050),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/outbreaksense",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  aiEngineUrl: process.env.AI_ENGINE_URL || "http://127.0.0.1:8001",
  corsOrigin: configuredCorsOrigins.join(","),
  corsOrigins,
  socketCorsOrigins,
  isAllowedOrigin,
  bodyLimit: process.env.BODY_LIMIT || "1mb",
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 120),
  authRateLimitMax: parseNumber(process.env.AUTH_RATE_LIMIT_MAX, 12),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
  seedDefaultAdmin: parseBoolean(process.env.SEED_DEFAULT_ADMIN, !isProduction),
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || "admin@outbreaksense.ai",
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || (isProduction ? "" : "Admin@123")
};

if (isProduction && (!config.jwtSecret || config.jwtSecret.length < 24)) {
  throw new Error("JWT_SECRET must be set to a strong value (>=24 chars) in production.");
}

if (config.seedDefaultAdmin && (!config.defaultAdminEmail || !config.defaultAdminPassword)) {
  throw new Error(
    "DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD are required when SEED_DEFAULT_ADMIN is enabled."
  );
}

export default config;
