const prisma = require('../config/db');
const PDFDocument = require('pdfkit');
const { generateCode } = require('../utils/helpers');
const { emitRealTimeUpdate } = require('../sockets');
const { sendEmail } = require('../config/mailer');

class PaymentService {
  async getProjectPayments(projectId) {
    const payments = await prisma.payment.findMany({
      where: { projectId },
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: true,
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { budget: true, contractAmount: true, projectCode: true, title: true },
    });

    const totalReceived = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const contractValue = Number(project?.contractAmount || project?.budget || 0);
    const remainingBalance = Math.max(0, contractValue - totalReceived);

    return {
      payments,
      summary: {
        contractValue,
        totalReceived,
        remainingBalance,
        percentPaid: contractValue > 0 ? Math.round((totalReceived / contractValue) * 100) : 0,
      },
    };
  }

  async getPaymentById(paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        project: {
          include: {
            customer: { include: { user: true } },
          },
        },
        invoice: true,
      },
    });

    if (!payment) throw new Error('Payment transaction not found.');
    return payment;
  }

  /**
   * Record a verified payment transaction with atomic invoice settlement & receipt generation
   */
  async recordPayment(data, actorId) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: { customer: { include: { user: true } } },
    });
    if (!project) throw new Error('Project not found.');

    const count = await prisma.payment.count();
    const receiptNumber = generateCode('RCPT', count + 1);

    const paymentAmount = parseFloat(data.amount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          projectId: data.projectId,
          invoiceId: data.invoiceId || null,
          amount: paymentAmount,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
          paymentStatus: 'COMPLETED',
          transactionReference: data.transactionReference,
          milestoneTitle: data.milestoneTitle || 'Milestone Advance Token',
          notes: data.notes || null,
          recordedByUserId: actorId || 'system',
        },
      });

      // 2. If tied to an invoice, update paidAmount & balanceDue
      if (data.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId } });
        if (invoice) {
          const newPaid = Number(invoice.paidAmount) + paymentAmount;
          const newBalance = Math.max(0, Number(invoice.totalAmount) - newPaid);
          const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

          await tx.invoice.update({
            where: { id: data.invoiceId },
            data: {
              paidAmount: newPaid,
              balanceDue: newBalance,
              status: newStatus,
            },
          });
        }
      }

      // 3. Activity Log
      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'PAYMENT_RECORDED',
            entityType: 'PAYMENT',
            entityId: payment.id,
            details: `Recorded payment of ₹${paymentAmount} (Ref: ${payment.transactionReference}) for project ${project.projectCode}`,
          },
        });
      }

      return payment;
    });

    // Real-time broadcast
    emitRealTimeUpdate({
      target: `project:${data.projectId}`,
      event: 'payment:recorded',
      payload: { projectId: data.projectId, payment: result },
    });

    // Notify Customer via Email
    if (project.customer?.user?.email) {
      await sendEmail({
        to: project.customer.user.email,
        subject: `Payment Receipt Confirmed: ${result.receiptNumber} (₹${paymentAmount})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2>Payment Receipt Confirmation</h2>
            <p>Dear ${project.customer.user.fullName},</p>
            <p>We have successfully received and verified your modular kitchen payment:</p>
            <div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 12px; margin: 15px 0;">
              <p><strong>Receipt Number:</strong> ${result.receiptNumber}</p>
              <p><strong>Amount Paid:</strong> ₹${paymentAmount.toLocaleString('en-IN')}</p>
              <p><strong>Payment Mode:</strong> ${result.paymentMethod}</p>
              <p><strong>Transaction Ref:</strong> ${result.transactionReference}</p>
              <p><strong>Milestone:</strong> ${result.milestoneTitle}</p>
            </div>
            <p>Thank you for your business. You can view your balance breakdown and download official receipts anytime from your CKTracker portal.</p>
          </div>
        `,
      });
    }

    return result;
  }

  /**
   * Aggregate executive financial metrics
   */
  async getPaymentSummary() {
    const [allProjects, allPayments, allInvoices] = await Promise.all([
      prisma.project.findMany({ select: { contractAmount: true, budget: true } }),
      prisma.payment.findMany({ select: { amount: true, paymentStatus: true } }),
      prisma.invoice.findMany({ select: { balanceDue: true, status: true, dueDate: true } }),
    ]);

    const totalPipelineValue = allProjects.reduce(
      (acc, p) => acc + Number(p.contractAmount || p.budget || 0),
      0
    );

    const totalReceived = allPayments.reduce(
      (acc, p) => (p.paymentStatus === 'COMPLETED' ? acc + Number(p.amount) : acc),
      0
    );

    const totalOutstanding = Math.max(0, totalPipelineValue - totalReceived);

    const overdueCount = allInvoices.filter(
      (inv) => inv.status !== 'PAID' && new Date(inv.dueDate) < new Date()
    ).length;

    return {
      totalPipelineValue,
      totalReceived,
      totalOutstanding,
      overdueCount,
    };
  }

  /**
   * Stream a PDF receipt for a recorded payment transaction
   */
  async generateReceiptPDF(paymentId, writeStream) {
    const payment = await this.getPaymentById(paymentId);

    const doc = new PDFDocument({ margin: 40, size: 'A5' });
    doc.pipe(writeStream);

    const primaryColor = '#0f172a';
    const goldColor = '#c59b27';
    const bgLight = '#f8fafc';

    // Header
    doc
      .rect(40, 30, 340, 50)
      .fill(primaryColor);

    doc
      .fillColor('#ffffff')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('CKTracker Modular Kitchens', 50, 42);

    doc
      .fontSize(8)
      .fillColor(goldColor)
      .text('OFFICIAL PAYMENT RECEIPT', 50, 62);

    const y = 95;
    doc
      .rect(40, y, 340, 160)
      .fillAndStroke(bgLight, '#e2e8f0');

    doc
      .fillColor(primaryColor)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('TRANSACTION RECEIPT', 50, y + 10);

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#334155')
      .text(`Receipt #: ${payment.receiptNumber}`, 50, y + 26)
      .text(`Date: ${new Date(payment.paymentDate).toLocaleString()}`, 50, y + 39)
      .text(`Client: ${payment.project?.customer?.user?.fullName}`, 50, y + 52)
      .text(`Project: ${payment.project?.projectCode} - ${payment.project?.title}`, 50, y + 65)
      .text(`Milestone: ${payment.milestoneTitle || 'Advance'}`, 50, y + 78)
      .text(`Payment Mode: ${payment.paymentMethod}`, 50, y + 91)
      .text(`Reference / UTR: ${payment.transactionReference}`, 50, y + 104);

    doc
      .rect(50, y + 120, 320, 26)
      .fill(primaryColor);

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('AMOUNT RECEIVED:', 60, y + 128)
      .text(`INR ₹${Number(payment.amount).toLocaleString('en-IN')}`, 200, y + 128, { align: 'right', width: 160 });

    doc
      .fillColor('#94a3b8')
      .fontSize(7)
      .font('Helvetica')
      .text('This is a verified computerized payment confirmation generated by CKTracker.', 40, 270, { align: 'center', width: 340 });

    doc.end();
    return doc;
  }
}

module.exports = new PaymentService();
