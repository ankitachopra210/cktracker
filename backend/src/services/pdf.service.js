const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class PDFService {
  /**
   * Generate an enterprise quotation PDF document using PDFKit
   * @param {Object} quotation - Quotation entity with items, project, and customer details
   * @returns {PDFDocument} - PDF stream
   */
  generateQuotationPDF(quotation, writeStream = null) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    if (writeStream) {
      doc.pipe(writeStream);
    }

    // Palette
    const primaryColor = '#0f172a'; // Deep Navy
    const goldColor = '#c59b27'; // Muted Gold
    const slateDark = '#334155';
    const slateLight = '#64748b';
    const bgLight = '#f8fafc';

    // 1. Header Banner
    doc
      .rect(40, 40, 515, 60)
      .fill(primaryColor);

    doc
      .fillColor('#ffffff')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('CKTracker Modular Kitchens', 55, 52);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(goldColor)
      .text('PREMIUM MODULAR KITCHEN SYSTEMS & BESPOKE CABINETRY', 55, 76);

    doc
      .fillColor('#ffffff')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('PROPOSAL & QUOTATION', 400, 62, { align: 'right', width: 140 });

    doc.moveDown(2);

    // 2. Metadata Grid (Quotation & Client Details)
    const yStart = 115;
    doc
      .rect(40, yStart, 250, 95)
      .fillAndStroke(bgLight, '#e2e8f0');

    doc
      .rect(305, yStart, 250, 95)
      .fillAndStroke(bgLight, '#e2e8f0');

    // Left Box: Client Info
    doc
      .fillColor(primaryColor)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('CUSTOMER DETAILS:', 50, yStart + 8);

    doc
      .fillColor(slateDark)
      .fontSize(9)
      .font('Helvetica')
      .text(`Client Name: ${quotation.project?.customer?.user?.fullName || 'Valued Customer'}`, 50, yStart + 22)
      .text(`Email: ${quotation.project?.customer?.user?.email || 'N/A'}`, 50, yStart + 35)
      .text(`Phone: ${quotation.project?.customer?.user?.phoneNumber || 'N/A'}`, 50, yStart + 48)
      .text(`Site: ${quotation.project?.customer?.address || 'Site Address'}, ${quotation.project?.customer?.city || ''}`, 50, yStart + 61, { width: 235, lineBreak: true });

    // Right Box: Quotation Specs
    doc
      .fillColor(primaryColor)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('QUOTATION DETAILS:', 315, yStart + 8);

    doc
      .fillColor(slateDark)
      .fontSize(9)
      .font('Helvetica')
      .text(`Quotation #: ${quotation.quotationNumber}`, 315, yStart + 22)
      .text(`Revision: Version ${quotation.versionNumber}`, 315, yStart + 35)
      .text(`Date: ${new Date(quotation.quotationDate).toLocaleDateString()}`, 315, yStart + 48)
      .text(`Valid Until: ${new Date(quotation.expiryDate).toLocaleDateString()}`, 315, yStart + 61)
      .text(`Project Code: ${quotation.project?.projectCode} (${quotation.project?.kitchenType || 'Modular Kitchen'})`, 315, yStart + 74);

    // 3. Line Items Table Header
    const tableTop = yStart + 110;
    doc
      .rect(40, tableTop, 515, 22)
      .fill(primaryColor);

    doc
      .fillColor('#ffffff')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('ITEM & CATEGORY', 48, tableTop + 6)
      .text('SPECIFICATIONS & FINISH', 180, tableTop + 6)
      .text('QTY', 370, tableTop + 6, { align: 'center', width: 30 })
      .text('UNIT PRICE', 410, tableTop + 6, { align: 'right', width: 60 })
      .text('TOTAL (INR)', 480, tableTop + 6, { align: 'right', width: 65 });

    let currentY = tableTop + 24;

    // 4. Line Items Rows
    const items = quotation.items || [];
    items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      doc
        .rect(40, currentY, 515, 26)
        .fill(isEven ? '#ffffff' : '#f8fafc');

      // Category / Description
      doc
        .fillColor(slateDark)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(item.description, 48, currentY + 4, { width: 125, lineBreak: false })
        .font('Helvetica')
        .fontSize(7)
        .fillColor(slateLight)
        .text(item.category.replace(/_/g, ' '), 48, currentY + 14);

      // Specs & Finish
      doc
        .fillColor(slateDark)
        .fontSize(7.5)
        .text(item.materialFinish || item.dimensions || 'Standard Factory Specs', 180, currentY + 7, { width: 180 });

      // Quantity
      doc
        .fontSize(8)
        .text(String(item.quantity), 370, currentY + 7, { align: 'center', width: 30 });

      // Unit Price
      doc
        .text(`₹${Number(item.unitPrice).toLocaleString('en-IN')}`, 410, currentY + 7, { align: 'right', width: 60 });

      // Total Price
      doc
        .font('Helvetica-Bold')
        .text(`₹${Number(item.totalPrice).toLocaleString('en-IN')}`, 480, currentY + 7, { align: 'right', width: 65 });

      currentY += 26;
    });

    // Divider line
    doc
      .moveTo(40, currentY + 5)
      .lineTo(555, currentY + 5)
      .strokeColor('#cbd5e1')
      .stroke();

    // 5. Financial Summary Calculation Box
    const summaryTop = currentY + 12;
    const summaryLeft = 320;
    const summaryWidth = 235;

    doc
      .rect(summaryLeft, summaryTop, summaryWidth, 125)
      .fillAndStroke(bgLight, '#e2e8f0');

    const renderSummaryRow = (label, value, y, isBold = false, isHighlight = false) => {
      doc
        .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isBold ? 9 : 8)
        .fillColor(isHighlight ? goldColor : primaryColor)
        .text(label, summaryLeft + 12, y);

      doc
        .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isBold ? 9.5 : 8)
        .fillColor(isHighlight ? primaryColor : slateDark)
        .text(`₹${Number(value).toLocaleString('en-IN')}`, summaryLeft + 120, y, { align: 'right', width: 95 });
    };

    renderSummaryRow('Subtotal (Materials):', quotation.subtotal, summaryTop + 8);
    renderSummaryRow(`Discount (${quotation.discountPercentage}%):`, -quotation.discountAmount, summaryTop + 22);
    renderSummaryRow(`GST / Taxes (${quotation.gstPercentage}%):`, quotation.gstAmount, summaryTop + 36);
    renderSummaryRow('Installation & Assembly:', quotation.installationCharges, summaryTop + 50);
    renderSummaryRow('Transportation & Freight:', quotation.transportCharges, summaryTop + 64);

    doc
      .moveTo(summaryLeft + 10, summaryTop + 80)
      .lineTo(summaryLeft + summaryWidth - 10, summaryTop + 80)
      .strokeColor('#cbd5e1')
      .stroke();

    renderSummaryRow('NET GRAND TOTAL:', quotation.grandTotal, summaryTop + 92, true, true);

    // Left Box: Terms & Conditions
    doc
      .rect(40, summaryTop, 265, 125)
      .fillAndStroke(bgLight, '#e2e8f0');

    doc
      .fillColor(primaryColor)
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('TERMS & PAYMENT MILESTONES:', 50, summaryTop + 8);

    doc
      .fillColor(slateDark)
      .fontSize(7.5)
      .font('Helvetica')
      .text(
        quotation.termsAndConditions ||
          '1. 50% Advance Token on quotation acceptance to initiate factory production.\n2. 40% On completion of factory CNC cutting & edge banding prior to dispatch.\n3. 10% On completion of site modular assembly & customer sign-off.\n4. Standard 10-year warranty applies to Hettich/Blum hinges and carcass integrity.\n5. Rates inclusive of 18% GST and professional installation.',
        50,
        summaryTop + 24,
        { width: 245, lineGap: 2.5 }
      );

    // 6. Signatures and Authorizations
    const signTop = summaryTop + 145;
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text('Authorized Business Representative', 50, signTop)
      .text('Customer Acceptance Sign-Off', 350, signTop);

    doc
      .moveTo(50, signTop + 35)
      .lineTo(200, signTop + 35)
      .strokeColor('#94a3b8')
      .stroke();

    doc
      .moveTo(350, signTop + 35)
      .lineTo(500, signTop + 35)
      .strokeColor('#94a3b8')
      .stroke();

    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor(slateLight)
      .text('CKTracker Modular Kitchens Pvt Ltd', 50, signTop + 40)
      .text(`Client: ${quotation.project?.customer?.user?.fullName || ''} (Signature / Date)`, 350, signTop + 40);

    // Footer
    doc
      .fontSize(7)
      .fillColor('#94a3b8')
      .text(
        'This is an enterprise computerized modular kitchen quotation generated by CKTracker. All hardware specifications compliant with ISO 9001 factory standards.',
        40,
        780,
        { align: 'center', width: 515 }
      );

    doc.end();
    return doc;
  }
}

module.exports = new PDFService();
