import { Router } from "express";
import {
	getPreventionTips,
	resetCitizenPassword,
	subscribeToAlerts,
	updateCitizenProfile,
} from "../controllers/citizenController.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.get("/tips", getPreventionTips);
router.post("/subscriptions", subscribeToAlerts);
router.put("/profile", authMiddleware, updateCitizenProfile);
router.post("/password-reset", authMiddleware, resetCitizenPassword);

export default router;
