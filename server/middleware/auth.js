// Week 9: API key authentication.
// Every request must carry a valid X-API-Key header, or we return 401
// before any route handler runs. Keys come from API_KEYS in .env,
// comma-separated, one per consumer. Log the count at startup, never values.

const VALID_KEYS = (process.env.API_KEYS || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

function requireApiKey(req, res, next) {
  const key = req.get('X-API-Key');
  if (!key || !VALID_KEYS.includes(key)) {
    return res.status(401).json({ message: 'Missing or invalid API key' });
  }
  req.apiKey = key;
  next();
}

// For startup logging only — count, never values.
function keyCount() {
  return VALID_KEYS.length;
}

module.exports = { requireApiKey, keyCount };