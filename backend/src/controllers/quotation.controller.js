const quotationService = require('../services/quotation.service');
const pdfService = require('../services/pdf.service');
const { sendSuccess } = require('../utils/helpers');

class QuotationController {
  async getProjectQuotations(req, res, next) {
    try {
      const { projectId } = req.params;
      const quotations = await quotationService.getProjectQuotations(projectId);
      return sendSuccess(res, quotations, 'Quotations retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getQuotationById(req, res, next) {
    try {
      const quotation = await quotationService.getQuotationById(req.params.id);
      return sendSuccess(res, quotation, 'Quotation retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createQuotation(req, res, next) {
    try {
      const { projectId } = req.params;
      const quotation = await quotationService.createQuotation(projectId, req.body, req.user?.id);
      return sendSuccess(res, quotation, 'Quotation generated successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async reviseQuotation(req, res, next) {
    try {
      const { id } = req.params;
      const quotation = await quotationService.reviseQuotation(id, req.body, req.user?.id);
      return sendSuccess(res, quotation, 'Quotation revised and previous version frozen.', 201);
    } catch (error) {
      next(error);
    }
  }

  async submitDecision(req, res, next) {
    try {
      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'];
      const result = await quotationService.submitQuotationDecision(id, req.body, req.user, ipAddress);
      return sendSuccess(res, result, 'Quotation decision recorded.');
    } catch (error) {
      next(error);
    }
  }

  async downloadPDF(req, res, next) {
    try {
      const { id } = req.params;
      const quotation = await quotationService.getQuotationById(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotationNumber}.pdf"`);

      const doc = pdfService.generateQuotationPDF(quotation, res);
    } catch (error) {
      next(error);
    }
  }

  async sendEmail(req, res, next) {
    try {
      const { id } = req.params;
      const result = await quotationService.sendQuotationEmail(id);
      return sendSuccess(res, result, 'Quotation PDF dispatched via email.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuotationController();
