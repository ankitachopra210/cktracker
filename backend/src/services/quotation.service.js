const prisma = require('../config/db');
const { generateCode, calculateQuotationTotals } = require('../utils/helpers');
const { emitRealTimeUpdate } = require('../sockets');
const pdfService = require('./pdf.service');
const { sendEmail } = require('../config/mailer');

class QuotationService {
  async getProjectQuotations(projectId) {
    const quotations = await prisma.quotation.findMany({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
      include: {
        items: true,
        approvals: {
          orderBy: { decidedAt: 'desc' },
        },
      },
    });

    return quotations;
  }

  async getQuotationById(quotationId) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        project: {
          include: {
            customer: { include: { user: true } },
            assignedManager: { include: { user: true } },
          },
        },
        items: true,
        approvals: {
          orderBy: { decidedAt: 'desc' },
        },
      },
    });

    if (!quotation) throw new Error('Quotation not found.');
    return quotation;
  }

  /**
   * Create a new Quotation with calculated line items, taxes, and totals
   */
  async createQuotation(projectId, data, actorId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { customer: { include: { user: true } } },
    });
    if (!project) throw new Error('Project not found.');

    const highest = await prisma.quotation.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const versionNumber = (highest?.versionNumber || 0) + 1;
    const quotationNumber = `${project.projectCode}-QT-V${versionNumber}`;

    // Monetary Calculation Engine
    const totals = calculateQuotationTotals(
      data.items,
      data.discountPercentage || 0,
      data.gstPercentage || 18,
      data.installationCharges || 0,
      data.transportCharges || 0,
      data.additionalCharges || 0
    );

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (data.expiryDays || 30));

    const quotation = await prisma.$transaction(async (tx) => {
      const created = await tx.quotation.create({
        data: {
          quotationNumber,
          projectId,
          versionNumber,
          quotationDate: new Date(),
          expiryDate,
          status: 'SENT',
          subtotal: totals.subtotal,
          discountPercentage: data.discountPercentage || 0,
          discountAmount: totals.discountAmount,
          gstPercentage: data.gstPercentage || 18,
          gstAmount: totals.gstAmount,
          installationCharges: data.installationCharges || 0,
          transportCharges: data.transportCharges || 0,
          additionalCharges: data.additionalCharges || 0,
          grandTotal: totals.grandTotal,
          termsAndConditions: data.termsAndConditions || null,
        },
      });

      // Save itemized records
      for (const item of totals.processedItems) {
        await tx.quotationItem.create({
          data: {
            quotationId: created.id,
            category: item.category,
            description: item.description,
            dimensions: item.dimensions || null,
            materialFinish: item.materialFinish || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            totalPrice: item.totalPrice,
          },
        });
      }

      // If Stage 5 (Quotation Prep) is IN_PROGRESS, mark it COMPLETED and activate Stage 6
      const stage5 = await tx.projectStage.findFirst({
        where: { projectId, stageNumber: 5 },
      });
      if (stage5 && stage5.status !== 'COMPLETED') {
        await tx.projectStage.update({
          where: { id: stage5.id },
          data: { status: 'COMPLETED', completionDate: new Date() },
        });

        await tx.projectStage.updateMany({
          where: { projectId, stageNumber: 6 },
          data: { status: 'IN_PROGRESS', startDate: new Date() },
        });

        await tx.project.update({
          where: { id: projectId },
          data: { currentStageNumber: 6 },
        });
      }

      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'QUOTATION_CREATED',
            entityType: 'QUOTATION',
            entityId: created.id,
            details: `Created quotation ${created.quotationNumber} of value ₹${created.grandTotal}`,
          },
        });
      }

      return created;
    });

    emitRealTimeUpdate({
      target: `project:${projectId}`,
      event: 'quotation:created',
      payload: { projectId, quotation },
    });

    return this.getQuotationById(quotation.id);
  }

  /**
   * Revision Engine: Freezes old quotation, preserves audit history, bumps version
   */
  async reviseQuotation(quotationId, data, actorId) {
    const oldQuotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true, project: true },
    });
    if (!oldQuotation) throw new Error('Original quotation not found.');

    const newVersionNumber = oldQuotation.versionNumber + 1;
    const newQuotationNumber = `${oldQuotation.project.projectCode}-QT-V${newVersionNumber}`;

    const totals = calculateQuotationTotals(
      data.items || oldQuotation.items,
      data.discountPercentage !== undefined ? data.discountPercentage : oldQuotation.discountPercentage,
      data.gstPercentage !== undefined ? data.gstPercentage : oldQuotation.gstPercentage,
      data.installationCharges !== undefined ? data.installationCharges : oldQuotation.installationCharges,
      data.transportCharges !== undefined ? data.transportCharges : oldQuotation.transportCharges,
      data.additionalCharges !== undefined ? data.additionalCharges : oldQuotation.additionalCharges
    );

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (data.expiryDays || 30));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Freeze previous version
      await tx.quotation.update({
        where: { id: quotationId },
        data: {
          isFrozen: true,
          status: 'REVISED',
        },
      });

      // 2. Create new revision
      const newQuotation = await tx.quotation.create({
        data: {
          quotationNumber: newQuotationNumber,
          projectId: oldQuotation.projectId,
          versionNumber: newVersionNumber,
          quotationDate: new Date(),
          expiryDate,
          status: 'SENT',
          subtotal: totals.subtotal,
          discountPercentage: data.discountPercentage || 0,
          discountAmount: totals.discountAmount,
          gstPercentage: data.gstPercentage || 18,
          gstAmount: totals.gstAmount,
          installationCharges: data.installationCharges || 0,
          transportCharges: data.transportCharges || 0,
          additionalCharges: data.additionalCharges || 0,
          grandTotal: totals.grandTotal,
          termsAndConditions: data.termsAndConditions || oldQuotation.termsAndConditions,
        },
      });

      // 3. Save revised line items
      for (const item of totals.processedItems) {
        await tx.quotationItem.create({
          data: {
            quotationId: newQuotation.id,
            category: item.category,
            description: item.description,
            dimensions: item.dimensions || null,
            materialFinish: item.materialFinish || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            totalPrice: item.totalPrice,
          },
        });
      }

      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'QUOTATION_REVISED',
            entityType: 'QUOTATION',
            entityId: newQuotation.id,
            details: `Revised quotation from V${oldQuotation.versionNumber} to V${newVersionNumber} (${newQuotationNumber})`,
          },
        });
      }

      return newQuotation;
    });

    emitRealTimeUpdate({
      target: `project:${oldQuotation.projectId}`,
      event: 'quotation:revised',
      payload: { projectId: oldQuotation.projectId, quotation: result },
    });

    return this.getQuotationById(result.id);
  }

  /**
   * Customer digital approval or rejection of quotation proposal
   */
  async submitQuotationDecision(quotationId, decisionData, customerUser, ipAddress = null) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        project: {
          include: {
            customer: { include: { user: true } },
            assignedManager: { include: { user: true } },
          },
        },
      },
    });

    if (!quotation) throw new Error('Quotation not found.');
    if (quotation.isFrozen) {
      throw new Error('This quotation revision has already been finalized or superseded.');
    }

    const decision = decisionData.decision; // 'APPROVED' or 'REJECTED'

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record decision audit
      const approval = await tx.quotationApproval.create({
        data: {
          quotationId,
          decision,
          customerComments: decisionData.customerComments || null,
          ipAddress,
        },
      });

      // 2. Update quotation status
      const updatedQuotation = await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: decision,
          isFrozen: true, // Freeze once approved
        },
      });

      // 3. If APPROVED: update Project contract amount & advance Stage 6 -> Stage 7
      if (decision === 'APPROVED') {
        await tx.project.update({
          where: { id: quotation.projectId },
          data: {
            contractAmount: quotation.grandTotal,
            budget: quotation.grandTotal,
          },
        });

        const stage6 = await tx.projectStage.findFirst({
          where: { projectId: quotation.projectId, stageNumber: 6 },
        });
        if (stage6) {
          await tx.projectStage.update({
            where: { id: stage6.id },
            data: { status: 'COMPLETED', completionDate: new Date() },
          });
        }

        const stage7 = await tx.projectStage.findFirst({
          where: { projectId: quotation.projectId, stageNumber: 7 },
        });
        if (stage7) {
          await tx.projectStage.update({
            where: { id: stage7.id },
            data: { status: 'IN_PROGRESS', startDate: new Date() },
          });
        }

        await tx.project.update({
          where: { id: quotation.projectId },
          data: { currentStageNumber: 7 },
        });
      }

      // 4. Audit Log
      await tx.activityLog.create({
        data: {
          actorId: customerUser.id,
          action: decision === 'APPROVED' ? 'QUOTATION_APPROVED' : 'QUOTATION_REJECTED',
          entityType: 'QUOTATION',
          entityId: quotation.id,
          details: `Customer ${customerUser.fullName} marked Quotation ${quotation.quotationNumber} as ${decision}`,
          ipAddress,
        },
      });

      return { updatedQuotation, approval };
    });

    emitRealTimeUpdate({
      target: `project:${quotation.projectId}`,
      event: 'quotation:decision',
      payload: { quotationId, decision, comments: decisionData.customerComments },
    });

    return result;
  }

  /**
   * Send official PDF quotation by email to customer
   */
  async sendQuotationEmail(quotationId) {
    const quotation = await this.getQuotationById(quotationId);
    const customerEmail = quotation.project?.customer?.user?.email;

    if (!customerEmail) {
      throw new Error('Customer does not have an active email address registered.');
    }

    // Build PDF buffer via memory chunks
    const doc = pdfService.generateQuotationPDF(quotation);
    const chunks = [];
    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        try {
          await sendEmail({
            to: customerEmail,
            subject: `Official Modular Kitchen Quotation: ${quotation.quotationNumber}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
                <h2>Modular Kitchen Quotation Proposal</h2>
                <p>Dear ${quotation.project?.customer?.user?.fullName},</p>
                <p>Please find attached the official modular kitchen quotation <strong>#${quotation.quotationNumber}</strong> for <strong>${quotation.project?.title}</strong>.</p>
                <div style="background: #f8fafc; border-left: 4px solid #c59b27; padding: 12px; margin: 15px 0;">
                  <p><strong>Total Value:</strong> ₹${Number(quotation.grandTotal).toLocaleString('en-IN')} (Inclusive of 18% GST & Installation)</p>
                  <p><strong>Valid Until:</strong> ${new Date(quotation.expiryDate).toLocaleDateString()}</p>
                </div>
                <p>You can review and digitally approve this proposal directly through your CKTracker client portal or reply to this email.</p>
              </div>
            `,
            attachments: [
              {
                filename: `${quotation.quotationNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
            ],
          });
          resolve({ success: true, message: `Quotation sent to ${customerEmail}` });
        } catch (err) {
          reject(err);
        }
      });
      doc.on('error', reject);
    });
  }
}

module.exports = new QuotationService();
