const prisma = require('../config/db');
const { sendError } = require('../utils/helpers');

/**
 * Validates that a Customer only accesses their own project, quotation, design, or ticket
 * @param {'project'|'quotation'|'design'|'customer'|'ticket'} resourceType
 * @param {string} paramKey Route param name (e.g., 'id', 'projectId')
 */
const verifyOwnership = (resourceType, paramKey = 'id') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return sendError(res, 'Unauthenticated.', 401);

      // Admins have global access
      if (user.role === 'ADMIN') return next();

      const resourceId = req.params[paramKey] || req.body[paramKey];
      if (!resourceId) {
        return sendError(res, `Missing resource identifier: ${paramKey}`, 400);
      }

      if (user.role === 'CUSTOMER') {
        const customerProfileId = user.customerProfile?.id;
        if (!customerProfileId) {
          return sendError(res, 'Customer profile not found for this account.', 403);
        }

        if (resourceType === 'customer') {
          if (resourceId !== customerProfileId && resourceId !== user.id) {
            return sendError(res, 'Access denied. You cannot view other customers\' profiles.', 403);
          }
        } else if (resourceType === 'project') {
          const project = await prisma.project.findUnique({
            where: { id: resourceId },
            select: { customerId: true },
          });
          if (!project || project.customerId !== customerProfileId) {
            return sendError(res, 'Access denied. You do not own this project.', 403);
          }
        } else if (resourceType === 'quotation') {
          const quotation = await prisma.quotation.findUnique({
            where: { id: resourceId },
            include: { project: { select: { customerId: true } } },
          });
          if (!quotation || quotation.project.customerId !== customerProfileId) {
            return sendError(res, 'Access denied. You do not have permission for this quotation.', 403);
          }
        } else if (resourceType === 'design') {
          const design = await prisma.design.findUnique({
            where: { id: resourceId },
            include: { project: { select: { customerId: true } } },
          });
          if (!design || design.project.customerId !== customerProfileId) {
            return sendError(res, 'Access denied. You do not have permission for this design.', 403);
          }
        } else if (resourceType === 'ticket') {
          const ticket = await prisma.supportTicket.findUnique({
            where: { id: resourceId },
            select: { customerId: true },
          });
          if (!ticket || ticket.customerId !== customerProfileId) {
            return sendError(res, 'Access denied. You do not own this support ticket.', 403);
          }
        }
      }

      // If Manager, ensure assignment if project/lead access
      if (user.role === 'MANAGER' && resourceType === 'project') {
        // Managers can view all or assigned projects based on company policy
        // If strictly assigned projects:
        const employeeId = user.employeeProfile?.id;
        if (req.query.strictlyAssigned === 'true' && employeeId) {
          const project = await prisma.project.findUnique({
            where: { id: resourceId },
            select: { assignedManagerId: true },
          });
          if (project && project.assignedManagerId !== employeeId) {
            return sendError(res, 'Access restricted to assigned project manager.', 403);
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  verifyOwnership,
};
