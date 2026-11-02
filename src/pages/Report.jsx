import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function Report({ live }) {
  const { members, tasks } = live;
  const groupName = (members.find((m) => m.group_name) || {}).group_name || 'StudySync';

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const lateCount = tasks.filter((t) => t.status === 'late').length;

  const pieData = {
    labels: ['Done', 'Pending', 'Late'],
    datasets: [{ data: [doneCount, pendingCount, lateCount], backgroundColor: ['#2ECC71', '#F39C12', '#E74C3C'] }],
  };

  const barData = {
    labels: members.map((m) => m.name),
    datasets: [{ label: 'Reliability %', data: members.map((m) => m.reliability), backgroundColor: '#2C5A8C' }],
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contribution Report</h2>
          <p className="text-sm text-slate-500 mt-1">{groupName} · {new Date().toLocaleDateString('en-GB')}</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
          ⬇ Print / Save as PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Task Breakdown</div>
          {tasks.length === 0 ? <p className="text-sm text-slate-500">No tasks yet.</p> : <Pie data={pieData} />}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Reliability by Member</div>
          {members.length === 0 ? <p className="text-sm text-slate-500">No members yet.</p> : <Bar data={barData} />}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Detailed Stats</div>
        {members.map((m) => {
          const owned = tasks.filter((t) => t.owner === m.id);
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