const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;

    // If both from and to are provided, treat as calendar-events range query
    if (from || to) {
      if (!from || !to) {
        return res.status(400).json({ error: 'Both from and to are required for date range query' });
      }

      // Validate date formats
      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use ISO 8601 format (e.g., 2026-09-01)' });
      }

      const [rows] = await pool.query(
        `SELECT id, title, assigned_to, status, deadline
         FROM tasks
         WHERE deadline IS NOT NULL AND deadline BETWEEN ? AND ?
         ORDER BY deadline ASC`,
        [from, to]
      );
      return res.json(rows);
    }

    // Otherwise, return all deadlines sorted
    const [rows] = await pool.query(
      `SELECT id, title, assigned_to, status, deadline
       FROM tasks
       WHERE deadline IS NOT NULL
       ORDER BY deadline ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

module.exports = router;
