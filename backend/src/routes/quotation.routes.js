const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { verifyOwnership } = require('../middleware/ownership.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const { createQuotationSchema, quotationDecisionSchema } = require('../validators/quotation.validator');

router.use(authenticate);

// Get quotations for a project
router.get('/project/:projectId', quotationController.getProjectQuotations);

// Get specific quotation details
router.get('/:id', quotationController.getQuotationById);

// Download quotation PDF
router.get('/:id/pdf', quotationController.downloadPDF);

// Create quotation (Admin & Manager)
router.post(
  '/project/:projectId',
  authorize('ADMIN', 'MANAGER'),
  validateBody(createQuotationSchema),
  quotationController.createQuotation
);

// Revise quotation (Admin & Manager)
router.post(
  '/:id/revise',
  authorize('ADMIN', 'MANAGER'),
  validateBody(createQuotationSchema),
  quotationController.reviseQuotation
);

// Customer approval or rejection
router.post(
  '/:id/decision',
  verifyOwnership('quotation'),
  validateBody(quotationDecisionSchema),
  quotationController.submitDecision
);

// Send quotation via email with PDF attachment (Admin & Manager)
router.post(
  '/:id/send-email',
  authorize('ADMIN', 'MANAGER'),
  quotationController.sendEmail
);

module.exports = router;
