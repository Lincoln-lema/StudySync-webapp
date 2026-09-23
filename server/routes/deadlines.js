const express = require('express');
const router = express.Router();
const pool = require('../db');

const toISO = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().replace(/\.\d{3}Z$/, 'Z');
  return val.length === 10 ? `${val}T00:00:00Z` : val.replace(' ', 'T') + 'Z';
};
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;


    if (from || to) {
      if (!from || !to || isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
        return res.status(400).json({
          error: 'Invalid date format. Use ISO 8601 format (e.g., 2026-09-01T00:00:00Z)',
        });
      }
      const [rows] = await pool.query(
        `SELECT id, title, assigned_to, status, deadline FROM tasks WHERE deadline BETWEEN ? AND ?`,
        [from, to]
      );
      return res.json(rows.map(shape));
    }

    const [rows] = await pool.query(
      `SELECT id, title, assigned_to, status, deadline
       FROM tasks
       WHERE deadline IS NOT NULL
       ORDER BY deadline ASC`
    );
    res.json(rows.map(shape));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

module.exports = router;