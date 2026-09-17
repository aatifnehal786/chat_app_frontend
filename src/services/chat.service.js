import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";

let socket = null;

export const initializeSocket = () => {
  if (socket?.connected) return socket;

  const user = useUserStore.getState().user;
  if (!user?._id) {
    console.log("No user for socket");
    return null;
  }

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  socket = io(BACKEND_URL, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id, "user:", user._id);
    // FIXED: Emit BOTH events - your server listens for "join"
    socket.emit("join", user._id);
    socket.emit("user_connected", user._id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) return initializeSocket();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};