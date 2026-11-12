const request = require('supertest');
const app = require('../src/app');

describe('Health and Authentication API', () => {
  it('GET /api/health should return UP status and service info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('UP');
    expect(res.body.service).toContain('CKTracker');
  });

  it('POST /api/auth/login with missing fields should return 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bademail' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
