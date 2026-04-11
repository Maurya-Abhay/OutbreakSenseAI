import cors from "cors";
import express from "express";
import morgan from "morgan";
import config from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import citizenRoutes from "./routes/citizenRoutes.js";
import dangerZoneRoutes from "./routes/dangerZoneRoutes.js";
import authMiddleware from "./middleware/auth.js";
import {
  authRateLimit,
  globalRateLimit,
  helmetMiddleware,
  reportRateLimit,
  sanitizePayload
} from "./middleware/security.js";
import { csrfProtection, getCSRFToken } from "./middleware/csrf.js";
import { submitCitizenReport } from "./controllers/reportController.js";
import { getCurrentRisk } from "./controllers/riskController.js";
import { getDashboardSummary } from "./controllers/adminController.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandlers.js";

const app = express();
app.disable("x-powered-by");

if (config.trustProxy) {
  app.set("trust proxy", 1);
}

const corsOptions = {
  origin(origin, callback) {
    callback(null, config.isAllowedOrigin(origin));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(helmetMiddleware);

if (config.isProduction) {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      return res.redirect(301, `https://${req.header("host")}${req.url}`);
    }
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    next();
  });
}

app.use(express.json({ limit: config.bodyLimit }));
app.use(sanitizePayload);
app.use(globalRateLimit);

app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "outbreaksense-backend" });
});

// CSRF token endpoint (no auth required)
app.get("/api/csrf-token", getCSRFToken);

// Apply CSRF protection to all state-changing endpoints
app.use(csrfProtection);

// Compatibility aliases matching the hackathon API contract.
app.post("/api/report", reportRateLimit, submitCitizenReport);
app.get("/api/prediction", getCurrentRisk);
app.get("/api/dashboard/stats", authMiddleware, getDashboardSummary);

app.use("/api/auth", authRateLimit, authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/danger-zones", dangerZoneRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
