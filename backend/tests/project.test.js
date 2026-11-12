const request = require('supertest');
const app = require('../src/app');

describe('Project Management & 14-Stage Engine API Security', () => {
  it('GET /api/projects without authentication should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/projects without token should return 401', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ title: 'New Modular Kitchen' });
    expect(res.statusCode).toEqual(401);
  });

  it('PUT /api/projects/:id/stages/:stageId without token should return 401', async () => {
    const res = await request(app)
      .put('/api/projects/proj-123/stages/stage-456')
      .send({ status: 'COMPLETED' });
    expect(res.statusCode).toEqual(401);
  });
});
