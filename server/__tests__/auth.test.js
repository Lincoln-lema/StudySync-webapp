const request = require('supertest');
const app = require('../index');

afterAll(async () => {
  await require('../db').end();
});

describe('API Key Authentication', () => {
  it('returns 401 when no API key is provided', async () => {
    const res = await request(app).get('/api/members');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Missing or invalid API key');
  });

  it('returns 200 when a valid API key is provided', async () => {
    // Note: This relies on the API_KEYS set in .env
    const validKey = process.env.API_KEYS.split(',')[0].trim();
    const res = await request(app)
      .get('/api/members')
      .set('X-API-Key', validKey);
      
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
