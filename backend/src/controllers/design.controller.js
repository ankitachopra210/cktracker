const designService = require('../services/design.service');
const { sendSuccess } = require('../utils/helpers');

class DesignController {
  async getProjectDesigns(req, res, next) {
    try {
      const { projectId } = req.params;
      const designs = await designService.getProjectDesigns(projectId);
      return sendSuccess(res, designs, 'Designs retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getDesignById(req, res, next) {
    try {
      const design = await designService.getDesignById(req.params.id);
      return sendSuccess(res, design, 'Design details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async uploadDesign(req, res, next) {
    try {
      const { projectId } = req.params;
      const design = await designService.uploadDesign(projectId, req.body, req.files || {}, req.user?.id);
      return sendSuccess(res, design, 'Design iteration uploaded successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async submitDecision(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const result = await designService.submitDesignDecision(id, req.body, req.user, ipAddress);
      return sendSuccess(res, result, 'Design decision submitted.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DesignController();
