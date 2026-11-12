const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const logger = require('../utils/logger');

let io = null;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Restrict to FRONTEND_URL in production
      methods: ['GET', 'POST'],
    },
  });

  // JWT auth middleware for WebSocket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Socket authentication error: Missing token'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Socket authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id} (User: ${socket.user?.fullName}, Role: ${socket.user?.role})`);

    // Auto-join personal room
    socket.join(`user:${socket.user.id}`);

    // Join role room
    socket.join(`role:${socket.user.role}`);

    // Join project room dynamically
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      logger.debug(`Socket ${socket.id} joined project room: ${projectId}`);
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
      logger.debug(`Socket ${socket.id} left project room: ${projectId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO real-time event system initialized.');
  return io;
};

const getIO = () => {
  if (!io) {
    logger.warn('Socket.IO not initialized yet when getIO() called.');
  }
  return io;
};

/**
 * Emit real-time notification to user, role, or project
 */
const emitRealTimeUpdate = ({ target, event, payload }) => {
  if (!io) return;
  // target can be 'user:xxx', 'role:ADMIN', 'project:yyy' or 'broadcast'
  if (target === 'broadcast') {
    io.emit(event, payload);
  } else {
    io.to(target).emit(event, payload);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitRealTimeUpdate,
};
