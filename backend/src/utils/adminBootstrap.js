import User from "../models/User.js";
import config from "../config/env.js";

export const ensureDefaultAdmin = async () => {
  if (!config.seedDefaultAdmin) {
    return null;
  }

  const existingAdmin = await User.findOne({ email: config.defaultAdminEmail });

  if (existingAdmin) {
    return existingAdmin;
  }

  const admin = await User.create({
    name: "OutbreakSense Administrator",
    email: config.defaultAdminEmail,
    password: config.defaultAdminPassword,
    role: "admin"
  });

  console.log(`Seeded admin account created: ${admin.email}`);
  return admin;
};
