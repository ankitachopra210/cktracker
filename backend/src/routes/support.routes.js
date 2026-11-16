const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const {
  createSupportTicketSchema,
  updateTicketSchema,
} = require('../validators/enterprise.validator');

router.use(authenticate);

// Tickets
router.get('/tickets', supportController.getTickets);
router.get('/tickets/:id', supportController.getTicketById);
router.post('/tickets', authorize('CUSTOMER'), validateBody(createSupportTicketSchema), supportController.createTicket);
router.put('/tickets/:id', authorize('ADMIN', 'MANAGER'), validateBody(updateTicketSchema), supportController.updateTicket);

// Warranties
router.get('/warranties', supportController.getWarranties);

module.exports = router;
