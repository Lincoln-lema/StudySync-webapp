import { useState } from 'react';
import { createTask, updateTaskStatus, deleteTask, newId } from '../api';

const field = 'px-3 py-2 rounded border border-slate-300 text-sm';

const statusColor = {
  done: 'bg-sync-green/10 text-sync-green',
  late: 'bg-danger-crimson/10 text-danger-crimson',
  pending: 'bg-warning-amber/10 text-warning-amber',
};

function Group({ live, reload, showToast, currentUser }) {
  const { members, tasks } = live;
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const nameOf = (id) => (members.find((m) => m.id === id) || {}).name || id;
  const chosenOwner = owner || (currentUser ? currentUser.id : '') || (members[0] ? members[0].id : '');
  const groupName = (members.find((m) => m.group_name) || {}).group_name || 'Your group';
  const sorted = [...tasks].sort((a, b) => (a.due || '').localeCompare(b.due || ''));

  async function handleAddTask(e) {
    e.preventDefault();
    setError('');
    if (!title.trim() || !due) { setError('Enter a title and a due date.'); return; }
    if (!chosenOwner) { setError('Add a member first (Members page), then assign the task.'); return; }
    setBusy(true);
    try {
      await createTask({ id: newId('t'), title: title.trim(), owner: chosenOwner, due });
      setTitle('');
      setOwner('');
      setDue('');
      setShowForm(false);
      await reload();
      showToast('Task added');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(t) {
    try {
      await updateTaskStatus(t.id, t.status === 'done' ? 'pending' : 'done');
      await reload();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function remove(t) {
    if (!window.confirm(`Remove task "${t.title}"?`)) return;
    try {
      await deleteTask(t.id);
      await reload();
      showToast('Task removed');
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Group View</h2>
          <p className="text-sm text-slate-500 mt-1">{groupName} · Task Splitter</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-light"
        >
          + Add Task
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Split New Task</div>
          <form onSubmit={handleAddTask} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-slate-500 mb-1">Task Title</label>
              <input
                type="text"
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Data Analysis"
                className={field + ' w-full'}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Assign To</label>
              <select value={chosenOwner} onChange={(e) => setOwner(e.target.value)} className={field}>
                {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Due Date</label>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} />
            </div>
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">
              {busy ? 'Adding...' : 'Add'}
            </button>
          </form>
          {error && (
            <div className="mt-3 rounded-lg border border-danger-crimson/30 bg-danger-crimson/10 p-3 text-sm text-danger-crimson">{error}</div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Assigned Tasks</div>
        {sorted.length === 0 && <p className="text-sm text-slate-500">No tasks yet. Use "+ Add Task" to create one.</p>}
        {sorted.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div>
              <div className="text-sm font-medium text-slate-800">{t.title}</div>
              <div className="text-xs text-slate-500">{nameOf(t.owner)} · due {t.due || 'no date'}</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleStatus(t)}
                title="Click to toggle done / pending"
                className={'text-xs font-semibold px-3 py-1 rounded-full capitalize ' + statusColor[t.status]}
              >
                {t.status}
              </button>
              <button onClick={() => remove(t)} className="text-xs text-danger-crimson font-semibold">Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Work Distribution</div>
        {members.length === 0 && <p className="text-sm text-slate-500">Add members to see how work is split.</p>}
        {members.map((m) => {
          const count = tasks.filter((t) => t.owner === m.id).length;
          const max = Math.max(1, ...members.map((mm) => tasks.filter((t) => t.owner === mm.id).length));
          return (
            <div key={m.id} className="flex items-center gap-3 mb-2">
              <span className="text-sm text-slate-700 w-20 truncate">{m.name}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-light rounded-full" style={{ width: (count / max) * 100 + '%' }} />
              </div>
              <span className="text-xs text-slate-500 w-16 text-right">{count} {count === 1 ? 'task' : 'tasks'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Group;