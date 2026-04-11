import { Router } from "express";
import {
  getCitizenReportHistory,
  listReports,
  listReportsForAdmin,
  submitCitizenReport,
  confirmReportAndCreateZone,
  rejectReport,
  listPendingReports
} from "../controllers/reportController.js";
import authMiddleware from "../middleware/auth.js";
import adminAuthMiddleware from "../middleware/adminAuth.js";
import { reportRateLimit } from "../middleware/security.js";

const router = Router();

// Public endpoints
router.post("/", reportRateLimit, submitCitizenReport);
router.get("/", listReports);
router.get("/history", getCitizenReportHistory);

// Admin endpoints
router.get("/admin", authMiddleware, listReportsForAdmin);
router.get("/admin/pending", authMiddleware, adminAuthMiddleware, listPendingReports);
router.post("/admin/:reportId/confirm", authMiddleware, adminAuthMiddleware, confirmReportAndCreateZone);
router.post("/admin/:reportId/reject", authMiddleware, adminAuthMiddleware, rejectReport);

export default router;
