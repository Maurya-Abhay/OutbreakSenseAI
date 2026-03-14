import { Router } from "express";
import { getPreventionTips, subscribeToAlerts } from "../controllers/citizenController.js";

const router = Router();

router.get("/tips", getPreventionTips);
router.post("/subscriptions", subscribeToAlerts);

export default router;
