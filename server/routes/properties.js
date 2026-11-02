const express = require('express');
const router = express.Router();
const { fetchWithRetry } = require('../resilientFetch');

// Last good amenities response per property id, kept in memory (lost on restart).
const lastGood = new Map(); // id -> { data, asOf }

const base = () => (process.env.SETTLEIN_URL || '').replace(/\/+$/, '');
const isStandIn = () => /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(base());

const toBool = (v) => v === true || v === 1 || v === '1' || v === 'true';
const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function fetchPartner(path) {
  if (!base()) throw new Error('SETTLEIN_URL is not set');
  const url = `${base()}${path}`;
  const headers = {};
  if (process.env.SETTLEIN_API_KEY) headers['X-API-Key'] = process.env.SETTLEIN_API_KEY;

  const r = await fetchWithRetry(url, { headers }, { timeoutMs: 1500, retries: 2, delayMs: 200 });
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { url, status: r.status, ok: r.ok, body };
}

// SettleIn's contract: nested quiet_hours, typed booleans/numbers.
// Their earlier list endpoint: flat quiet_hours_start/end, strings and 1/0 flags.
// Normalize both so the frontend always gets one shape.
function normalizeAmenities(a, requestedId) {
  if (!a || typeof a !== 'object') return null;
  const quiet = a.quiet_hours && typeof a.quiet_hours === 'object'
    ? {
        starts_at: a.quiet_hours.starts_at ?? null,
        ends_at: a.quiet_hours.ends_at ?? null,
        policy_enforced: toBool(a.quiet_hours.policy_enforced),
      }
    : {
        starts_at: a.quiet_hours_start ?? null,
        ends_at: a.quiet_hours_end ?? null,
        policy_enforced: toBool(a.quiet_hours_policy_enforced),
      };

  return {
    property_id: a.accommodation_id ?? a.id ?? requestedId,
    name: a.accommodation_name ?? a.title ?? null,
    wifi_rating: toNum(a.wifi_rating),
    wifi_speed_mbps: toNum(a.wifi_speed_mbps),
    has_dedicated_desk: toBool(a.has_dedicated_desk),
    has_backup_generator: toBool(a.has_backup_generator),
    quiet_hours: quiet,
    max_study_guests: a.max_study_guests ?? null,
    last_inspected_at: a.last_inspected_at ?? null,
  };
}

router.get('/', async (req, res) => {
  try {
    const { url, ok, status, body } = await fetchPartner('/api/v1/properties');
    if (!ok) {
      console.error('SettleIn list failed', status, url);
      return res.status(502).json({ error: 'Partner data unavailable' });
    }
    const list = Array.isArray(body) ? body : (body && body.data) || [];
    res.json(list.map((p) => ({
      id: p.id ?? p.accommodation_id ?? null,
      title: p.title ?? p.accommodation_name ?? null,
      type: p.type ?? null,
      price: p.price ?? null,
      location: p.location ?? null,
      campus: p.campus ?? null,
      verified: toBool(p.verified),
      vacant_units: p.vacant_units ?? null,
      image: p.image ?? null,
    })));
  } catch (err) {
    const reason = err.name === 'TimeoutError' ? 'timeout' : (err.cause && err.cause.code) || err.message;
    console.error('SettleIn list call failed:', reason, base());
    res.status(502).json({ error: 'Partner data unavailable' });
  }
});

router.get('/:id/study-amenities', async (req, res) => {
  const id = req.params.id;

  // Saved copy, clearly flagged, or the normal 502 if we have nothing saved.
  const fallback = () => {
    const saved = lastGood.get(id);
    if (saved) return res.json({ ...saved.data, stale: true, asOf: saved.asOf });
    return res.status(502).json({ error: 'Partner data unavailable' });
  };

  try {
    const { url, status, body } = await fetchPartner(
      `/api/v1/properties/${encodeURIComponent(id)}/study-amenities`
    );
    if (status === 404) return res.status(404).json({ error: 'Property not found' });
    if (status < 200 || status >= 300) {
      console.error('SettleIn amenities failed', status, url);
      return fallback();
    }
    const n = normalizeAmenities(body, id);
    if (!n || (n.wifi_rating === null && n.wifi_speed_mbps === null)) {
      console.error('SettleIn amenities: unexpected shape', url);
      return fallback();
    }
    const data = { ...n, source: isStandIn() ? 'stand-in' : 'live' };
    const asOf = new Date().toISOString();
    lastGood.set(id, { data, asOf });
    res.json({ ...data, stale: false, asOf });
  } catch (err) {
    const reason = err.name === 'TimeoutError' ? 'timeout' : (err.cause && err.cause.code) || err.message;
    console.error('SettleIn amenities call failed:', reason, base());
    return fallback();
  }
});

router.helpers = { fetchPartner, normalizeAmenities };

module.exports = router;