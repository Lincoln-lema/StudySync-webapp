// Creates the study_bookings table (safe to run more than once).
const fs = require('fs');
const path = require('path');
const db = require('../db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'bookings_schema.sql'), 'utf8');
  await db.query(sql);
  console.log('study_bookings table ready');
})()
  .catch((e) => { console.error('Migration failed:', e.message); process.exitCode = 1; })
  .finally(() => db.end());