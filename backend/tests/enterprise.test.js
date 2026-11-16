const request = require('supertest');
const app = require('../src/app');

describe('Enterprise Services (Analytics, Employees, Support, Notifications)', () => {
  it('GET /api/analytics/overview without token should return 401', async () => {
    const res = await request(app).get('/api/analytics/overview');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/users/employees without token should return 401', async () => {
    const res = await request(app).get('/api/users/employees');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/support/tickets without token should return 401', async () => {
    const res = await request(app).get('/api/support/tickets');
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/notifications without token should return 401', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toEqual(401);
  });
});
