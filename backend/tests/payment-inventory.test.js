const request = require('supertest');
const app = require('../src/app');

describe('Payments & Inventory API Security and Business Constraints', () => {
  it('GET /api/payments/summary without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/payments/summary');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/inventory without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.statusCode).toEqual(401);
  });

  it('POST /api/payments without token should return 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 50000 });
    expect(res.statusCode).toEqual(401);
  });

  it('POST /api/inventory without token should return 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/inventory')
      .send({ name: 'Marine Ply' });
    expect(res.statusCode).toEqual(401);
  });
});
