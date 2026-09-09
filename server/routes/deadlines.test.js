const request = require('supertest');
const app = require('../index');

describe('GET /api/deadlines', () => {
  it('returns 200 and an array', async () => {
    const res = await request(app).get('/api/deadlines');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('every item has a non-null deadline', async () => {
    const res = await request(app).get('/api/deadlines');
    res.body.forEach((item) => {
      expect(item.deadline).not.toBeNull();
    });
  });

  it('is sorted by deadline ascending', async () => {
    const res = await request(app).get('/api/deadlines');
    const dates = res.body.map((d) => new Date(d.deadline).getTime());
    const sorted = [...dates].sort((a, b) => a - b);
    expect(dates).toEqual(sorted);
  });
});
