process.env.API_KEYS = 'test-key';
process.env.SETTLEIN_URL = 'https://partner.example.com';
process.env.SETTLEIN_API_KEY = 'partner-key';

const request = require('supertest');
const app = require('../index');

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const realFetch = global.fetch;
let errSpy;
beforeEach(() => { errSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { global.fetch = realFetch; errSpy.mockRestore(); });

const get = (path) => request(app).get(path).set('X-API-Key', 'test-key');

describe('GET /api/properties/:id/study-amenities', () => {
  test('adapts a contract-shaped response and forwards the partner key', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(200, {
      accommodation_id: 'prop-003',
      accommodation_name: 'Sunrise Court',
      wifi_rating: 4.5,
      wifi_speed_mbps: 50,
      has_dedicated_desk: true,
      has_backup_generator: false,
      quiet_hours: { starts_at: '22:00', ends_at: '06:00', policy_enforced: true },
      max_study_guests: 3,
      last_inspected_at: '2026-10-01',
    }));
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(200);
    expect(res.body.property_id).toBe('prop-003');
    expect(res.body.wifi_rating).toBe(4.5);
    expect(res.body.has_backup_generator).toBe(false);
    expect(res.body.quiet_hours.starts_at).toBe('22:00');
    expect(res.body.source).toBe('live');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/properties/prop-003/study-amenities'),
      { headers: { 'X-API-Key': 'partner-key' } }
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

  test('partner unreachable (ECONNREFUSED) returns 502', async () => {
    global.fetch = jest.fn().mockRejectedValue(
      Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } })
    );
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(502);
    expect(res.body.error).toBe('Partner data unavailable');
  });

  test('partner 404 is passed through as 404', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(404, { error: 'not found' }));
    const res = await get('/api/properties/nope/study-amenities');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Property not found');
  });

  test('unexpected partner shape returns 502', async () => {
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