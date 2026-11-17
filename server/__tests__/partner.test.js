// Week 13: migration to SettleIn's v2 property list.
// SettleIn is faked (global.fetch), so these run without their server or a database.
process.env.API_KEYS = 'test-key';
process.env.SETTLEIN_URL = 'https://partner.example.com';
process.env.SETTLEIN_API_KEY = 'partner-key';

const request = require('supertest');
const app = require('../index');
const { versions, listVersion } = require('../partner');

const item = { id: 'prop-002', title: 'Housing', price: 12000 };
const v1Body = [item];
const v2Body = { data: [item], count: 1 }; // the shape in SettleIn's notice

// What the page should get from OUR /api/properties, whichever version we call.
const wanted = [{
  id: 'prop-002', title: 'Housing', type: null, price: 12000,
  location: null, campus: null, verified: false, vacant_units: null, image: null,
}];

const reply = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const realFetch = global.fetch;
const realVersion = process.env.PARTNER_VERSION;
let errSpy;
beforeEach(() => {
  errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  delete process.env.PARTNER_VERSION;
});
afterEach(() => {
  global.fetch = realFetch;
  errSpy.mockRestore();
  if (realVersion === undefined) delete process.env.PARTNER_VERSION;
  else process.env.PARTNER_VERSION = realVersion;
});

const get = (path) => request(app).get(path).set('X-API-Key', 'test-key');

describe('parsers', () => {
  test('v1 and v2 give the app exactly the same list', () => {
    expect(versions.v1.parse(v1Body)).toEqual([item]);
    expect(versions.v2.parse(v2Body)).toEqual([item]);
  });

  test('the wrong parser fails loudly, not quietly', () => {
    expect(() => versions.v1.parse(v2Body)).toThrow('unexpected v1 shape');
    expect(() => versions.v2.parse(v1Body)).toThrow('unexpected v2 shape');
    expect(() => versions.v2.parse(null)).toThrow('unexpected v2 shape');
    expect(() => versions.v2.parse({ data: 'nope' })).toThrow('unexpected v2 shape');
  });

  test('an empty v2 list is fine', () => {
    expect(versions.v2.parse({ data: [], count: 0 })).toEqual([]);
  });
});

describe('version switch', () => {
  test('defaults to v1', () => {
    expect(listVersion().path).toBe('/api/v1/properties');
  });

  test('PARTNER_VERSION=v2 selects v2, and v1 rolls it back', () => {
    process.env.PARTNER_VERSION = 'v2';
    expect(listVersion().path).toBe('/api/v2/properties');
    process.env.PARTNER_VERSION = 'v1';
    expect(listVersion().path).toBe('/api/v1/properties');
  });

  test('an unknown version is an error, not a silent fallback', () => {
    process.env.PARTNER_VERSION = 'v3';
    expect(() => listVersion()).toThrow('unknown PARTNER_VERSION');
  });
});

describe('GET /api/properties on v1 (default)', () => {
  test('calls the v1 path and returns the list', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(200, v1Body));
    const res = await get('/api/properties');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(wanted);
    expect(global.fetch.mock.calls[0][0]).toBe('https://partner.example.com/api/v1/properties');
  });
});

describe('GET /api/properties on v2', () => {
  beforeEach(() => { process.env.PARTNER_VERSION = 'v2'; });

  test('calls the v2 path, forwards the key, and returns the same list as v1', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(200, v2Body));
    const res = await get('/api/properties');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(wanted);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://partner.example.com/api/v2/properties');
    expect(options.headers['X-API-Key']).toBe('partner-key');
  });

  test('if the partner still sends the v1 shape, we say so (502 and a log line), not an empty page', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(200, v1Body));
    const res = await get('/api/properties');
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'Partner data unavailable' });
    expect(errSpy.mock.calls.flat().join(' ')).toContain('unexpected v2 shape');
  });

  test('a partner 404 on the v2 path (not deployed yet) is a 502 and is not retried', async () => {
    global.fetch = jest.fn().mockResolvedValue(reply(404, { error: 'not found' }));
    const res = await get('/api/properties');
    expect(res.status).toBe(502);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('rollback: setting PARTNER_VERSION back to v1 restores the v1 call, with no code change', async () => {
    process.env.PARTNER_VERSION = 'v1';
    global.fetch = jest.fn().mockResolvedValue(reply(200, v1Body));
    const res = await get('/api/properties');
    expect(res.status).toBe(200);
    expect(global.fetch.mock.calls[0][0]).toBe('https://partner.example.com/api/v1/properties');
  });
});

describe('what does NOT change', () => {
  test('study-amenities still calls the v1 detail path whichever list version is chosen', async () => {
    process.env.PARTNER_VERSION = 'v2';
    global.fetch = jest.fn().mockResolvedValue(reply(200, {
      accommodation_id: 'prop-003', accommodation_name: 'Sunrise Court', wifi_rating: 4.5,
      quiet_hours: { starts_at: '22:00', ends_at: '06:00', policy_enforced: true },
    }));
    const res = await get('/api/properties/prop-003/study-amenities');
    expect(res.status).toBe(200);
    expect(global.fetch.mock.calls[0][0])
      .toBe('https://partner.example.com/api/v1/properties/prop-003/study-amenities');
  });
});
