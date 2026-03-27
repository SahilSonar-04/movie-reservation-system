import { Server } from "socket.io";
import logger from "./logger.js";

let io = null;

/**
 * Initialize Socket.io on the HTTP server.
 * Call this once from server.js after app.listen().
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
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