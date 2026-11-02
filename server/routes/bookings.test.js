process.env.API_KEYS = 'test-key';
process.env.SETTLEIN_URL = 'https://partner.example.com';
process.env.SETTLEIN_API_KEY = 'partner-key';

jest.mock('../db', () => ({ query: jest.fn(), end: jest.fn() }));

const request = require('supertest');
const pool = require('../db');
const app = require('../index');

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const AMENITIES = {
  accommodation_id: 'prop-003',
  accommodation_name: 'Sunrise Court',
  wifi_rating: 4.5,
  has_dedicated_desk: true,
  has_backup_generator: true,
  quiet_hours: { starts_at: '22:00', ends_at: '06:00', policy_enforced: true },
  max_study_guests: 4,
};

const VALID = {
  property_id: 'prop-003',
  booked_by: 'anna',
  session_date: '2099-01-01',
  start_time: '14:00',
  end_time: '17:00',
  guests: 2,
};

const realFetch = global.fetch;
let errSpy;
beforeEach(() => {
  pool.query.mockReset();
  global.fetch = jest.fn().mockResolvedValue(reply(200, AMENITIES));
  errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { global.fetch = realFetch; errSpy.mockRestore(); });

const post = (body) => request(app).post('/api/bookings').set('X-API-Key', 'test-key').send(body);
const memberFound = () => pool.query.mockResolvedValueOnce([[{ id: 'anna' }]]);

describe('POST /api/bookings', () => {
  test('401 without an API key', async () => {
    const res = await request(app).post('/api/bookings').send(VALID);
    expect(res.status).toBe(401);
  });

  test('400 when required fields are missing', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
  });

  test('400 when end_time is not after start_time', async () => {
    const res = await post({ ...VALID, start_time: '17:00', end_time: '14:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/after start_time/);
  });

  test('400 for a malformed time', async () => {
    const res = await post({ ...VALID, start_time: '25:00' });
    expect(res.status).toBe(400);
  });

  test('400 for a date in the past', async () => {
    const res = await post({ ...VALID, session_date: '2000-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/past/);
  });

  test('400 when the member does not exist (partner is not called)', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const res = await post(VALID);
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('400 when guests exceed the partner limit', async () => {
    memberFound();
    const res = await post({ ...VALID, guests: 9 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/guests/);
  });

  test('400 when the session overlaps enforced quiet hours', async () => {
    memberFound();
    const res = await post({ ...VALID, start_time: '21:00', end_time: '23:00' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quiet hours/i);
  });

  test('409 when the slot is already booked', async () => {
    memberFound();
    pool.query.mockResolvedValueOnce([[{ id: 'b1' }]]);
    const res = await post(VALID);
    expect(res.status).toBe(409);
  });

  test('502 when SettleIn is unreachable', async () => {
    memberFound();
    global.fetch = jest.fn().mockRejectedValue(
      Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } })
    );
    const res = await post(VALID);
    expect(res.status).toBe(502);
  });

  test('404 when SettleIn does not know the property', async () => {
    memberFound();
    global.fetch = jest.fn().mockResolvedValue(reply(404, { error: 'not found' }));
    const res = await post({ ...VALID, property_id: 'nope' });
    expect(res.status).toBe(404);
  });

  test('201 creates a confirmed booking and stores it', async () => {
    memberFound();
    pool.query.mockResolvedValueOnce([[]]);
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await post(VALID);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('confirmed');
    expect(res.body.property_name).toBe('Sunrise Court');
    expect(res.body.id).toMatch(/^b[0-9a-f]{8}$/);
    expect(pool.query.mock.calls[2][0]).toMatch(/INSERT INTO study_bookings/);
  });
});

describe('GET /api/bookings', () => {
  test('200 returns the list', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 'b1', status: 'confirmed' }]]);
    const res = await request(app).get('/api/bookings?propertyId=prop-003').set('X-API-Key', 'test-key');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('400 for an invalid status filter', async () => {
    const res = await request(app).get('/api/bookings?status=banana').set('X-API-Key', 'test-key');
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/bookings/:id', () => {
  test('404 for an unknown booking', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).delete('/api/bookings/zzz').set('X-API-Key', 'test-key');
    expect(res.status).toBe(404);
  });

  test('200 cancels an existing booking', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/bookings/b1').set('X-API-Key', 'test-key');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });
});