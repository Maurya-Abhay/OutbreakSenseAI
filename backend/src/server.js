import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDatabase from "./config/db.js";
import config from "./config/env.js";
import { ensureDefaultAdmin } from "./utils/adminBootstrap.js";
import { resolveUserFromAuthorization, resolveUserFromToken } from "./middleware/auth.js";
import { verifyEmailConfiguration } from "./services/emailService.js";

const normalizeRoomKey = (locationName) =>
  String(locationName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

const startServer = async () => {
  await connectDatabase();
  await ensureDefaultAdmin();
  await verifyEmailConfiguration();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: config.socketCorsOrigins,
      methods: ["GET", "POST", "PATCH"],
      credentials: true
    },
    pingInterval: 25_000,
    pingTimeout: 20_000,
    maxHttpBufferSize: 1e6
  });

  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token;
      const authHeader = socket.handshake.headers?.authorization;
      const user = authToken
        ? await resolveUserFromToken(authToken)
        : await resolveUserFromAuthorization(authHeader);

      socket.data.user = user || null;
      return next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      socket.data.user = null;
      return next();
    }
  });

  io.on("connection", (socket) => {
    socket.join("public");

    if (socket.data.user?.role === "admin") {
      socket.join("admin");
    }

    socket.on("subscribe:location", (locationName) => {
      const roomKey = normalizeRoomKey(locationName);

      if (!roomKey) {
        return;
      }

      socket.join(`location:${roomKey}`);
    });

    socket.on("unsubscribe:location", (locationName) => {
      const roomKey = normalizeRoomKey(locationName);

      if (!roomKey) {
        return;
      }

      socket.leave(`location:${roomKey}`);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  app.set("io", io);

  const httpServer = server.listen(config.port, () => {
    console.log(`✅ OutbreakSense backend running on http://localhost:${config.port}`);
  });

  const gracefulShutdown = async (signal) => {
    console.log(`\n📊 Received ${signal}, starting graceful shutdown...`);
    
    httpServer.close(() => {
      console.log("✅ HTTP server closed");
    });

    io.close();
    console.log("✅ Socket.IO connections closed");

    try {
      await import("mongoose").then(m => m.default.disconnect());
      console.log("✅ MongoDB disconnected");
    } catch (error) {
      console.error("Error disconnecting MongoDB:", error.message);
    }

    console.log("✅ Graceful shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
