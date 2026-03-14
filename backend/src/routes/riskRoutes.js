import { Router } from "express";
import {
  getCurrentRisk,
  getHeatmapRisk,
  getLocationHistory,
  getRiskTrends
} from "../controllers/riskController.js";

const router = Router();

router.get("/current", getCurrentRisk);
router.get("/heatmap", getHeatmapRisk);
router.get("/trends", getRiskTrends);
router.get("/history/:locationName", getLocationHistory);

export default router;
