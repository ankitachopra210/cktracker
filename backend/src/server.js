const http = require('http');
const app = require('./app');
const { PORT } = require('./config/env');
const { initializeSocket } = require('./sockets');
const logger = require('./utils/logger');
const prisma = require('./config/db');

const server = http.createServer(app);

// Initialize WebSockets
initializeSocket(server);

// Start server
server.listen(PORT, () => {
  logger.info(`========================================================`);
  logger.info(`🚀 CKTracker Backend running on http://localhost:${PORT}`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📡 Socket.IO server mounted and listening`);
  logger.info(`========================================================`);
});

// Graceful shutdown handling
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP and WebSocket server closed.');
    if (prisma) {
      await prisma.$disconnect();
      logger.info('Prisma database client disconnected.');
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
