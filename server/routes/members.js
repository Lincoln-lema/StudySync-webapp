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
  const { id, name, initials, reliability, group_id } = req.body;

  // --- Validation first: required fields present ---
  if (!id || !name || !initials) {
    return res.status(400).json({ error: 'id, name, and initials are required' });
  }

  // --- Type checks ---
  if (typeof id !== 'string' || typeof name !== 'string' || typeof initials !== 'string') {
    return res.status(400).json({ error: 'id, name, and initials must be strings' });
  }
  if (reliability !== undefined && typeof reliability !== 'number') {
    return res.status(400).json({ error: 'reliability must be a number' });
  }
  if (group_id !== undefined && group_id !== null && typeof group_id !== 'string') {
    return res.status(400).json({ error: 'group_id must be a string or null' });
  }

  // --- Usable-value checks ---
  if (id.trim() === '' || name.trim() === '' || initials.trim() === '') {
    return res.status(400).json({ error: 'id, name, and initials cannot be empty' });
  }
  if (reliability !== undefined && (reliability < 0 || reliability > 100)) {
    return res.status(400).json({ error: 'reliability must be between 0 and 100' });
  }

  // --- Nothing gets written until every check above passes ---
  try {
    await pool.query(
      'INSERT INTO members (id, name, initials, reliability, group_id) VALUES (?, ?, ?, ?, ?)',
      [id, name, initials, reliability ?? 100, group_id ?? null]
    );
    res.status(201).json({ id, name, initials, reliability: reliability ?? 100, group_id: group_id ?? null });
  } catch (err) {
    console.error(err);
    // Duplicate primary key is a client error (400), not a server error (500)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Member with id '${id}' already exists` });
    }
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// PUT /api/members/:id — update a member's details
router.put('/:id', async (req, res) => {
  const { name, initials, reliability, group_id } = req.body;

  // --- Validation first: required fields present ---
  if (!name || !initials) {
    return res.status(400).json({ error: 'name and initials are required' });
  }

  // --- Type checks ---
  if (typeof name !== 'string' || typeof initials !== 'string') {
    return res.status(400).json({ error: 'name and initials must be strings' });
  }
  if (reliability !== undefined && typeof reliability !== 'number') {
    return res.status(400).json({ error: 'reliability must be a number' });
  }
  if (group_id !== undefined && group_id !== null && typeof group_id !== 'string') {
    return res.status(400).json({ error: 'group_id must be a string or null' });
  }

  // --- Usable-value checks ---
  if (name.trim() === '' || initials.trim() === '') {
    return res.status(400).json({ error: 'name and initials cannot be empty' });
  }
  if (reliability !== undefined && (reliability < 0 || reliability > 100)) {
    return res.status(400).json({ error: 'reliability must be between 0 and 100' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE members SET name = ?, initials = ?, reliability = ?, group_id = ? WHERE id = ?',
      [name, initials, reliability ?? 100, group_id ?? null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ id: req.params.id, name, initials, reliability: reliability ?? 100, group_id: group_id ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// DELETE /api/members/:id — remove a member
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM members WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

module.exports = router;