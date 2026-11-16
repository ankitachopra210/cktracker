const notificationService = require('../services/notification.service');
const { sendSuccess } = require('../utils/helpers');

class NotificationController {
  async getMyNotifications(req, res, next) {
    try {
      const list = await notificationService.getUserNotifications(req.user.id);
      return sendSuccess(res, list, 'Notifications fetched.');
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.params.id, req.user.id);
      return sendSuccess(res, null, 'Marked as read.');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      return sendSuccess(res, null, 'All notifications marked as read.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
