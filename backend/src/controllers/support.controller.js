const supportService = require('../services/support.service');
const { sendSuccess } = require('../utils/helpers');

class SupportController {
  async getTickets(req, res, next) {
    try {
      const { status, priority } = req.query;
      let customerId = '';
      if (req.user.role === 'CUSTOMER') {
        customerId = req.user.customerProfile?.id;
      }
      const tickets = await supportService.getTickets({ customerId, status, priority });
      return sendSuccess(res, tickets, 'Support tickets retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getTicketById(req, res, next) {
    try {
      const ticket = await supportService.getTicketById(req.params.id);
      return sendSuccess(res, ticket, 'Ticket details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createTicket(req, res, next) {
    try {
      const customerId = req.user.customerProfile?.id;
      if (!customerId) {
        return res.status(403).json({ success: false, message: 'Only customer accounts can raise service tickets.' });
      }
      const ticket = await supportService.createTicket(req.body, customerId, req.user?.id);
      return sendSuccess(res, ticket, 'Support ticket submitted.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTicket(req, res, next) {
    try {
      const updated = await supportService.updateTicket(req.params.id, req.body, req.user?.id);
      return sendSuccess(res, updated, 'Ticket updated.');
    } catch (error) {
      next(error);
    }
  }

  async getWarranties(req, res, next) {
    try {
      let customerId = '';
      if (req.user.role === 'CUSTOMER') {
        customerId = req.user.customerProfile?.id;
      }
      const warranties = await supportService.getWarranties(customerId);
      return sendSuccess(res, warranties, 'Warranty certificates retrieved.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupportController();
