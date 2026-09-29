const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { member } = req.query;
    let query = 'SELECT member_id, activity_date, minutes_studied FROM activity_log';
    const params = [];

    if (member) {
      // Validate member parameter: should be alphanumeric (member IDs are simple like 'anna', 'ben')
      if (!/^[a-zA-Z0-9]+$/.test(member)) {
        return res.status(400).json({ error: 'Invalid member ID format' });
      }
      query += ' WHERE member_id = ?';
      params.push(member);
    }

    query += ' ORDER BY activity_date ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
});

module.exports = router;
