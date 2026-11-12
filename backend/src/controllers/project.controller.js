const projectService = require('../services/project.service');
const { sendSuccess, sendPaginated } = require('../utils/helpers');

class ProjectController {
  async getProjects(req, res, next) {
    try {
      const { status = '', managerId = '', customerId = '', search = '', page = 1, limit = 20 } = req.query;
      const result = await projectService.getProjects({
        status,
        managerId,
        customerId,
        search,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        user: req.user,
      });

      return sendPaginated(res, result.projects, result.total, result.page, result.limit, 'Projects retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req, res, next) {
    try {
      const project = await projectService.getProjectById(req.params.id, req.user);
      return sendSuccess(res, project, 'Project details retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createProject(req, res, next) {
    try {
      const project = await projectService.createProject(req.body, req.user?.id);
      return sendSuccess(res, project, 'Kitchen project created with 14-stage lifecycle.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const updated = await projectService.updateProject(req.params.id, req.body, req.user?.id);
      return sendSuccess(res, updated, 'Project updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateProjectStage(req, res, next) {
    try {
      const { id: projectId, stageId } = req.params;
      const updated = await projectService.updateProjectStage(projectId, stageId, req.body, req.user?.id);
      return sendSuccess(res, updated, 'Project stage updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async uploadStagePhoto(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please attach a photo or file.' });
      }

      const { id: projectId, stageId } = req.params;
      const category = req.body.category || 'PROGRESS_PHOTO';
      const attachment = await projectService.uploadStagePhoto(projectId, stageId, req.file, category, req.user?.id);

      return sendSuccess(res, attachment, 'Stage photograph uploaded successfully.', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
