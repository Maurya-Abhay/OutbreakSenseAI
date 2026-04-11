import { resolveUserFromAuthorization } from "./auth.js";

/**
 * Middleware to verify admin role
 * Must be used after authMiddleware to ensure req.user is set
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authorization required." });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
        code: "INSUFFICIENT_PRIVILEGE"
      });
    }

    return next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({ message: "Server error during authorization." });
  }
};

export default adminAuthMiddleware;
