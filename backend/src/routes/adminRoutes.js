import { Router } from "express";
import {
  exportReportsCsv,
  exportReportsPdf,
  getAlerts,
  getDashboardSummary,
  listAlertSubscriptions,
  resolveAlert,
  getSystemStats,
  getAllUsers,
  getUserDetails,
  banUser,
  unbanUser,
  deleteUser,
  grantAdminAccess,
  revokeAdminAccess
} from "../controllers/adminController.js";
import { listReportsForAdmin, verifyReportStatus } from "../controllers/reportController.js";
import authMiddleware from "../middleware/auth.js";
import adminAuthMiddleware from "../middleware/adminAuth.js";
import { exportRateLimit } from "../middleware/security.js";

const router = Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Dashboard & Stats
router.get("/dashboard", getDashboardSummary);
router.get("/dashboard/stats", getDashboardSummary);
router.get("/system/stats", getSystemStats);

// Reports Management
router.get("/reports", listReportsForAdmin);
router.patch("/reports/:reportId/verify", verifyReportStatus);

// Alerts Management
router.get("/alerts", getAlerts);
router.patch("/alerts/:alertId/resolve", resolveAlert);

// Export (rate limited - resource intensive)
router.get("/export/csv", exportRateLimit, exportReportsCsv);
router.get("/export/pdf", exportRateLimit, exportReportsPdf);

// Subscriptions
router.get("/subscriptions", listAlertSubscriptions);

// User Management
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.post("/users/:userId/ban", banUser);
router.post("/users/:userId/unban", unbanUser);
router.post("/users/:userId/grant-admin", grantAdminAccess);
router.post("/users/:userId/revoke-admin", revokeAdminAccess);
router.delete("/users/:userId", deleteUser);

export default router;

