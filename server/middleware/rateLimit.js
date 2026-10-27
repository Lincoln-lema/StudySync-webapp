// Week 9: In-memory rate limiter.
// Limits requests per API key within a rolling time window.
// Note: This is per-process memory. Restarting the server resets the counts.

function rateLimit({ windowMs, max }) {
  const hits = new Map(); // key -> { count, resetAt }

  return (req, res, next) => {
    // req.apiKey is set by requireApiKey. Fallback to IP for safety.
    const id = req.apiKey || req.ip;
    const now = Date.now();
    let entry = hits.get(id);

    // If no entry, or the window has expired, start a new window
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(id, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ 
        message: 'Too many requests', 
        retryAfter 
      });
    }

    next();
  };
}

module.exports = { rateLimit };