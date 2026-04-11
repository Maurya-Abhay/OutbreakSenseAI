import { Router } from "express";
import {
  loginAdmin,
  registerCitizen,
  loginCitizen,
  refreshAccessToken,
  logout,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPasswordWithOTP
} from "../controllers/authController.js";

const router = Router();

router.post("/login", loginAdmin);
router.post("/citizen/register", registerCitizen);
router.post("/citizen/login", loginCitizen);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyPasswordResetOTP);
router.post("/reset-password", resetPasswordWithOTP);

export default router;
