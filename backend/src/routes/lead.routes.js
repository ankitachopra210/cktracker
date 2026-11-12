const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const {
  createLeadSchema,
  updateLeadStageSchema,
  convertLeadSchema,
} = require('../validators/crm.validator');

// All lead routes require authentication and are limited to Admin and Manager roles
router.use(authenticate, authorize('ADMIN', 'MANAGER'));

router.get('/', leadController.getLeads);
router.post('/', validateBody(createLeadSchema), leadController.createLead);
router.get('/:id', leadController.getLeadById);
router.put('/:id/stage', validateBody(updateLeadStageSchema), leadController.updateLeadStage);
router.post('/:id/convert', validateBody(convertLeadSchema), leadController.convertLeadToProject);

module.exports = router;
