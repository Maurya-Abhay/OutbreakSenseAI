import AlertSubscription from "../models/AlertSubscription.js";
import { sendSubscriptionConfirmation } from "../services/emailService.js";
import User from "../models/User.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeText = (value, maxLength = 120) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);

const normalizeEmail = (value) => sanitizeText(value, 160).toLowerCase();

const isStrongPassword = (value) =>
  /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^a-zA-Z0-9]/.test(value);

export const subscribeToAlerts = async (req, res, next) => {
  try {
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    const locationName = sanitizeText(req.body?.locationName, 120);
    const preferredChannel = sanitizeText(req.body?.preferredChannel || "email", 16).toLowerCase();

    if (!email || !locationName) {
      return res.status(400).json({ message: "email and locationName are required." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email." });
    }

    if (!["email", "push"].includes(preferredChannel)) {
      return res.status(400).json({ message: "preferredChannel must be either email or push." });
    }

    const subscription = await AlertSubscription.findOneAndUpdate(
      { email, locationName },
      { preferredChannel },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Send confirmation email asynchronously
    if (preferredChannel === "email") {
      setImmediate(() => {
        const unsubscribeUrl = process.env.APP_URL
          ? `${process.env.APP_URL}/settings/alerts/unsubscribe?email=${encodeURIComponent(email)}&location=${encodeURIComponent(locationName)}`
          : "https://app.outbreaksense.ai/settings";

        sendSubscriptionConfirmation({
          email,
          recipientName: sanitizeText(req.body?.name, 120) || undefined,
          locationName,
          unsubscribeUrl
        }).catch(err => {
          console.error(`Failed to send subscription confirmation to ${email}:`, err.message);
        });
      });
    }

    return res.status(201).json({
      message: "Alert subscription saved.",
      subscription
    });
  } catch (error) {
    return next(error);
  }
};

export const getPreventionTips = (req, res) => {
  return res.json({
    tips: [
      "Remove stagnant water from containers around your house every week.",
      "Use mosquito repellents and wear long-sleeved clothing.",
      "Install window and door screens to reduce mosquito entry.",
      "Seek medical attention early for high fever, body pain, or rash symptoms.",
      "Coordinate with local health officers if multiple cases are reported nearby."
    ]
  });
};

export const updateCitizenProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const name = sanitizeText(req.body?.name, 60);
    const email = normalizeEmail(req.body?.email);
    const phone = sanitizeText(req.body?.phone || "", 24);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email." });
    }

    const duplicate = await User.findOne({ email, _id: { $ne: userId } }).select("_id");
    if (duplicate) {
      return res.status(409).json({ message: "Email is already in use by another account." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        phone: phone || undefined,
      },
      { new: true, runValidators: true }
    ).select("_id name email phone role createdAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      message: "Profile updated successfully",
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const resetCitizenPassword = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const currentPassword = String(req.body?.currentPassword || "").trim();
    const newPassword = String(req.body?.newPassword || "").trim();
    const confirmPassword = String(req.body?.confirmPassword || "").trim();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: "Password must include uppercase, lowercase, numeric, and special characters." });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isCurrentValid = await user.comparePassword(currentPassword);
    if (!isCurrentValid) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      message: "Password updated successfully",
      success: true,
    });
  } catch (error) {
    return next(error);
  }
};
