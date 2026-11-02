const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { fetchPartner, normalizeAmenities } = require('./properties').helpers;

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, server-local
const len = (s) => [...s].length;

function isRealDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

// Does [startMin, endMin) overlap the partner's quiet hours? Handles windows that wrap midnight.
function overlapsQuiet(startMin, endMin, quiet) {
  if (!quiet || !quiet.policy_enforced) return false;
  const qs = String(quiet.starts_at || '').slice(0, 5);
  const qe = String(quiet.ends_at || '').slice(0, 5);
  if (!TIME_RE.test(qs) || !TIME_RE.test(qe)) return false;
  const a = toMin(qs);
  const b = toMin(qe);
  if (a < b) return startMin < b && endMin > a;
  return endMin > a || startMin < b; // wraps midnight, e.g. 22:00-06:00
}

const SELECT_COLS = `id, property_id, property_name, booked_by,
  DATE_FORMAT(session_date, '%Y-%m-%d') AS session_date,
  TIME_FORMAT(start_time, '%H:%i') AS start_time,
  TIME_FORMAT(end_time, '%H:%i') AS end_time,
  guests, note, status`;

// GET /api/bookings?memberId=&propertyId=&status=confirmed|cancelled|all
router.get('/', async (req, res) => {
  const { memberId, propertyId } = req.query;
  const status = req.query.status || 'confirmed';
  if (!['confirmed', 'cancelled', 'all'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: confirmed, cancelled, all' });
  }
  const conditions = [];
  const params = [];
  if (status !== 'all') { conditions.push('status = ?'); params.push(status); }
  if (memberId) { conditions.push('booked_by = ?'); params.push(memberId); }
  if (propertyId) { conditions.push('property_id = ?'); params.push(propertyId); }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  try {
    const [rows] = await pool.query(
      `SELECT ${SELECT_COLS} FROM study_bookings${where} ORDER BY session_date, start_time`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings
router.post('/', async (req, res) => {
  const body = req.body || {};
  const { property_id, booked_by, session_date, start_time, end_time, note } = body;
  const guests = body.guests === undefined ? 1 : body.guests;

  if (!property_id || !booked_by || !session_date || !start_time || !end_time) {
    return res.status(400).json({ error: 'property_id, booked_by, session_date, start_time and end_time are required' });
  }
  if ([property_id, booked_by, session_date, start_time, end_time].some((v) => typeof v !== 'string')) {
    return res.status(400).json({ error: 'property_id, booked_by, session_date, start_time and end_time must be strings' });
  }
  if (!isRealDate(session_date)) {
    return res.status(400).json({ error: 'session_date must be a real date in YYYY-MM-DD format' });
  }
  if (!TIME_RE.test(start_time) || !TIME_RE.test(end_time)) {
    return res.status(400).json({ error: 'start_time and end_time must be HH:MM (24-hour)' });
  }
  if (toMin(end_time) <= toMin(start_time)) {
    return res.status(400).json({ error: 'end_time must be after start_time' });
  }
  if (session_date < today()) {
    return res.status(400).json({ error: 'session_date cannot be in the past' });
  }
  if (!Number.isInteger(guests) || guests < 1) {
    return res.status(400).json({ error: 'guests must be a whole number of at least 1' });
  }
  if (note !== undefined && (typeof note !== 'string' || len(note) > 200)) {
    return res.status(400).json({ error: 'note must be a string of at most 200 characters' });
  }
  if (len(booked_by) > 10) return res.status(400).json({ error: 'booked_by must be at most 10 characters' });
  if (len(property_id) > 40) return res.status(400).json({ error: 'property_id must be at most 40 characters' });

  try {
    const [memberRows] = await pool.query('SELECT id FROM members WHERE id = ?', [booked_by]);
    if (memberRows.length === 0) {
      return res.status(400).json({ error: `booked_by '${booked_by}' does not match an existing member` });
    }

    // Ask SettleIn about the property: it must exist, and its rules apply to the booking.
    let partner;
    try {
      partner = await fetchPartner(`/api/v1/properties/${encodeURIComponent(property_id)}/study-amenities`);
    } catch (err) {
      console.error('Booking: SettleIn call failed:', (err.cause && err.cause.code) || err.message);
      return res.status(502).json({ error: 'Partner data unavailable, cannot confirm this property right now' });
    }
    if (partner.status === 404) return res.status(404).json({ error: 'Property not found' });
    if (!partner.ok) {
      console.error('Booking: SettleIn returned', partner.status);
      return res.status(502).json({ error: 'Partner data unavailable, cannot confirm this property right now' });
    }
    const a = normalizeAmenities(partner.body, property_id);
    if (!a) return res.status(502).json({ error: 'Partner data unavailable, cannot confirm this property right now' });

    const maxGuests = a.max_study_guests == null ? null : Number(a.max_study_guests);
    if (Number.isFinite(maxGuests) && guests > maxGuests) {
      return res.status(400).json({ error: `guests exceeds this property's limit of ${maxGuests}` });
    }
    if (overlapsQuiet(toMin(start_time), toMin(end_time), a.quiet_hours)) {
      return res.status(400).json({
        error: `Session overlaps this property's quiet hours (${a.quiet_hours.starts_at} to ${a.quiet_hours.ends_at})`,
      });
    }

    const [clash] = await pool.query(
      `SELECT id FROM study_bookings
       WHERE property_id = ? AND session_date = ? AND status = 'confirmed'
         AND start_time < ? AND end_time > ?`,
      [property_id, session_date, end_time, start_time]
    );
    if (clash.length > 0) {
      return res.status(409).json({ error: 'That time slot is already booked for this property' });
    }

    const id = `b${crypto.randomBytes(4).toString('hex')}`;
    const propertyName = a.name ? [...a.name].slice(0, 150).join('') : null;
    await pool.query(
      `INSERT INTO study_bookings
        (id, property_id, property_name, booked_by, session_date, start_time, end_time, guests, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, property_id, propertyName, booked_by, session_date, start_time, end_time, guests, note ?? null]
    );
    res.status(201).json({
      id, property_id, property_name: propertyName, booked_by, session_date,
      start_time, end_time, guests, note: note ?? null, status: 'confirmed',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// DELETE /api/bookings/:id  (cancels; the row is kept with status 'cancelled')
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE study_bookings SET status = 'cancelled' WHERE id = ?",
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Booking not found' });
    res.json({ id: req.params.id, status: 'cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;