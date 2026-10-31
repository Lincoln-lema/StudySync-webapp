// Write-endpoint validation tests (Week 6 follow-up).
// The database is mocked, so these run without MySQL. They prove two things:
//   1. Over-long values get a 400 and never reach the database (no silent truncation).
//   2. 401 and 429 bodies carry `error` (the contract's Error schema) as well as `message`.
process.env.API_KEYS = 'test-key';
jest.mock('../db', () => ({ query: jest.fn(), end: jest.fn() }));
const request = require('supertest');
const pool = require('../db');
const app = require('../index');

const H = { 'X-API-Key': 'test-key' };
beforeEach(() => pool.query.mockReset());

describe('members: length validation', () => {
  it('rejects an 11-char id with 400 and never touches the DB', async () => {
    const res = await request(app).post('/api/members').set(H)
      .send({ id: 'abcdefghijk', name: 'Long', initials: 'L' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('id must be at most 10 characters');
    expect(pool.query).not.toHaveBeenCalled();
  });
  it('rejects 6-char initials', async () => {
    const res = await request(app).post('/api/members').set(H)
      .send({ id: 'ok', name: 'N', initials: 'ABCDEF' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('initials must be at most 5 characters');
    expect(pool.query).not.toHaveBeenCalled();
  });
  it('rejects a 101-char name and an 11-char group_id', async () => {
    let res = await request(app).post('/api/members').set(H)
      .send({ id: 'ok', name: 'x'.repeat(101), initials: 'N' });
    expect(res.statusCode).toBe(400);
    res = await request(app).post('/api/members').set(H)
      .send({ id: 'ok', name: 'N', initials: 'N', group_id: 'g'.repeat(11) });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it('accepts values exactly at the limit (10 / 100 / 5 / 10) -> 201', async () => {
    pool.query.mockResolvedValueOnce([{}]);
    const res = await request(app).post('/api/members').set(H)
      .send({ id: 'a'.repeat(10), name: 'n'.repeat(100), initials: 'abcde', group_id: 'g'.repeat(10) });
    expect(res.statusCode).toBe(201);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  it('counts characters like MySQL does: 10 emoji ok, 11 rejected', async () => {
    pool.query.mockResolvedValueOnce([{}]);
    let res = await request(app).post('/api/members').set(H)
      .send({ id: '😀'.repeat(10), name: 'N', initials: 'N' });
    expect(res.statusCode).toBe(201);
    res = await request(app).post('/api/members').set(H)
      .send({ id: '😀'.repeat(11), name: 'N', initials: 'N' });
    expect(res.statusCode).toBe(400);
  });
  it('PUT rejects over-long name before touching the DB', async () => {
    const res = await request(app).put('/api/members/anna').set(H)
      .send({ name: 'x'.repeat(101), initials: 'A' });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it('PUT with valid body still works (404 path unchanged)', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/members/ghost').set(H)
      .send({ name: 'Ghost', initials: 'G' });
    expect(res.statusCode).toBe(404);
  });
});

describe('tasks: length validation', () => {
  const base = { id: 't9', title: 'T', assigned_to: 'anna', deadline: '2026-12-01T12:00:00Z' };
  it('rejects an 11-char id and a 151-char title on POST, no DB calls', async () => {
    let res = await request(app).post('/api/tasks').set(H).send({ ...base, id: 'abcdefghijk' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('id must be at most 10 characters');
    res = await request(app).post('/api/tasks').set(H).send({ ...base, title: 'x'.repeat(151) });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('title must be at most 150 characters');
    expect(pool.query).not.toHaveBeenCalled();
  });
  it('rejects a 151-char title on PATCH before the existence lookup', async () => {
    const res = await request(app).patch('/api/tasks/t1').set(H).send({ title: 'x'.repeat(151) });
    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it('accepts a 150-char title on POST -> 201', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 'anna' }]])  // assignee lookup
      .mockResolvedValueOnce([{}]);               // insert
    const res = await request(app).post('/api/tasks').set(H).send({ ...base, title: 'x'.repeat(150) });
    expect(res.statusCode).toBe(201);
  });
});

describe('auth + rate limit error bodies', () => {
  it('401 has both error and message', async () => {
    const res = await request(app).get('/api/members');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Missing or invalid API key', message: 'Missing or invalid API key' });
  });
  it('429 has error, message and retryAfter', async () => {
    const { rateLimit } = require('../middleware/rateLimit');
    const express = require('express');
    const mini = express();
    mini.use(rateLimit({ windowMs: 60000, max: 1 }));
    mini.get('/x', (req, res) => res.json({ ok: true }));
    await request(mini).get('/x');
    const res = await request(mini).get('/x');
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('Too many requests');
    expect(res.body.message).toBe('Too many requests');
    expect(typeof res.body.retryAfter).toBe('number');
    expect(res.headers['retry-after']).toBeDefined();
  });
});
