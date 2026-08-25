import { Server } from "socket.io";
import logger from "./logger.js";

let io = null;

/**
 * Initialize Socket.io on the HTTP server.
 * Call this once from server.js after app.listen().
 */
export const initSocket = (httpServer) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
  ];

  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(",").forEach((url) => {
      const trimmed = url.trim();
      if (trimmed && !allowedOrigins.includes(trimmed)) {
        allowedOrigins.push(trimmed);
      }
    });
  }

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Client joins a room for a specific show to receive seat updates
    socket.on("join:show", (showId) => {
      socket.join(`show:${showId}`);
      logger.info(`Socket ${socket.id} joined show:${showId}`);
    });

    socket.on("leave:show", (showId) => {
      socket.leave(`show:${showId}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Emit a seat update to everyone watching a specific show.
 * Called from lock/unlock/booking controllers after state changes.
 *
 * @param {string} showId
 * @param {Array}  seats   - updated seat documents
 */
export const emitSeatUpdate = (showId, seats) => {
  if (!io) return;
  io.to(`show:${showId}`).emit("seats:updated", seats);
};

export const getIO = () => io;