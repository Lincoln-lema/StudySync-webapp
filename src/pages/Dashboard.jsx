function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Dashboard({ live, currentUser, setPage }) {
  const { members, tasks, loading, error } = live;
  const nameOf = (id) => (members.find((m) => m.id === id) || {}).name || id;
  const groupName = (members.find((m) => m.group_name) || {}).group_name || 'StudySync';

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const late = tasks.filter((t) => t.status === 'late').length;
  const pending = tasks.filter((t) => t.status === 'pending').length;

  const upcoming = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => (a.due || '').localeCompare(b.due || ''));
  const nextDue = upcoming.length ? upcoming[0].due : '';

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {greeting()}{currentUser ? `, ${currentUser.name}` : ''}.
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {groupName} · {members.length} members{nextDue ? ` · Next due ${nextDue}` : ''}
          </p>
          <span
            className={
              'inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ' +
              (loading ? 'bg-slate-100 text-slate-500' : error ? 'bg-warning-amber/10 text-warning-amber' : 'bg-sync-green/10 text-sync-green')
            }
          >
            {loading ? 'Connecting to database…' : error ? '● Offline — cannot reach the server' : '● Connected to MySQL'}
          </span>
        </div>
        <button
          onClick={() => setPage('group')}
          className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Group →
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-3xl font-bold text-primary">{total}</div>
          <div className="text-xs text-slate-500 uppercase mt-1">Total Tasks</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-3xl font-bold text-sync-green">{done}</div>
          <div className="text-xs text-slate-500 uppercase mt-1">Done</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-3xl font-bold text-danger-crimson">{late}</div>
          <div className="text-xs text-slate-500 uppercase mt-1">Late</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-3xl font-bold text-warning-amber">{pending}</div>
          <div className="text-xs text-slate-500 uppercase mt-1">Pending</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase">Team Members</div>
            <button onClick={() => setPage('members')} className="text-xs font-semibold text-primary">Manage →</button>
          </div>
          {members.length === 0 && !loading && (
            <p className="text-sm text-slate-500">No members yet. Add your first member on the Members page.</p>
          )}
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-white text-xs font-bold">
                  {m.initials}
                </div>
                <span className="text-sm font-medium text-slate-800">{m.name}</span>
              </div>
              <span
                className={
                  'text-xs font-semibold px-3 py-1 rounded-full ' +
                  (m.reliability > 70
                    ? 'bg-sync-green/10 text-sync-green'
                    : m.reliability >= 40
                    ? 'bg-warning-amber/10 text-warning-amber'
                    : 'bg-danger-crimson/10 text-danger-crimson')
                }
              >
                {m.reliability}%
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Upcoming Tasks</div>
          {upcoming.length === 0 && <p className="text-sm text-slate-500">Nothing pending 🎉</p>}
          {upcoming.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <div className="text-sm font-medium text-slate-800">{t.title}</div>
                <div className="text-xs text-slate-500">{nameOf(t.owner)} · due {t.due || 'no date'}</div>
              </div>
              <span
                className={
                  'text-xs font-semibold px-2 py-1 rounded-full capitalize ' +
                  (t.status === 'late' ? 'bg-danger-crimson/10 text-danger-crimson' : 'bg-warning-amber/10 text-warning-amber')
                }
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;