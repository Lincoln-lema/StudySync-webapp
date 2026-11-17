// Week 13: versioning tests.
// The database is mocked, so these run without MySQL. They prove:
//   1. v1 is frozen: same shape on /v1/tasks, /api/tasks and /tasks.
//   2. v2 has the new shape ({ data, count }) and still needs an API key.
//   3. v1 announces its sunset on every response; v2 and other paths do not.
//   4. /stats lists each version as its own row, so you can see who still uses v1.
process.env.API_KEYS = 'test-key';
jest.mock('../db', () => ({ query: jest.fn(), end: jest.fn() }));
const request = require('supertest');
const pool = require('../db');
const app = require('../index');

const KEY = { 'X-API-Key': 'test-key' };
const SUNSET = 'Wed, 16 Dec 2026 00:00:00 GMT';

const rows = [
  { id: 't1', title: 'Write report', assigned_to: 'anna', status: 'pending', deadline: '2026-11-20T23:59:00.000Z' },
  { id: 't2', title: 'Book lab room', assigned_to: 'ben', status: 'done', deadline: '2026-11-22T10:00:00.000Z' },
];

beforeEach(() => {
  pool.query.mockReset();
  pool.query.mockResolvedValue([rows]);
});

describe('v1 is frozen', () => {
  test.each(['/v1/tasks', '/api/tasks', '/tasks'])('GET %s returns a bare list with the original fields', async (path) => {
    const res = await request(app).get(path).set(KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(Object.keys(res.body[0]).sort()).toEqual(['assigned_to', 'deadline', 'id', 'status', 'title']);
  });

  test('the three v1 URLs return exactly the same body', async () => {
    const a = await request(app).get('/v1/tasks').set(KEY);
    const b = await request(app).get('/api/tasks').set(KEY);
    const c = await request(app).get('/tasks').set(KEY);
    expect(b.body).toEqual(a.body);
    expect(c.body).toEqual(a.body);
  });

  test('v1 error shape is unchanged', async () => {
    const res = await request(app).post('/v1/tasks').set(KEY).send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'id, title, assigned_to, and deadline are required' });
  });
});

describe('v2 has the new shape', () => {
  test('list is wrapped as { data, count }', async () => {
    const res = await request(app).get('/v2/tasks').set(KEY);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(false);
    expect(res.body.count).toBe(2);
    expect(res.body.data).toEqual(rows);
  });

  test('items keep exactly the v1 fields (only the wrapper is new)', async () => {
    const res = await request(app).get('/v2/tasks').set(KEY);
    expect(Object.keys(res.body.data[0]).sort()).toEqual(['assigned_to', 'deadline', 'id', 'status', 'title']);
  });

  test('?status= and ?assignee= still filter', async () => {
    await request(app).get('/v2/tasks?status=pending&assignee=anna').set(KEY);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('status = ?');
    expect(sql).toContain('assigned_to = ?');
    expect(params).toEqual(['pending', 'anna']);
  });

  test('an empty result is { data: [], count: 0 }', async () => {
    pool.query.mockResolvedValue([[]]);
    const res = await request(app).get('/v2/tasks?status=late').set(KEY);
    expect(res.body).toEqual({ data: [], count: 0 });
  });

  test('a database failure gives the same 500 body as v1', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    pool.query.mockRejectedValue(new Error('db down'));
    const res = await request(app).get('/v2/tasks').set(KEY);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch tasks' });
    console.error.mockRestore();
  });

  test('writes behave exactly like v1', async () => {
    const body = { id: 't9', title: 'New task', assigned_to: 'anna', deadline: '2026-11-20T23:59:00' };
    const expected = { ...body, status: 'pending' };

    pool.query.mockResolvedValueOnce([[{ id: 'anna' }]]).mockResolvedValueOnce([{}]);
    const viaV1 = await request(app).post('/v1/tasks').set(KEY).send(body);

    pool.query.mockResolvedValueOnce([[{ id: 'anna' }]]).mockResolvedValueOnce([{}]);
    const viaV2 = await request(app).post('/v2/tasks').set(KEY).send(body);

    expect(viaV1.status).toBe(201);
    expect(viaV2.status).toBe(201);
    expect(viaV1.body).toEqual(expected);
    expect(viaV2.body).toEqual(expected);
  });

  test('validation errors on v2 never reach the database', async () => {
    const res = await request(app).post('/v2/tasks').set(KEY).send({ id: 'abcdefghijk', title: 'x', assigned_to: 'anna', deadline: '2026-11-20T23:59:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('id must be at most 10 characters');
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('v2 needs an API key like everything else', async () => {
    const none = await request(app).get('/v2/tasks');
    expect(none.status).toBe(401);
    const wrong = await request(app).get('/v2/tasks').set({ 'X-API-Key': 'nope' });
    expect(wrong.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe('deprecation headers', () => {
  test.each(['/v1/tasks', '/api/tasks', '/tasks'])('GET %s announces the sunset', async (path) => {
    const res = await request(app).get(path).set(KEY);
    expect(res.headers.deprecation).toBe('true');
    expect(res.headers.sunset).toBe(SUNSET);
    expect(res.headers.link).toBe('</v2/tasks>; rel="successor-version"');
  });

  test('write calls on a v1 URL carry them too', async () => {
    pool.query.mockResolvedValue([{ affectedRows: 0 }]);
    const res = await request(app).delete('/api/tasks/nope').set(KEY);
    expect(res.status).toBe(404);
    expect(res.headers.deprecation).toBe('true');
  });

  test('v2 and other endpoints do not carry them', async () => {
    for (const path of ['/v2/tasks', '/api/members', '/nope']) {
      const res = await request(app).get(path).set(KEY);
      expect(res.headers.deprecation).toBeUndefined();
      expect(res.headers.sunset).toBeUndefined();
    }
  });
});

describe('/stats shows each version separately', () => {
  test('v1, unversioned and v2 appear as their own rows', async () => {
    for (const path of ['/v1/tasks', '/api/tasks', '/tasks', '/v2/tasks']) {
      await request(app).get(path).set(KEY);
    }
    const res = await request(app).get('/stats').set(KEY);
    expect(res.status).toBe(200);
    const labels = Object.keys(res.body.routes);
    expect(labels).toEqual(expect.arrayContaining(['GET /v1/tasks', 'GET /api/tasks', 'GET /tasks', 'GET /v2/tasks']));
  });
});
