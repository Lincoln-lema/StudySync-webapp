// Week 13: the ONE place that knows the shape of SettleIn's property-list API.
//
// SettleIn's deprecation notice (9 Nov 2026) changes only the list:
//   v1  GET /api/v1/properties   -> [ ... ]
//   v2  GET /api/v2/properties   -> { data: [ ... ], count: N }
// Item fields, IDs, filters, key, detail responses (including
// /api/v1/properties/{id}/study-amenities) and writes keep their current behaviour,
// so the study-amenities and booking calls do not change.
//
// Each version has its own parse(), so the rest of the app always receives the same
// thing: an array of property objects. A parser that sees the wrong shape throws,
// so a mismatch fails loudly instead of quietly returning an empty list.
const versions = {
  v1: {
    path: '/api/v1/properties',
    parse: (body) => {
      if (!Array.isArray(body)) throw new Error('unexpected v1 shape');
      return body;
    },
  },
  v2: {
    path: '/api/v2/properties',
    parse: (body) => {
      if (!body || !Array.isArray(body.data)) throw new Error('unexpected v2 shape');
      return body.data;
    },
  },
};

// Which version to call comes from .env (PARTNER_VERSION=v1 or v2). v1 is the default,
// so migrating or rolling back is a one-word change and a restart.
function listVersion() {
  const name = process.env.PARTNER_VERSION || 'v1';
  const ver = versions[name];
  if (!ver) throw new Error(`unknown PARTNER_VERSION "${name}" (use v1 or v2)`);
  return ver;
}

module.exports = { versions, listVersion };
