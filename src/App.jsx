import { useCallback, useEffect, useState } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import mockData from './data/mockData';
import { fetchMembers, fetchTasks, fetchActivity } from './api';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Group from './pages/Group';
import Heatmap from './pages/Heatmap';
import Nudge from './pages/Nudge';
import Report from './pages/Report';
import Flashcards from './pages/Flashcards';
import Calendar from './pages/Calendar';
import Members from './pages/Members';
import StudySpot from './pages/StudySpot';

const USER_KEY = 'studysync-current-user';
function readStored(key) { try { return window.localStorage.getItem(key) || ''; } catch { return ''; } }
function writeStored(key, value) { try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ } }

function App() {
  // Local-only for now: flashcard decks and the nudge log. Everything else is live from the API.
  const [data, setData] = useLocalStorage('studysync-data', mockData);
  const [page, setPage] = useState('dashboard');
  const [toast, setToast] = useState('');
  const [live, setLive] = useState({ members: [], tasks: [], activity: [], loading: true, error: '' });
  const [currentUserId, setCurrentUserId] = useState(() => readStored(USER_KEY));

  const reload = useCallback(async () => {
    try {
      const [members, tasks, activity] = await Promise.all([fetchMembers(), fetchTasks(), fetchActivity()]);
      setLive({ members, tasks, activity, loading: false, error: '' });
    } catch (err) {
      console.error(err);
      setLive((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const currentUser = live.members.find((m) => m.id === currentUserId) || live.members[0] || null;

  function selectUser(id) {
    setCurrentUserId(id);
    writeStored(USER_KEY, id);
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function resetData() {
    setData(mockData);
    showToast('Local flashcards and nudge log reset');
  }

  let currentPage;
  if (page === 'dashboard') currentPage = <Dashboard live={live} currentUser={currentUser} setPage={setPage} />;
  else if (page === 'study-spot') currentPage = <StudySpot currentUser={currentUser} />;
  else if (page === 'members') currentPage = <Members members={live.members} reload={reload} showToast={showToast} />;
  else if (page === 'group') currentPage = <Group live={live} reload={reload} showToast={showToast} currentUser={currentUser} />;
  else if (page === 'heatmap') currentPage = <Heatmap live={live} />;
  else if (page === 'nudge') currentPage = <Nudge data={data} setData={setData} members={live.members} showToast={showToast} />;
  else if (page === 'report') currentPage = <Report live={live} />;
  else if (page === 'flashcards') currentPage = <Flashcards data={data} setData={setData} showToast={showToast} />;
  else if (page === 'calendar') currentPage = <Calendar live={live} />;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        page={page}
        setPage={setPage}
        onReset={resetData}
        members={live.members}
        currentUser={currentUser}
        onSelectUser={selectUser}
      />

      <main className="flex-1 p-8">
        {live.error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-danger-crimson/30 bg-danger-crimson/10 p-4 text-sm text-danger-crimson">
            <span>Can't reach the StudySync server ({live.error}). Check that the backend is running and the API key matches.</span>
            <button onClick={reload} className="font-semibold underline">Retry</button>
          </div>
        )}
        {currentPage}
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;