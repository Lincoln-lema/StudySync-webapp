const request = require('supertest');
const app = require('../index');

describe('GET /api/activity', () => {
  it('returns 200 and an array', async () => {
    const res = await request(app).get('/api/activity');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('each entry has member_id, activity_date, and minutes_studied', async () => {
    const res = await request(app).get('/api/activity');
    res.body.forEach((entry) => {
      expect(entry).toHaveProperty('member_id');
      expect(entry).toHaveProperty('activity_date');
      expect(entry).toHaveProperty('minutes_studied');
    });
  });

  it('filters by ?member=anna', async () => {
    const res = await request(app).get('/api/activity?member=anna');
    expect(res.statusCode).toBe(200);
    res.body.forEach((entry) => {
      expect(entry.member_id).toBe('anna');
    });
  });
});
