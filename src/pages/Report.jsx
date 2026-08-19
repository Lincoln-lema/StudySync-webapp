import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

// Chart.js needs its pieces "registered" once before any chart can
// render. Think of this like <script src="chart.js"> in your old HTML
// version, just done through imports instead of a <script> tag.
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function Report({ data, showToast }) {
  const { group, tasks } = data;
  const members = group.members.map((m) => m.name);

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const lateCount = tasks.filter((t) => t.status === 'late').length;

  const pieData = {
    labels: ['Done', 'Pending', 'Late'],
    datasets: [{
      data: [doneCount, pendingCount, lateCount],
      backgroundColor: ['#2ECC71', '#F39C12', '#E74C3C'],
    }],
  };

  const barData = {
    labels: members,
    datasets: [{
      label: 'Reliability %',
      data: group.members.map((m) => m.reliability),
      backgroundColor: '#2C5A8C',
    }],
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contribution Report</h2>
          <p className="text-sm text-slate-500 mt-1">{group.name}</p>
        </div>
        <button
          onClick={() => showToast('Export coming soon (dummy button)')}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
        >
          ⬇ Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Task Breakdown</div>
          <Pie data={pieData} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Reliability by Member</div>
          <Bar data={barData} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Detailed Stats</div>
        {group.members.map((m) => {
          const owned = tasks.filter((t) => t.owner === m.name);
          const done = owned.filter((t) => t.status === 'done').length;
          return (
            <div key={m.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
              <span className="text-slate-700">{m.name}</span>
              <span className="text-slate-500">{done}/{owned.length} tasks done · {m.reliability}% reliable</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Report;
