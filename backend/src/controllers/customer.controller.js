const customerService = require('../services/customer.service');
const { sendSuccess, sendPaginated, sendError } = require('../utils/helpers');

class CustomerController {
  async getCustomers(req, res, next) {
    try {
      const { page = 1, limit = 10, search = '', propertyType = '', preferredStyle = '', sortBy = 'createdAt', order = 'desc' } = req.query;
      const result = await customerService.getCustomers({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        propertyType,
        preferredStyle,
        sortBy,
        order,
      });

      return sendPaginated(res, result.customers, result.total, result.page, result.limit, 'Customers retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      return sendSuccess(res, customer, 'Customer profile retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const customer = await customerService.createCustomer(req.body, req.user?.id);
      return sendSuccess(res, customer, 'Customer account created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const updated = await customerService.updateCustomer(req.params.id, req.body, req.user?.id);
      return sendSuccess(res, updated, 'Customer profile updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async logInteraction(req, res, next) {
    try {
      const interaction = await customerService.logInteraction(req.params.id, req.body, req.user?.id);
      return sendSuccess(res, interaction, 'Customer interaction logged.', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
