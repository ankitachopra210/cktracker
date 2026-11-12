const request = require('supertest');
const app = require('../src/app');

describe('Customer CRM & Lead Management API Security', () => {
  it('GET /api/customers without authentication should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/leads without authentication should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/customers without token should return 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ fullName: 'Unauthorized Test' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/appointments without token should return 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ title: 'Unauthorized Site Visit' });
    expect(res.statusCode).toEqual(401);
  });
});
