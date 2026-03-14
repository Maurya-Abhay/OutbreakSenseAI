import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/env.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const buildToken = (user) =>
  jwt.sign(
    {
      sub: user._id,
      role: user.role,
      email: user.email
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
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

    const token = buildToken(user);

    res.setHeader("Cache-Control", "no-store");

    return res.json({
      token,
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
