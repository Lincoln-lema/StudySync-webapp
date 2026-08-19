import { useState } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import mockData from './data/mockData';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Group from './pages/Group';
import Heatmap from './pages/Heatmap';
import Nudge from './pages/Nudge';
import Report from './pages/Report';
import Flashcards from './pages/Flashcards';
import Calendar from './pages/Calendar';

function App() {
  // Everything the app knows lives in one object, just like the
  // "state" object in your original script.js — except now, every
  // time we call setData(...), React re-renders whatever is on screen.
  const [data, setData] = useLocalStorage('studysync-data', mockData);

  // Which page is currently showing.
  const [page, setPage] = useState('dashboard');

  // Toast message shown briefly at the bottom right.
  const [toast, setToast] = useState('');
  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2000);
  }

  function resetData() {
    setData(mockData);
    showToast('Data reset to defaults');
  }

  // Pick which page component to show, same idea as .page.active
  // in the original CSS, just done in JavaScript instead.
  let currentPage;
  if (page === 'dashboard') currentPage = <Dashboard data={data} setPage={setPage} />;
  else if (page === 'group') currentPage = <Group data={data} setData={setData} showToast={showToast} />;
  else if (page === 'heatmap') currentPage = <Heatmap data={data} />;
  else if (page === 'nudge') currentPage = <Nudge data={data} setData={setData} showToast={showToast} />;
  else if (page === 'report') currentPage = <Report data={data} showToast={showToast} />;
  else if (page === 'flashcards') currentPage = <Flashcards data={data} setData={setData} showToast={showToast} />;
  else if (page === 'calendar') currentPage = <Calendar data={data} />;

  return (
    <div className="flex min-h-screen">
      <Sidebar page={page} setPage={setPage} onReset={resetData} />

      <main className="flex-1 p-8">
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
