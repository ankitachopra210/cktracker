const express = require('express');
const router = express.Router();
const designController = require('../controllers/design.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { verifyOwnership } = require('../middleware/ownership.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { createDesignSchema, designApprovalSchema } = require('../validators/design.validator');

router.use(authenticate);

// Get designs for a project
router.get('/project/:projectId', designController.getProjectDesigns);

// Get specific design
router.get('/:id', designController.getDesignById);

// Upload design (Admin & Manager) with optional file fields
router.post(
  '/project/:projectId',
  authorize('ADMIN', 'MANAGER'),
  upload.fields([
    { name: 'layout2D', maxCount: 1 },
    { name: 'render3D', maxCount: 1 },
    { name: 'cadFile', maxCount: 1 },
  ]),
  validateBody(createDesignSchema),
  designController.uploadDesign
);

// Customer submits decision (Approve or Request Changes)
router.post(
  '/:id/decision',
  verifyOwnership('design'),
  validateBody(designApprovalSchema),
  designController.submitDecision
);

module.exports = router;
