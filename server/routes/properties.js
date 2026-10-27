const express = require('express');
const router = express.Router();

const base = () => (process.env.SETTLEIN_URL || '').replace(/\/+$/, '');

async function fetchPartner(path) {
  const url = `${base()}${path}`;
  
  // Week 10: Send SettleIn's API key with every request
  const headers = {};
  if (process.env.SETTLEIN_API_KEY) {
    headers['X-API-Key'] = process.env.SETTLEIN_API_KEY;
  }

  const r = await fetch(url, { headers });
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { url, status: r.status, ok: r.ok, body };
}

// SettleIn's contract returns nested quiet_hours and typed booleans/numbers.
// Their earlier list endpoint returned flat fields and string/1-0 variants.
// Normalize both so the frontend always gets one shape.
function normalizeAmenities(a, requestedId) {
  if (!a || typeof a !== 'object') return null;
  const quiet = a.quiet_hours && typeof a.quiet_hours === 'object'
    ? {
        starts_at: a.quiet_hours.starts_at ?? null,
        ends_at: a.quiet_hours.ends_at ?? null,
        policy_enforced: Boolean(a.quiet_hours.policy_enforced),
      }
    : {
        starts_at: a.quiet_hours_start ?? null,
        ends_at: a.quiet_hours_end ?? null,
        policy_enforced: Boolean(a.quiet_hours_policy_enforced),
      };

  return {
    property_id: a.accommodation_id ?? a.id ?? requestedId,
    name: a.accommodation_name ?? a.title ?? null,
    wifi_rating: a.wifi_rating == null ? null : Number(a.wifi_rating),
    wifi_speed_mbps: a.wifi_speed_mbps == null ? null : Number(a.wifi_speed_mbps),
    has_dedicated_desk: Boolean(a.has_dedicated_desk),
    has_backup_generator: Boolean(a.has_backup_generator),
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
      return res.status(502).json({ message: 'Partner data unavailable' });
    }
    const list = Array.isArray(body) ? body : (body?.data || []);
    res.json(list.map((p) => ({
      id: p.id ?? p.accommodation_id ?? null,
      title: p.title ?? p.accommodation_name ?? null,
      type: p.type ?? null,
      price: p.price ?? null,
      location: p.location ?? null,
      campus: p.campus ?? null,
      verified: Boolean(p.verified),
      vacant_units: p.vacant_units ?? null,
      image: p.image ?? null,
    })));
  } catch (err) {
    console.error('SettleIn list call failed:', err.cause?.code || err.message, base());
    res.status(502).json({ message: 'Partner data unavailable' });
  }
});

router.get('/:id/study-amenities', async (req, res) => {
  try {
    const { url, status, body } = await fetchPartner(
      `/api/v1/properties/${encodeURIComponent(req.params.id)}/study-amenities`
    );
    if (status === 404) return res.status(404).json({ message: 'Property not found' });
    if (status < 200 || status >= 300) {
      console.error('SettleIn amenities failed', status, url, body);
      return res.status(502).json({ message: 'Partner data unavailable' });
    }
    const normalized = normalizeAmenities(body, req.params.id);
    if (!normalized) return res.status(502).json({ message: 'Partner data unavailable' });
    res.json(normalized);
  } catch (err) {
    console.error('SettleIn amenities call failed:', err.cause?.code || err.message, base());
    res.status(502).json({ message: 'Partner data unavailable' });
  }
});

module.exports = router;