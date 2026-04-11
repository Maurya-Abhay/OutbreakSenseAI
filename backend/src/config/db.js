import mongoose from "mongoose";
import config from "./env.js";

const connectDatabase = async () => {
  try {
    const options = {
      maxPoolSize: config.isProduction ? 10 : 5,
      minPoolSize: config.isProduction ? 3 : 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 60000,
      retryWrites: true,
      retryReads: true
    };

    await mongoose.connect(config.mongoUri, options);
    console.log("MongoDB connected with pooling enabled");

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected, attempting reconnect...");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDatabase;
