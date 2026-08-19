// This is a direct React version of your original sidebar. Instead of
// data-page="dashboard" attributes read by document.querySelectorAll,
// each nav item just calls setPage() when clicked.

const NAV_ITEMS = [
  { key: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { key: 'group', icon: '◈', label: 'Group View' },
  { key: 'heatmap', icon: '▦', label: 'Effort Heatmap' },
  { key: 'nudge', icon: '◎', label: 'Send Nudge' },
  { key: 'report', icon: '◑', label: 'Report' },
  { key: 'flashcards', icon: '◻', label: 'Flashcards' },
  { key: 'calendar', icon: '▦', label: 'Calendar' },
];

function Sidebar({ page, setPage, onReset }) {
  return (
    <aside className="w-56 flex-shrink-0 bg-sidebar-bg min-h-screen flex flex-col justify-between">
      <div>
        <div className="px-5 py-6 border-b border-white/10">
          <h1 className="font-display text-xl font-bold text-white">StudySync</h1>
          <span className="block text-xs text-slate-400">Team Accountability</span>
        </div>

        <nav className="py-4">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.key}
              onClick={() => setPage(item.key)}
              className={
                page === item.key
                  ? 'flex items-center gap-3 px-5 py-2.5 cursor-pointer border-l-4 border-primary-light bg-white/5 text-white font-bold'
                  : 'flex items-center gap-3 px-5 py-2.5 cursor-pointer border-l-4 border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="px-5 py-5 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-sync-green flex items-center justify-center text-white text-xs font-bold">
            AN
          </div>
          <div>
            <div className="text-sm font-bold text-white">Anna</div>
            <div className="text-xs text-slate-500">Demo User</div>
          </div>
        </div>
        <button
          onClick={onReset}
          className="w-full text-xs text-danger-crimson border border-danger-crimson/30 rounded py-2 hover:bg-danger-crimson/10"
        >
          ↺ Reset Data
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
