// Week 13: v2 of the API, mounted at /v2.
//
// The one breaking change: GET /v2/tasks wraps the list as { data: [...], count: N }
// (v1 returns a bare array). Wrapping now means paging can be added later without
// another breaking change.
//
// Nothing else about tasks changes. Same fields, same ?status= and ?assignee=
// filters, same POST / PATCH / DELETE behaviour and error bodies. Only /tasks has
// a v2 so far; every other resource stays as it is.
const express = require('express');
const pool = require('./db');
const tasksV1 = require('./routes/tasks');

const tasks = express.Router();

// GET /v2/tasks: same query and filters as v1, new response shape.
tasks.get('/', async (req, res) => {
  try {
    const { status, assignee } = req.query;
    let query = 'SELECT id, title, assigned_to, status, deadline FROM tasks';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (assignee) {
      conditions.push('assigned_to = ?');
      params.push(assignee);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await pool.query(query, params);
    res.json({ data: rows, count: rows.length }); // v1: res.json(rows)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST, PATCH, DELETE are unchanged, so v2 reuses v1's handlers. (v1's own
// GET / never runs here, because the route above answers first.)
tasks.use(tasksV1);

const router = express.Router();
router.use('/tasks', tasks);

module.exports = router;
