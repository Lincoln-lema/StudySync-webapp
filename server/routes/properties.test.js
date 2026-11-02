process.env.API_KEYS = 'test-key';
process.env.SETTLEIN_URL = 'https://partner.example.com';
process.env.SETTLEIN_API_KEY = 'partner-key';

const request = require('supertest');
const app = require('../index');
const propertiesRouter = require('./properties');

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const GOOD = {
  accommodation_id: 'prop-003',
  accommodation_name: 'Sunrise Court',
  wifi_rating: 4.5,
  wifi_speed_mbps: 50,
  has_dedicated_desk: true,
  has_backup_generator: false,
  quiet_hours: { starts_at: '22:00', ends_at: '06:00', policy_enforced: true },
  max_study_guests: 3,
  last_inspected_at: '2026-10-01',
};
const refused = () =>
  Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });

const realFetch = global.fetch;
let errSpy;
let warnSpy;
beforeEach(() => {
  errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  propertiesRouter.helpers.lastGood.clear(); // each test starts with nothing saved
});
afterEach(() => {
  global.fetch = realFetch;
  errSpy.mockRestore();
  warnSpy.mockRestore();
});

const get = (path) => request(app).get(path).set('X-API-Key', 'test-key');

describe('GET /api/properties/:id/study-amenities', () => {
  test('adapts a contract-shaped response and forwards the partner key', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(200, GOOD));
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(200);
    expect(res.body.property_id).toBe('prop-003');
    expect(res.body.wifi_rating).toBe(4.5);
    expect(res.body.has_backup_generator).toBe(false);
    expect(res.body.quiet_hours.starts_at).toBe('22:00');
    expect(res.body.source).toBe('live');
    expect(res.body.stale).toBe(false);
    expect(typeof res.body.asOf).toBe('string');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/properties/prop-003/study-amenities'),
      { headers: { 'X-API-Key': 'partner-key' }, signal: expect.anything() } // signal = the 1.5 s timeout
    );
  });

  test('normalizes flat quiet hours, string numbers and 1/0 flags', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(200, {
      id: 'prop-003',
      title: 'Sunrise Court',
      wifi_rating: '4.5',
      has_dedicated_desk: 1,
      has_backup_generator: '0',
      quiet_hours_start: '21:00',
      quiet_hours_end: '05:00',
    }));
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(200);
    expect(res.body.wifi_rating).toBe(4.5);
    expect(res.body.has_dedicated_desk).toBe(true);
    expect(res.body.has_backup_generator).toBe(false);
    expect(res.body.quiet_hours.starts_at).toBe('21:00');
    expect(res.body.quiet_hours.ends_at).toBe('05:00');
  });

  test('partner unreachable (ECONNREFUSED) with nothing saved returns 502 after 2 retries', async () => {
    global.fetch = jest.fn().mockRejectedValue(refused());
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Partner data unavailable');
    expect(global.fetch).toHaveBeenCalledTimes(3); // 1 try + 2 retries, never more
  });

  test('partner 404 is passed through as 404 and is not retried', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(404, { error: 'not found' }));
    const res = await get('/api/properties/nope/study-amenities');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Property not found');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('unexpected partner shape with nothing saved returns 502', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(200, { foo: 'bar' }));
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(502);
  });

  test('request without an API key is rejected with 401', async () => {
    global.fetch = jest.fn();
    const res = await request(app).get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('resilience: retry and saved-copy fallback', () => {
  test('a flaky partner (503, 503, then 200) succeeds on the third attempt', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(reply(503, { message: 'Try again' }))
      .mockResolvedValueOnce(reply(503, { message: 'Try again' }))
      .mockResolvedValueOnce(reply(200, GOOD));
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(200);
    expect(res.body.stale).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('a 401 from the partner is not retried', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(401, { error: 'bad key' }));
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(502);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('partner goes down after a good call: returns the saved copy flagged stale', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(200, GOOD));
    const live = await get('/api/properties/prop-003/study-amenities');
    expect(live.body.stale).toBe(false);

    global.fetch = jest.fn().mockRejectedValue(refused());
    const saved = await get('/api/properties/prop-003/study-amenities');
    expect(saved.status).toBe(200);
    expect(saved.body.stale).toBe(true);
    expect(saved.body.asOf).toBe(live.body.asOf); // the time it was saved, not now
    expect(saved.body.name).toBe('Sunrise Court');
  });

  test('a saved copy is never used to hide a 404', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(200, GOOD));
    await get('/api/properties/prop-003/study-amenities');

    global.fetch = jest.fn().mockResolvedValue(reply(404, { error: 'not found' }));
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(404);
  });
});