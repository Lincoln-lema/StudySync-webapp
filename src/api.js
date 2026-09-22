const API_BASE = 'http://localhost:5000/api';

async function getJSON(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
}

function normalizeMembers(rows) {
  return rows.map(({ id, name, initials, reliability }) => ({
    id,
    name,
    initials,
    reliability,
  }));
}

function normalizeTasks(rows) {
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    owner: t.assigned_to,
    status: t.status,
    due: (t.deadline || '').replace('T', ' ').slice(0, 16),
  }));
}

export async function fetchMembers() {
  return getJSON('/members').then(normalizeMembers);
}

export async function fetchTasks() {
  return getJSON('/tasks').then(normalizeTasks);
}