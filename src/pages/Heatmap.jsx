function level(minutes) {
  if (!minutes) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

function cellColor(value) {
  if (value === 0) return 'bg-slate-100';
  if (value === 1) return 'bg-sync-green/25';
  if (value === 2) return 'bg-sync-green/55';
  if (value === 3) return 'bg-sync-green';
  return 'bg-danger-crimson';
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
}

function Heatmap({ live }) {
  const { members, activity } = live;

  // 15 days ending on the latest day that has any logged activity (or today if none).
  const dates = activity.map((a) => a.date).filter(Boolean).sort();
  const end = dates.length ? dates[dates.length - 1] : new Date().toLocaleDateString('en-CA');
  const days = Array.from({ length: 15 }, (_, i) => addDays(end, i - 14));

  const minutes = {};
  activity.forEach((a) => {
    minutes[a.member_id] = minutes[a.member_id] || {};
    minutes[a.member_id][a.date] = (minutes[a.member_id][a.date] || 0) + a.minutes;
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Effort Heatmap</h2>
        <p className="text-sm text-slate-500 mt-1">Study minutes per day · {days[0]} to {days[14]}</p>
      </div>

      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-sm text-slate-500">Add members to see their activity.</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 overflow-x-auto">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Member Activity</div>
            <table className="border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="w-20"></th>
                  {days.map((day) => (
                    <th key={day} className="text-[10px] font-normal text-slate-400 w-6">{Number(day.slice(8, 10))}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="text-xs font-medium text-slate-700 pr-2">{m.name}</td>
                    {days.map((day) => {
                      const mins = (minutes[m.id] || {})[day] || 0;
                      return (
                        <td key={day}>
                          <div title={`${day}: ${mins} min`} className={'w-6 h-6 rounded ' + cellColor(level(mins))} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100" />No activity</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-sync-green/25" />Under 30 min</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-sync-green/55" />30-59 min</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-sync-green" />1-2 hours</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-danger-crimson" />2 hours or more</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Summary</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {members.map((m) => {
                const values = days.map((day) => (minutes[m.id] || {})[day] || 0);
                const total = values.reduce((sum, v) => sum + v, 0);
                const longDays = values.filter((v) => v >= 120).length;
                return (
                  <div key={m.id} className="border border-slate-100 rounded-lg p-3">
                    <div className="text-sm font-semibold text-slate-800 mb-2">{m.name}</div>
                    <div className="text-xs text-slate-500">Minutes studied: {total}</div>
                    <div className="text-xs text-slate-500">Days with 2h or more: {longDays}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Heatmap;