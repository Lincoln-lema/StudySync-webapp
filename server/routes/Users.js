const express = require('express');
const router = express.Router();
const pool = require('../db');

const toISO = (val) => (val ? new Date(val).toISOString().replace(/\.\d{3}Z$/, 'Z') : null);

router.get('/:userId/reliability-score', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id AS user_id, name AS user_name, reliability AS reliability_score FROM members WHERE id = ?',
      [req.params.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reliability score' });
  }
});

router.get('/:userId/activity', async (req, res) => {
  try {
    const [member] = await pool.query('SELECT id FROM members WHERE id = ?', [req.params.userId]);
    if (member.length === 0) return res.status(404).json({ error: 'User not found' });

    const [rows] = await pool.query(
      'SELECT member_id, activity_date, minutes_studied FROM activity_log WHERE member_id = ? ORDER BY activity_date ASC',
      [req.params.userId]
    );
    res.json(rows.map((r) => ({ ...r, activity_date: toISO(r.activity_date) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
});

module.exports = router;
