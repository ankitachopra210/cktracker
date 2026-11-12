const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { verifyOwnership } = require('../middleware/ownership.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const {
  createCustomerSchema,
  updateCustomerSchema,
  logInteractionSchema,
} = require('../validators/crm.validator');

// All customer routes require authentication
router.use(authenticate);

// List customers (Admin & Manager)
router.get('/', authorize('ADMIN', 'MANAGER'), customerController.getCustomers);

// Create customer (Admin & Manager)
router.post('/', authorize('ADMIN', 'MANAGER'), validateBody(createCustomerSchema), customerController.createCustomer);

// Get specific customer profile (Admin, Manager, or Customer accessing own profile)
router.get('/:id', verifyOwnership('customer'), customerController.getCustomerById);

// Update customer profile
router.put('/:id', verifyOwnership('customer'), validateBody(updateCustomerSchema), customerController.updateCustomer);

// Log customer interaction (call, visit, follow-up)
router.post('/:id/interactions', authorize('ADMIN', 'MANAGER'), validateBody(logInteractionSchema), customerController.logInteraction);

module.exports = router;
