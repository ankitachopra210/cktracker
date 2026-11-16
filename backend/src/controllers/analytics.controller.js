const analyticsService = require('../services/analytics.service');
const { sendSuccess } = require('../utils/helpers');

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const data = await analyticsService.getExecutiveOverview();
      return sendSuccess(res, data, 'Executive overview metrics.');
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyRevenue(req, res, next) {
    try {
      const data = await analyticsService.getMonthlyRevenue();
      return sendSuccess(res, data, 'Monthly revenue statistics.');
    } catch (error) {
      next(error);
    }
  }

  async getStageDistribution(req, res, next) {
    try {
      const data = await analyticsService.getStageDistribution();
      return sendSuccess(res, data, 'Project stage distribution.');
    } catch (error) {
      next(error);
    }
  }

  async getConversionFunnel(req, res, next) {
    try {
      const data = await analyticsService.getConversionFunnel();
      return sendSuccess(res, data, 'Lead conversion funnel.');
    } catch (error) {
      next(error);
    }
  }

  async getBottlenecks(req, res, next) {
    try {
      const data = await analyticsService.getBottlenecksAndDelays();
      return sendSuccess(res, data, 'Project bottlenecks and delays.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
