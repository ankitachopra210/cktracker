const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { verifyOwnership } = require('../middleware/ownership.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const {
  createProjectSchema,
  updateProjectSchema,
  updateStageSchema,
} = require('../validators/project.validator');

// All project routes require authentication
router.use(authenticate);

// List projects (Admin: all, Manager: assigned/all, Customer: own)
router.get('/', projectController.getProjects);

// Create project (Admin & Manager)
router.post('/', authorize('ADMIN', 'MANAGER'), validateBody(createProjectSchema), projectController.createProject);

// Single project detail (Customers can only view their own project)
router.get('/:id', verifyOwnership('project'), projectController.getProjectById);

// Update project metadata
router.put('/:id', authorize('ADMIN', 'MANAGER'), validateBody(updateProjectSchema), projectController.updateProject);

// Update stage lifecycle status & delays
router.put('/:id/stages/:stageId', authorize('ADMIN', 'MANAGER'), validateBody(updateStageSchema), projectController.updateProjectStage);

// Upload progress photo or document for a stage
router.post(
  '/:id/stages/:stageId/photos',
  authorize('ADMIN', 'MANAGER'),
  upload.single('file'),
  projectController.uploadStagePhoto
);

module.exports = router;
