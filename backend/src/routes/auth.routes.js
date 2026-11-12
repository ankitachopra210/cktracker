const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const {
  loginSchema,
  registerCustomerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

// Public routes
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

// Authenticated user routes
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);

// Role-protected: Only Admin and Manager can register customers
router.post(
  '/register-customer',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  validateBody(registerCustomerSchema),
  authController.registerCustomer
);

module.exports = router;
