const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { member } = req.query;
    let query = 'SELECT member_id, activity_date, minutes_studied FROM activity_log';
    const params = [];

    if (member) {
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
