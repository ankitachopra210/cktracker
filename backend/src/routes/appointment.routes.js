const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const { createAppointmentSchema } = require('../validators/crm.validator');

router.use(authenticate);

router.get('/', appointmentController.getAppointments);
router.post('/', authorize('ADMIN', 'MANAGER'), validateBody(createAppointmentSchema), appointmentController.createAppointment);
router.put('/:id/status', authorize('ADMIN', 'MANAGER'), appointmentController.updateAppointmentStatus);

module.exports = router;
