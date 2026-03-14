import { Router } from "express";
import {
  exportReportsCsv,
  exportReportsPdf,
  getAlerts,
  getDashboardSummary,
  listAlertSubscriptions,
  resolveAlert
} from "../controllers/adminController.js";
import { listReportsForAdmin, verifyReportStatus } from "../controllers/reportController.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/dashboard", getDashboardSummary);
router.get("/dashboard/stats", getDashboardSummary);
router.get("/reports", listReportsForAdmin);
router.patch("/reports/:reportId/verify", verifyReportStatus);
router.get("/alerts", getAlerts);
router.patch("/alerts/:alertId/resolve", resolveAlert);
router.get("/export/csv", exportReportsCsv);
router.get("/export/pdf", exportReportsPdf);
router.get("/subscriptions", listAlertSubscriptions);

export default router;
