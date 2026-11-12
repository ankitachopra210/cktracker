const logger = require('../utils/logger');
const { sendError } = require('../utils/helpers');

const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.url} - Error:`, err.stack || err.message);

  // Prisma Unique Constraint Violation (P2002)
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return sendError(res, `A record with this ${fields} already exists.`, 409);
  }

  // Prisma Foreign Key Constraint (P2003)
  if (err.code === 'P2003') {
    return sendError(res, 'Referenced record was not found or constraint failed.', 400);
  }

  // Prisma Record Not Found (P2025)
  if (err.code === 'P2025') {
    return sendError(res, 'The requested record was not found.', 404);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired. Please log in again.', 401);
  }

  // Multer File Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 'Uploaded file exceeds the maximum allowed size (15MB).', 400);
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected error occurred. Please contact system administrator.'
    : err.message || 'Internal server error';

  return sendError(res, message, statusCode, err.errors || null);
};

module.exports = errorHandler;
