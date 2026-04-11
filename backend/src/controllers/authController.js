import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/env.js";
import emailService from "../services/emailService.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const buildAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id,
      role: user.role,
      email: user.email
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

const buildRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user._id,
      type: "refresh"
    },
    process.env.JWT_REFRESH_SECRET || "rf-7a2f4c8e1b9d3a5f6c2e8b4d1a7f3e9c5b8a2d7f4e1c6b9a3d5e8f2c7b4a",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

export const loginAdmin = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length > 128) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admin accounts can access this endpoint." });
    }

    const accessToken = buildAccessToken(user);
    const refreshToken = buildRefreshToken(user);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    user.addRefreshToken(refreshToken, refreshExpiresAt);
    await user.save();

    res.setHeader("Cache-Control", "no-store");

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const registerCitizen = async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const confirmPassword = String(req.body?.confirmPassword || "").trim();

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: "Name must be between 2 and 50 characters." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      return res.status(400).json({ 
        message: "Password must include uppercase, lowercase, numeric, and special characters." 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email address already registered." });
    }

    // Create new citizen user
    const newUser = new User({
      name,
      email,
      password,
      phone: phone || undefined,
      role: "citizen",
      isVerified: true
    });

    await newUser.save();

    const accessToken = buildAccessToken(newUser);
    const refreshToken = buildRefreshToken(newUser);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    newUser.addRefreshToken(refreshToken, refreshExpiresAt);
    await newUser.save();

    res.setHeader("Cache-Control", "no-store");

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      },
      message: "Account created successfully!"
    });
  } catch (error) {
    return next(error);
  }
};

export const loginCitizen = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email, role: "citizen" }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const accessToken = buildAccessToken(user);
    const refreshToken = buildRefreshToken(user);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    user.addRefreshToken(refreshToken, refreshExpiresAt);
    await user.save();

    res.setHeader("Cache-Control", "no-store");

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = String(req.body?.refreshToken || "").trim();

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "rf-7a2f4c8e1b9d3a5f6c2e8b4d1a7f3e9c5b8a2d7f4e1c6b9a3d5e8f2c7b4a"
      );
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token." });
    }

    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (!user.isRefreshTokenValid(refreshToken)) {
      return res.status(401).json({ message: "Refresh token not found or expired." });
    }

    const newAccessToken = buildAccessToken(user);

    res.setHeader("Cache-Control", "no-store");

    return res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = String(req.body?.refreshToken || "").trim();

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "rf-7a2f4c8e1b9d3a5f6c2e8b4d1a7f3e9c5b8a2d7f4e1c6b9a3d5e8f2c7b4a"
      );
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const user = await User.findById(decoded.sub);

    if (user) {
      user.removeRefreshToken(refreshToken);
      await user.save();
    }

    return res.json({ message: "Logout successful." });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    const otp = user.generatePasswordResetOTP();
    await user.save();

    await emailService.sendPasswordResetOTP({
      email: user.email,
      recipientName: user.name,
      otp
    });

    return res.json({ message: "OTP sent to your email. Valid for 15 minutes." });
  } catch (error) {
    return next(error);
  }
};

export const verifyPasswordResetOTP = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be 6 digits." });
    }

    const user = await User.findOne({ email }).select("+passwordResetOTP +passwordResetOTPExpiry");

    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    if (!user.verifyPasswordResetOTP(otp)) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    return res.json({ message: "OTP verified successfully." });
  } catch (error) {
    return next(error);
  }
};

export const resetPasswordWithOTP = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();
    const newPassword = String(req.body?.newPassword || "").trim();

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be 6 digits." });
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }

    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "Password must include uppercase, lowercase, numeric, and special characters." });
    }

    const user = await User.findOne({ email }).select("+password +passwordResetOTP +passwordResetOTPExpiry");

    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    if (!user.verifyPasswordResetOTP(otp)) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.password = newPassword;
    user.clearPasswordResetOTP();
    await user.save();

    return res.json({ message: "Password reset successfully. Please login with your new password." });
  } catch (error) {
    return next(error);
  }
};
