const request = require('supertest');
const app = require('../index');

afterAll(async () => {
  await require('../db').end();
});

const key = process.env.API_KEYS.split(',')[0].trim();

describe('GET /api/tasks', () => {
  it('returns 200 and an array of tasks', async () => {
    const res = await request(app).get('/api/tasks').set('X-API-Key', key);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('each task has an id, title, and status', async () => {
    const res = await request(app).get('/api/tasks').set('X-API-Key', key);
    res.body.forEach((task) => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(['pending', 'done', 'late']).toContain(task.status);
    });
  });

  it('filters by ?status=late', async () => {
    const res = await request(app).get('/api/tasks?status=late').set('X-API-Key', key);
    expect(res.statusCode).toBe(200);
    res.body.forEach((task) => {
      expect(task.status).toBe('late');
    });
  });

  it('returns an empty array for a status with no matches', async () => {
    const res = await request(app).get('/api/tasks?status=nonexistent').set('X-API-Key', key);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});