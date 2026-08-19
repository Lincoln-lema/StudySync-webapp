import { useState } from 'react';

function Group({ data, setData, showToast }) {
  const { group, tasks } = data;
  const [showForm, setShowForm] = useState(false);

  // Controlled form fields for adding a new task.
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('Anna');
  const [due, setDue] = useState('');

  function handleAddTask(e) {
    e.preventDefault();
    if (!title.trim() || !due.trim()) return;

    const newTask = {
      id: 't' + Date.now(),
      title: title.trim(),
      owner,
      due: due.trim(),
      status: 'pending',
    };

    setData({ ...data, tasks: [...tasks, newTask] });
    setTitle('');
    setOwner('Anna');
    setDue('');
    setShowForm(false);
    showToast('Task added');
  }

  function toggleStatus(id) {
    setData({
      ...data,
      tasks: tasks.map((t) =>
        t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t
      ),
    });
  }

  const statusColor = {
    done: 'bg-sync-green/10 text-sync-green',
    late: 'bg-danger-crimson/10 text-danger-crimson',
    pending: 'bg-warning-amber/10 text-warning-amber',
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Group View</h2>
          <p className="text-sm text-slate-500 mt-1">{group.name} · Task Splitter</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-light"
        >
          + Add Task
        </button>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Assigned Tasks</div>
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div>
              <div className="text-sm font-medium text-slate-800">{t.title}</div>
              <div className="text-xs text-slate-500">{t.owner} · due {t.due}</div>
            </div>
            <button
              onClick={() => toggleStatus(t.id)}
              className={'text-xs font-semibold px-3 py-1 rounded-full capitalize ' + statusColor[t.status]}
            >
              {t.status}
            </button>
          </div>
        ))}
      </div>

      {/* Add task form - controlled inputs, same pattern as your course notes */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Split New Task</div>
          <form onSubmit={handleAddTask} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-slate-500 mb-1">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Data Analysis"
                className="w-full px-3 py-2 rounded border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Assign To</label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="px-3 py-2 rounded border border-slate-300 text-sm"
              >
                <option>Anna</option>
                <option>Ben</option>
                <option>Clara</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Due Date</label>
              <input
                type="text"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                placeholder="2026-05-28"
                className="px-3 py-2 rounded border border-slate-300 text-sm"
              />
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
              Add
            </button>
          </form>
        </div>
      )}

      {/* Work distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Work Distribution</div>
        {group.members.map((m) => {
          const count = tasks.filter((t) => t.owner === m.name).length;
          const max = Math.max(1, ...group.members.map((mm) => tasks.filter((t) => t.owner === mm.name).length));
          return (
            <div key={m.id} className="flex items-center gap-3 mb-2">
              <span className="text-sm text-slate-700 w-14">{m.name}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-light rounded-full"
                  style={{ width: (count / max) * 100 + '%' }}
                />
              </div>
              <span className="text-xs text-slate-500 w-16 text-right">{count} tasks</span>
            </div>
          );
        })}
      </div>

      {/* Shared resources */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Shared Resources</div>
        <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
          <li>Shared Google Drive folder</li>
          <li>Overleaf project - final report</li>
          <li>Figma board - slide wireframes</li>
        </ul>
      </div>
    </div>
  );
}

export default Group;
