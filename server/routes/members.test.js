const request = require('supertest');
const app = require('../index');

describe('GET /api/members', () => {
  it('returns 200 and an array of members', async () => {
    const res = await request(app).get('/api/members');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('each member has the expected fields', async () => {
    const res = await request(app).get('/api/members');
    const member = res.body[0];
    expect(member).toHaveProperty('id');
    expect(member).toHaveProperty('name');
    expect(member).toHaveProperty('initials');
    expect(member).toHaveProperty('reliability');
  });

  it('reliability is a number between 0 and 100', async () => {
    const res = await request(app).get('/api/members');
    res.body.forEach((m) => {
      expect(typeof m.reliability).toBe('number');
      expect(m.reliability).toBeGreaterThanOrEqual(0);
      expect(m.reliability).toBeLessThanOrEqual(100);
    });
  });
});
