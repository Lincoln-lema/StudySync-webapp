const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = API_ORIGIN + '/api';
const API_KEY = import.meta.env.VITE_API_KEY;

export async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'X-API-Key': API_KEY,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// DATE / DATETIME columns arrive as timestamps shifted by the server's timezone.
// Reading them back in local time gives the calendar day that was stored
// (correct when the browser and the server are in the same timezone).
export function localDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  return isNaN(d) ? String(value).slice(0, 10) : d.toLocaleDateString('en-CA');
}

export function newId(prefix) {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Member ids are short strings (max 10 chars): a slug of the name, made unique.
export function makeMemberId(name, existingIds) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'member';
  let id = base;
  let n = 2;
  while (existingIds.includes(id)) { id = base + n; n += 1; }
  return id;
}

const normalizeMember = (m) => ({
  id: m.id,
  name: m.name,
  initials: m.initials,
  reliability: m.reliability,
  group_id: m.group_id ?? null,
  group_name: m.group_name ?? null,
});

const normalizeTask = (t) => ({
  id: t.id,
  title: t.title,
  owner: t.assigned_to, // member id
  status: t.status,
  due: localDate(t.deadline), // YYYY-MM-DD
});

export const fetchMembers = () => request('/members').then((rows) => rows.map(normalizeMember));
export const createMember = (m) => request('/members', { method: 'POST', body: JSON.stringify(m) });
export const updateMember = (id, m) => request(`/members/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(m) });
export const deleteMember = (id) => request(`/members/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const fetchTasks = () => request('/tasks').then((rows) => rows.map(normalizeTask));
export const createTask = ({ id, title, owner, due }) =>
  request('/tasks', { method: 'POST', body: JSON.stringify({ id, title, assigned_to: owner, deadline: `${due}T23:59:00` }) });
export const updateTaskStatus = (id, status) =>
  request(`/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deleteTask = (id) => request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const fetchActivity = () =>
  request('/activity').then((rows) =>
    rows.map((r) => ({ member_id: r.member_id, date: localDate(r.activity_date), minutes: r.minutes_studied }))
  );