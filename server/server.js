import { createServer } from "http";
import app from "./app.js";
import { initSocket } from "./utils/socket.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

// Create a raw HTTP server so Socket.io can attach to the same port
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});