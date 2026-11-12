const paymentService = require('../services/payment.service');
const { sendSuccess } = require('../utils/helpers');

class PaymentController {
  async getProjectPayments(req, res, next) {
    try {
      const { projectId } = req.params;
      const data = await paymentService.getProjectPayments(projectId);
      return sendSuccess(res, data, 'Project payments retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async getPaymentSummary(req, res, next) {
    try {
      const summary = await paymentService.getPaymentSummary();
      return sendSuccess(res, summary, 'Financial payment summary.');
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(req, res, next) {
    try {
      const payment = await paymentService.recordPayment(req.body, req.user?.id);
      return sendSuccess(res, payment, 'Payment verified and recorded successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async downloadReceiptPDF(req, res, next) {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${payment.receiptNumber}.pdf"`);

      await paymentService.generateReceiptPDF(id, res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
