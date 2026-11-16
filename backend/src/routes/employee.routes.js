const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const {
  createEmployeeSchema,
  createTaskSchema,
  updateTaskStatusSchema,
} = require('../validators/enterprise.validator');

router.use(authenticate);

// Employees
router.get('/employees', authorize('ADMIN', 'MANAGER'), employeeController.getEmployees);
router.post('/employees', authorize('ADMIN'), validateBody(createEmployeeSchema), employeeController.createEmployee);

// Tasks
router.get('/tasks', authorize('ADMIN', 'MANAGER'), employeeController.getTasks);
router.post('/tasks', authorize('ADMIN', 'MANAGER'), validateBody(createTaskSchema), employeeController.createTask);
router.put('/tasks/:id/status', authorize('ADMIN', 'MANAGER'), validateBody(updateTaskStatusSchema), employeeController.updateTaskStatus);

module.exports = router;
