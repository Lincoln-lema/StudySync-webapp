import { useState } from 'react';

const todayStr = () => new Date().toLocaleDateString('en-CA');
const dot = { late: 'bg-danger-crimson', done: 'bg-sync-green', pending: 'bg-warning-amber' };

function Calendar({ live }) {
  const { tasks, members } = live;
  const nameOf = (id) => (members.find((m) => m.id === id) || {}).name || id;

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}-`;
  const byDay = {};
  tasks.forEach((t) => {
    if (t.due && t.due.startsWith(prefix)) {
      const d = Number(t.due.slice(8, 10));
      (byDay[d] = byDay[d] || []).push(t);
    }
  });

  function shift(n) {
    setView((v) => {
      const d = new Date(v.year, v.month + n, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const label = new Date(view.year, view.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const open = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => (a.due || '').localeCompare(b.due || ''));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Merged Calendar</h2>
          <p className="text-sm text-slate-500 mt-1">{label}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => shift(-1)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">‹</button>
          <button onClick={() => setView({ year: now.getFullYear(), month: now.getMonth() })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">Today</button>
          <button onClick={() => shift(1)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">›</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-xs font-semibold text-slate-400 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, i) => {
            const isToday = day && prefix + String(day).padStart(2, '0') === todayStr();
            const items = day ? byDay[day] || [] : [];
            return (
              <div
                key={i}
                className={
                  'min-h-[72px] rounded-lg border p-1 text-xs ' +
                  (day ? (isToday ? 'border-primary' : 'border-slate-100') : 'border-transparent')
                }
              >
                {day && (
                  <>
                    <div className={'font-semibold ' + (isToday ? 'text-primary' : 'text-slate-700')}>{day}</div>
                    {items.slice(0, 2).map((t) => (
                      <div key={t.id} title={`${t.title} · ${nameOf(t.owner)} · ${t.status}`} className="text-[10px] bg-primary-light/10 text-primary-light rounded px-1 mt-1 truncate">
                        {t.title}
                      </div>
                    ))}
                    {items.length > 2 && <div className="text-[10px] text-slate-400 mt-1">+{items.length - 2} more</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Open Tasks</div>
        {open.length === 0 && <p className="text-sm text-slate-500">Nothing open.</p>}
        {open.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-2">
            <div className={'w-2 h-2 rounded-full ' + (dot[t.status] || 'bg-slate-300')} />
            <div>
              <div className="text-sm font-medium text-slate-800">{t.title}</div>
              <div className="text-xs text-slate-500">{nameOf(t.owner)} · due {t.due || 'no date'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar;