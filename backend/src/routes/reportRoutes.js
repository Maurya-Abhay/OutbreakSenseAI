import { Router } from "express";
import {
  getCitizenReportHistory,
  listReports,
  listReportsForAdmin,
  submitCitizenReport
} from "../controllers/reportController.js";
import authMiddleware from "../middleware/auth.js";
import { reportRateLimit } from "../middleware/security.js";

const router = Router();

router.post("/", reportRateLimit, submitCitizenReport);
router.get("/", listReports);
router.get("/history", getCitizenReportHistory);
router.get("/admin", authMiddleware, listReportsForAdmin);

export default router;
