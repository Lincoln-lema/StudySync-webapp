// Integration tests against the live SettleIn (Team 1) API.
//
// Skipped by default because the SettleIn server isn't up yet. Enable once their
// server is reachable:
//
//   SETTLEIN_LIVE_TESTS=1 SETTLEIN_API_URL=http://localhost:5000 SETTLEIN_TOKEN=... npm test
//
// Stubs assert the contract fields StudySync actually consumes.

const BASE = process.env.SETTLEIN_API_URL || 'http://localhost:5000';
const TOKEN = process.env.SETTLEIN_TOKEN || '';
const LIVE = process.env.SETTLEIN_LIVE_TESTS === '1';

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(BASE + path, { ...options, headers });
  if (!res.ok) {
    throw new Error(`SettleIn ${options.method || 'GET'} ${path} -> ${res.status}`);
  }
  return res.json();
}

const describeLive = LIVE ? describe : describe.skip;

describeLive('SettleIn integration', () => {
  const STUDENT_ID = process.env.SETTLEIN_STUDENT_ID || '1042';
  const ACCOMMODATION_ID = process.env.SETTLEIN_ACCOMMODATION_ID || '305';

  it('GET /api/v1/users/{id}/residence-area returns coarse coordinates in km', async () => {
    const r = await api(`/api/v1/users/${STUDENT_ID}/residence-area`);
    expect(r).toHaveProperty('distance_to_campus_km');
    expect(typeof r.distance_to_campus_km).toBe('number');
    expect(r.coordinates).toHaveProperty('latitude');
    expect(r.coordinates).toHaveProperty('longitude');
    expect(r).toHaveProperty('cached_at');
  });

  it('GET /api/v1/accommodations/{id}/study-amenities returns a 1-5 wifi_rating', async () => {
    const a = await api(`/api/v1/accommodations/${ACCOMMODATION_ID}/study-amenities`);
    expect(a.wifi_rating).toBeGreaterThanOrEqual(1);
    expect(a.wifi_rating).toBeLessThanOrEqual(5);
    expect(a).toHaveProperty('has_dedicated_desk');
    expect(a.quiet_hours).toHaveProperty('starts_at');
    expect(a.quiet_hours).toHaveProperty('ends_at');
  });

  it('GET /api/v1/students/{id}/lease-timeline returns a relocation window', async () => {
    const l = await api(`/api/v1/students/${STUDENT_ID}/lease-timeline`);
    expect(['pending', 'confirmed', 'active', 'terminated', 'completed']).toContain(
      l.lease_status
    );
    expect(l).toHaveProperty('move_in_date');
    expect(l).toHaveProperty('relocation_window_start');
    expect(l).toHaveProperty('relocation_window_end');
    expect(typeof l.is_relocating).toBe('boolean');
  });

  it('GET /api/v1/users/{id}/public-profile returns a verified student', async () => {
    const p = await api(`/api/v1/users/${STUDENT_ID}/public-profile`);
    expect(p).toHaveProperty('display_name');
    expect(p).toHaveProperty('university_affiliation');
    expect(typeof p.is_verified_student).toBe('boolean');
    expect(p).toHaveProperty('avatar_url');
  });

  it('POST /api/v1/accommodations/group-inquiries creates an inquiry', async () => {
    const inquiry = {
      group_id: 'grp-studysync-int-test',
      initiator_student_id: Number(STUDENT_ID),
      member_student_ids: [Number(STUDENT_ID), Number(STUDENT_ID) + 1],
      target_campus: 'Madaraka Main Campus',
      preferred_room_type: '3-bedroom',
      max_budget_per_person_kes: 18000,
      move_in_target_date: '2026-09-01',
    };
    const res = await api('/api/v1/accommodations/group-inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry),
    });
    expect(res).toHaveProperty('inquiry_id');
    expect(res.status).toBe('submitted');
  });

  it('error responses use the ErrorResponse shape', async () => {
    const res = await fetch(BASE + `/api/v1/users/999999/residence-area`, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('status_code');
    expect(body).toHaveProperty('timestamp');
  });
});