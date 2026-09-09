const express = require('express');
const router = express.Router();
const pool = require('../db');


router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.name, m.initials, m.reliability, m.group_id, g.name AS group_name
       FROM members m
       LEFT JOIN groups_table g ON m.group_id = g.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

module.exports = router;
