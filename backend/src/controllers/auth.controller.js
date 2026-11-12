const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/helpers');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const result = await authService.login(email, password, ipAddress);
      return sendSuccess(res, result, 'Logged in successfully.');
    } catch (error) {
      return sendError(res, error.message, 401);
    }
  }

  async registerCustomer(req, res, next) {
    try {
      const result = await authService.registerCustomer(req.body, req.user?.id);
      return sendSuccess(res, result, 'Customer registered successfully.', 201);
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      return sendSuccess(res, profile, 'Profile retrieved.');
    } catch (error) {
      return sendError(res, error.message, 404);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
      return sendSuccess(res, result, 'Password changed successfully.');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return sendSuccess(res, result, 'Password reset instruction processed.');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      return sendSuccess(res, result, 'Password reset successfully.');
    } catch (error) {
      return sendError(res, error.message, 400);
    }
  }
}

module.exports = new AuthController();
