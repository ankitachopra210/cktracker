const { sendError } = require('../utils/helpers');

/**
 * Role-Based Access Control middleware
 * @param  {...string} allowedRoles ('ADMIN', 'MANAGER', 'CUSTOMER')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Your role (${req.user.role}) does not have permission for this resource.`,
        403
      );
    }

    next();
  };
};

module.exports = authorize;
