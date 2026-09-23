const express = require('express');
const router = express.Router();
const pool = require('../db');

const VALID_STATUSES = ['pending', 'done', 'late'];

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT id, title, assigned_to, status, deadline FROM tasks';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks — create a new task
router.post('/', async (req, res) => {
  const { id, title, assigned_to, status, deadline } = req.body;

  // --- Validation first: required fields present ---
  if (!id || !title || !assigned_to || !deadline) {
    return res.status(400).json({ error: 'id, title, assigned_to, and deadline are required' });
  }

  // --- Type checks ---
  if (typeof id !== 'string' || typeof title !== 'string' || typeof assigned_to !== 'string') {
    return res.status(400).json({ error: 'id, title, and assigned_to must be strings' });
  }
  if (isNaN(Date.parse(deadline))) {
    return res.status(400).json({ error: 'deadline must be a valid date' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  // --- Usable-value checks ---
  if (id.trim() === '' || title.trim() === '' || assigned_to.trim() === '') {
    return res.status(400).json({ error: 'id, title, and assigned_to cannot be empty' });
  }

  try {
    // Check the assignee actually exists before creating the task
    const [memberRows] = await pool.query('SELECT id FROM members WHERE id = ?', [assigned_to]);
    if (memberRows.length === 0) {
      return res.status(400).json({ error: `assigned_to '${assigned_to}' does not match an existing member` });
    }

    await pool.query(
      'INSERT INTO tasks (id, title, assigned_to, status, deadline) VALUES (?, ?, ?, ?, ?)',
      [id, title, assigned_to, status ?? 'pending', deadline]
    );
    res.status(201).json({ id, title, assigned_to, status: status ?? 'pending', deadline });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Task with id '${id}' already exists` });
    }
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id — update one or more fields on a task
router.patch('/:id', async (req, res) => {
  const { title, assigned_to, status, deadline } = req.body;

  // --- Validation first: at least one field must be provided ---
  if (title === undefined && assigned_to === undefined && status === undefined && deadline === undefined) {
    return res.status(400).json({ error: 'At least one field (title, assigned_to, status, deadline) must be provided' });
  }

  // --- Type / value checks on whatever WAS provided ---
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (assigned_to !== undefined && (typeof assigned_to !== 'string' || assigned_to.trim() === '')) {
    return res.status(400).json({ error: 'assigned_to must be a non-empty string' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  if (deadline !== undefined && isNaN(Date.parse(deadline))) {
    return res.status(400).json({ error: 'deadline must be a valid date' });
  }

  try {
    // Check the task exists before doing anything else
    const [existingRows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const existing = existingRows[0];

    // If assigned_to is being changed, confirm the new member exists
    if (assigned_to !== undefined) {
      const [memberRows] = await pool.query('SELECT id FROM members WHERE id = ?', [assigned_to]);
      if (memberRows.length === 0) {
        return res.status(400).json({ error: `assigned_to '${assigned_to}' does not match an existing member` });
      }
    }

    // Build the absolute next state: provided fields override, everything else stays as-is
    const next = {
      title: title ?? existing.title,
      assigned_to: assigned_to ?? existing.assigned_to,
      status: status ?? existing.status,
      deadline: deadline ?? existing.deadline,
    };

    await pool.query(
      'UPDATE tasks SET title = ?, assigned_to = ?, status = ?, deadline = ? WHERE id = ?',
      [next.title, next.assigned_to, next.status, next.deadline, req.params.id]
    );

    res.json({ id: req.params.id, ...next });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id — remove a task
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;