import { io } from "socket.io-client";

let socket = null;
let currentRoom = null; // Memory mein current location save rakhenge

const normalizeLocationRoom = (locationName) => String(locationName || "").trim().toLowerCase();
const normalizeSocketBaseUrl = (value) => String(value || "").replace(/\/+$/, "").replace(/\/api$/, "").trim();

export const connectSocket = ({ baseUrl, onAlert, onReport, onConnectError }) => {
  const targetBaseUrl = normalizeSocketBaseUrl(baseUrl);

  if (!targetBaseUrl) {
    return null;
  }

  // 1. Agar socket already connected hai, toh naye listeners attach karke return karo
  if (socket?.connected) {
    setupListeners(onAlert, onReport);
    return socket;
  }

  // 2. Clean start for new connection
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(targetBaseUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    timeout: 10000,
    forceNew: true,
    autoConnect: true
  });

  // --- Connection Lifecycle ---
  socket.on("connect", () => {
    console.log("📡 Socket Connected:", socket.id);
    
    // 🔥 Sabse Imp Fix: Reconnect hone par purane room ko wapas join karo
    if (currentRoom) {
      console.log(`🔄 Re-joining room: ${currentRoom}`);
      socket.emit("subscribe:location", currentRoom);
    }
  });

  socket.on("connect_error", (err) => {
    if (onConnectError) onConnectError(err);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket Disconnected:", reason);
  });

  setupListeners(onAlert, onReport);

  return socket;
};

// Helper function taaki listeners duplicate na ho
const setupListeners = (onAlert, onReport) => {
  if (!socket) return;

  socket.off("alert:new"); // Purane listeners hatao
  socket.off("report:new");

  socket.on("alert:new", (payload) => {
    if (typeof onAlert === "function") onAlert(payload);
  });

  socket.on("report:new", (payload) => {
    if (typeof onReport === "function") onReport(payload);
  });
};

export const subscribeLocationRoom = (locationName) => {
  const normalized = normalizeLocationRoom(locationName);
  if (!normalized) return;

  currentRoom = normalized; // Track room for auto-recovery

  if (socket?.connected) {
    console.log(`📍 Subscribing to: ${normalized}`);
    socket.emit("subscribe:location", normalized);
  }
};

export const unsubscribeLocationRoom = (locationName) => {
  const normalized = normalizeLocationRoom(locationName);
  if (!normalized) return;

  if (currentRoom === normalized) currentRoom = null;

  if (socket?.connected) {
    socket.emit("unsubscribe:location", normalized);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentRoom = null;
    console.log("🛑 Socket fully destroyed.");
  }
};