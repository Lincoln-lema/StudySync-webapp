const express = require('express');
const router = express.Router();
const pool = require('../db');


router.get('/', async (req, res) => {
  try {
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
