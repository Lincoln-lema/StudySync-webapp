const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/members
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

// POST /api/members — create a new member
router.post('/', async (req, res) => {
  try {
    const { id, name, initials, reliability, group_id } = req.body;
    await pool.query(
      'INSERT INTO members (id, name, initials, reliability, group_id) VALUES (?, ?, ?, ?, ?)',
      [id, name, initials, reliability ?? 100, group_id ?? null]
    );
    res.status(201).json({ message: 'Member created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// PUT /api/members/:id — update a member's details
router.put('/:id', async (req, res) => {
  try {
    const { name, initials, reliability, group_id } = req.body;
    const [result] = await pool.query(
      'UPDATE members SET name = ?, initials = ?, reliability = ?, group_id = ? WHERE id = ?',
      [name, initials, reliability, group_id, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

module.exports = router;