import jwt from "jsonwebtoken";
import config from "../config/env.js";
import User from "../models/User.js";

const parseBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== "string") {
    return null;
  }

  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.split(" ")[1] || null;
};

export const resolveUserFromToken = async (token) => {
  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, config.jwtSecret);
  const user = await User.findById(decoded.sub).select("-password");
  return user || null;
};

export const resolveUserFromAuthorization = async (authorizationHeader) => {
  const token = parseBearerToken(authorizationHeader);
  return resolveUserFromToken(token);
};

const authMiddleware = async (req, res, next) => {
  try {
    const user = await resolveUserFromAuthorization(req.headers.authorization);

    if (!user) {
      return res.status(401).json({ message: "Authorization token missing." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access." });
  }
};

export default authMiddleware;
