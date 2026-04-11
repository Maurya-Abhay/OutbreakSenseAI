import { Router } from "express";
import {
  listDangerZones,
  getNearbyDangerZones,
  getSingleZone,
  createDangerZone,
  updateDangerZone,
  deleteDangerZone,
  resolveDangerZone
} from "../controllers/dangerZoneController.js";
import authMiddleware from "../middleware/auth.js";
import adminAuthMiddleware from "../middleware/adminAuth.js";

const router = Router();

// Public endpoints
router.get("/", listDangerZones);
router.get("/nearby", getNearbyDangerZones);
router.get("/:zoneId", getSingleZone);

// Admin endpoints
router.post("/", authMiddleware, adminAuthMiddleware, createDangerZone);
router.put("/:zoneId", authMiddleware, adminAuthMiddleware, updateDangerZone);
router.delete("/:zoneId", authMiddleware, adminAuthMiddleware, deleteDangerZone);
router.post("/:zoneId/resolve", authMiddleware, adminAuthMiddleware, resolveDangerZone);

export default router;
