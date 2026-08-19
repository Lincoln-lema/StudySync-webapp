// Maps activity level (0-4) to a background color class.
function cellColor(value) {
  if (value === 0) return 'bg-slate-100';
  if (value === 1) return 'bg-sync-green/25';
  if (value === 2) return 'bg-sync-green/55';
  if (value === 3) return 'bg-sync-green';
  return 'bg-danger-crimson'; // value === 4, last-minute rush
}

function Heatmap({ data }) {
  const { heatmap } = data;
  const members = ['Anna', 'Ben', 'Clara'];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Effort Heatmap</h2>
        <p className="text-sm text-slate-500 mt-1">Daily activity · May 1-15, 2026</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 overflow-x-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Member Activity</div>
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-16"></th>
              {heatmap.days.map((day) => (
                <th key={day} className="text-[10px] font-normal text-slate-400 w-6">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member}>
                <td className="text-xs font-medium text-slate-700 pr-2">{member}</td>
                {heatmap[member].map((value, i) => (
                  <td key={i}>
                    <div title={`Day ${heatmap.days[i]}: level ${value}`} className={'w-6 h-6 rounded ' + cellColor(value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100" />No activity</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-sync-green/55" />Moderate</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-sync-green" />Heavy</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-danger-crimson" />Last-minute rush</div>
        </div>
      </div>

      {/* Summary: total effort score and rush-day count per member */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Interpretation</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {members.map((member) => {
            const values = heatmap[member];
            const total = values.reduce((sum, v) => sum + v, 0);
            const rushDays = values.filter((v) => v === 4).length;
            return (
              <div key={member} className="border border-slate-100 rounded-lg p-3">
                <div className="text-sm font-semibold text-slate-800 mb-2">{member}</div>
                <div className="text-xs text-slate-500">Effort score: {total}</div>
                <div className="text-xs text-slate-500">Last-minute rushes: {rushDays}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Heatmap;
