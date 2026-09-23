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
    const { status, groupId, assignee } = req.query;

    if (status && !['pending', 'done', 'late'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value. Must be pending, done, or late' });
    }

    let query = `SELECT t.id, t.title, t.assigned_to, t.status, t.deadline
                 FROM tasks t JOIN members m ON t.assigned_to = m.id WHERE 1=1`;
    const params = [];

    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (groupId) { query += ' AND m.group_id = ?'; params.push(groupId); }
    if (assignee) { query += ' AND t.assigned_to = ?'; params.push(assignee); }

    const [rows] = await pool.query(query, params);
    res.json(rows.map((r) => ({ ...r, deadline: toISO(r.deadline) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

module.exports = router;