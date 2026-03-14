import AlertSubscription from "../models/AlertSubscription.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeText = (value, maxLength = 120) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);

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
