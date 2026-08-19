
const EVENTS = {
  10: 'Lit review due',
  12: 'Prototype due',
  20: 'Report due',
  22: 'Slides due',
  25: 'Final submission',
};

function Calendar({ data }) {
  const firstWeekday = new Date(2026, 4, 1).getDay(); // May = month 4
  const daysInMay = 31;

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMay; d++) cells.push(d);

  const priorities = data.tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => new Date(a.due) - new Date(b.due));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Merged Calendar</h2>
        <p className="text-sm text-slate-500 mt-1">May 2026</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-xs font-semibold text-slate-400 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, i) => (
            <div key={i} className={'min-h-[60px] rounded-lg border p-1 text-xs ' + (day ? 'border-slate-100' : 'border-transparent')}>
              {day && (
                <>
                  <div className="font-semibold text-slate-700">{day}</div>
                  {EVENTS[day] && (
                    <div className="text-[10px] bg-primary-light/10 text-primary-light rounded px-1 mt-1 truncate">
                      {EVENTS[day]}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">This Week's Priorities</div>
        {priorities.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-2">
            <div className={'w-2 h-2 rounded-full ' + (t.status === 'late' ? 'bg-danger-crimson' : 'bg-warning-amber')} />
            <div>
              <div className="text-sm font-medium text-slate-800">{t.title}</div>
              <div className="text-xs text-slate-500">{t.owner} · due {t.due}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar;
