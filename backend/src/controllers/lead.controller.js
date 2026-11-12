const leadService = require('../services/lead.service');
const { sendSuccess, sendError } = require('../utils/helpers');

class LeadController {
  async getLeads(req, res, next) {
    try {
      const { status = '', assignedManagerId = '', search = '' } = req.query;
      const leads = await leadService.getLeads({ status, assignedManagerId, search });
      return sendSuccess(res, leads, 'Leads fetched successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getLeadById(req, res, next) {
    try {
      const lead = await leadService.getLeadById(req.params.id);
      return sendSuccess(res, lead, 'Lead details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createLead(req, res, next) {
    try {
      const lead = await leadService.createLead(req.body, req.user?.id);
      return sendSuccess(res, lead, 'Lead inquiry created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateLeadStage(req, res, next) {
    try {
      const { status, notes } = req.body;
      const updated = await leadService.updateLeadStage(req.params.id, status, notes, req.user?.id);
      return sendSuccess(res, updated, 'Lead stage updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async convertLeadToProject(req, res, next) {
    try {
      const project = await leadService.convertLeadToProject(req.params.id, req.body, req.user?.id);
      return sendSuccess(res, project, 'Lead converted into active project with 14 lifecycle stages.', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LeadController();
