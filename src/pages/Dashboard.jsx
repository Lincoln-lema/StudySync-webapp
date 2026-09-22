import { useEffect, useState } from 'react';
import { fetchMembers, fetchTasks } from '../api';

function Dashboard({ data, setPage }) {
  const { group, tasks } = data;

  // Live data from the Express API. Falls back to local data when the
  // backend isn't running so the app still works offline.
  const [live, setLive] = useState(null);
  const [liveError, setLiveError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMembers(), fetchTasks()])
      .then(([members, rows]) => {
        if (cancelled) return;
        setLive({ members, tasks: rows });
      })
      .catch((err) => {
        if (!cancelled) setLiveError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const members = live ? live.members : group.members;
  const allTasks = live ? live.tasks : tasks;

  // Counts for the stat cards - same filter() logic as the original.
  const total = allTasks.length;
  const done = allTasks.filter((t) => t.status === 'done').length;
  const late = allTasks.filter((t) => t.status === 'late').length;
  const pending = allTasks.filter((t) => t.status === 'pending').length;

  // Upcoming = not done, sorted soonest first.
  const upcoming = allTasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => new Date(a.due) - new Date(b.due));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Good morning, Anna.</h2>
          <p className="text-sm text-slate-500 mt-1">
            {group.name} · {members.length} members · Due {group.dueDate}
          </p>
          <span
            className={
              'inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ' +
              (live
                ? 'bg-sync-green/10 text-sync-green'
                : liveError
                ? 'bg-warning-amber/10 text-warning-amber'
                : 'bg-slate-100 text-slate-500')
            }
          >
            {loading ? 'Connecting to database…' : live ? '● Connected to MySQL' : '● Offline — showing local data'}
          </span>
        </div>
        <button
          onClick={() => setPage('group')}
          className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Group →
        </button>
      </div>

      {/* Stat cards */}
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
        {/* Member list */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Team Members</div>
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-white text-xs font-bold">
                  {m.initials}
                </div>
                <span className="text-sm font-medium text-slate-800">{m.name}</span>
              </div>
              {/* reliability badge: green >70, amber 40-70, red <40 */}
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

        {/* Upcoming tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Upcoming Tasks</div>
          {upcoming.length === 0 && <p className="text-sm text-slate-500">Nothing pending 🎉</p>}
          {upcoming.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <div className="text-sm font-medium text-slate-800">{t.title}</div>
                <div className="text-xs text-slate-500">{t.owner} · due {t.due}</div>
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