import crypto from "crypto";

// CSRF Token store (in production, use Redis)
const csrfTokens = new Map();

// Clean expired tokens every 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);

/**
 * Generate CSRF token for client
 * Token expires after 24 hours
 */
export const generateCSRFToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  csrfTokens.set(token, {
    sessionId,
    expiresAt,
    used: false
  });

  return token;
};

/**
 * CSRF middleware - Verify token on state-changing requests
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF check for GET/HEAD/OPTIONS (safe methods)
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for health endpoints
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  // Auth APIs are token-based/public flows and do not use cookie sessions.
  if (req.path.startsWith("/api/auth")) {
    return next();
  }

  // Citizen report endpoints - public APIs without sessions, don't need CSRF tokens
  // Mobile apps use this and don't have CSRF tokens
  if (req.path === "/api/report" || req.path.startsWith("/api/reports")) {
    return next();
  }

  // Skip CSRF check if CSRF_DISABLED is set (for testing)
  if (process.env.CSRF_DISABLED === "true") {
    return next();
  }

  const token = req.headers["x-csrf-token"] || req.body?._csrf;

  if (!token) {
    return res.status(403).json({
      message: "CSRF token missing. Include 'X-CSRF-Token' header."
    });
  }

  const tokenData = csrfTokens.get(token);

  if (!tokenData) {
    return res.status(403).json({
      message: "Invalid or expired CSRF token."
    });
  }

  // Check if token has expired
  if (Date.now() > tokenData.expiresAt) {
    csrfTokens.delete(token);
    return res.status(403).json({
      message: "CSRF token expired. Please refresh and try again."
    });
  }

  // Optional: One-time use tokens (more secure but impacts UX)
  // if (tokenData.used) {
  //   csrfTokens.delete(token);
  //   return res.status(403).json({
  //     message: "CSRF token already used. Please get a new token."
  //   });
  // }

  // Mark token as used
  // tokenData.used = true;

  next();
};

/**
 * Endpoint to issue CSRF token to clients
 */
export const getCSRFToken = (req, res) => {
  const sessionId = req.sessionID || req.ip || "anonymous";
  const token = generateCSRFToken(sessionId);

  res.json({
    csrfToken: token,
    expiresIn: 24 * 60 * 60 * 1000
  });
};
