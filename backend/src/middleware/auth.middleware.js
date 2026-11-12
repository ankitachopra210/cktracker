const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const prisma = require('../config/db');
const { sendError } = require('../utils/helpers');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token required.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.id) {
      return sendError(res, 'Invalid token payload.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        customerProfile: true,
        employeeProfile: true,
      },
    });

    if (!user) {
      return sendError(res, 'User session no longer exists.', 401);
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, `Account is ${user.status.toLowerCase()}. Please contact administrator.`, 403);
    }

    // Attach verified user to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      customerProfile: user.customerProfile,
      employeeProfile: user.employeeProfile,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
