const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const { recordPaymentSchema } = require('../validators/payment-inventory.validator');

router.use(authenticate);

// Financial summary
router.get('/summary', authorize('ADMIN'), paymentController.getPaymentSummary);

// Payments for a project
router.get('/project/:projectId', paymentController.getProjectPayments);

// Download receipt PDF
router.get('/:id/receipt-pdf', paymentController.downloadReceiptPDF);

// Record payment (Admin only)
router.post(
  '/',
  authorize('ADMIN'),
  validateBody(recordPaymentSchema),
  paymentController.recordPayment
);

module.exports = router;
