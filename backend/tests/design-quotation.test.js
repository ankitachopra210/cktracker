const request = require('supertest');
const app = require('../src/app');
const pdfService = require('../src/services/pdf.service');

describe('Kitchen Design & Quotation API Security and PDF Generation', () => {
  it('GET /api/designs/project/p1 without authentication should return 401', async () => {
    const res = await request(app).get('/api/designs/project/p1');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/quotations/project/p1 without authentication should return 401', async () => {
    const res = await request(app).get('/api/quotations/project/p1');
    expect(res.statusCode).toEqual(401);
  });

  it('PDFService should generate valid PDF stream without errors', (done) => {
    const mockQuotation = {
      quotationNumber: 'CK-TEST-001',
      versionNumber: 1,
      quotationDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 500000,
      discountPercentage: 5,
      discountAmount: 25000,
      gstPercentage: 18,
      gstAmount: 85500,
      installationCharges: 20000,
      transportCharges: 5000,
      grandTotal: 585500,
      items: [
        {
          description: 'Base Cabinets Marine Ply',
          category: 'BASE_CABINETS',
          materialFinish: 'BWP Ply + Laminate',
          quantity: 1,
          unitPrice: 250000,
          totalPrice: 250000,
        },
        {
          description: 'High-Gloss Acrylic Wall Units',
          category: 'WALL_CABINETS',
          materialFinish: 'Rehau Pure White Gloss',
          quantity: 1,
          unitPrice: 250000,
          totalPrice: 250000,
        },
      ],
      project: {
        projectCode: 'CK-2026-TEST',
        kitchenType: 'Island Kitchen',
        customer: {
          user: { fullName: 'Test Customer', email: 'test@example.com', phoneNumber: '9876543210' },
          address: 'Test Villa, Bangalore',
        },
      },
    };

    const doc = pdfService.generateQuotationPDF(mockQuotation);
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.slice(0, 4).toString()).toEqual('%PDF');
      done();
    });
  });
});
