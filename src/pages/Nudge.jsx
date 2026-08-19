import { useState } from 'react';

const PRESET_MESSAGES = [
  'Any updates on your part?',
  'Just checking in - are we on track?',
  'Let me know if you need help!',
  'Deadline is coming up soon',
];

function Nudge({ data, setData, showToast }) {
  const { nudges } = data;
  const [target, setTarget] = useState('Anna');
  const [message, setMessage] = useState(PRESET_MESSAGES[0]);

  function sendNudge(e) {
    e.preventDefault();
    const newNudge = {
      id: 'n' + Date.now(),
      message,
      target,
      sentAt: new Date().toISOString(),
    };
    setData({ ...data, nudges: [newNudge, ...nudges] });
    showToast('Nudge sent to ' + target + ' (anonymously)');
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Anonymous Nudge</h2>
        <p className="text-sm text-slate-500 mt-1">Send gentle reminders · Sender identity hidden</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Send a Nudge</div>
          <form onSubmit={sendNudge}>
            <label className="block text-xs text-slate-500 mb-1">Nudge Who?</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 rounded border border-slate-300 text-sm mb-4"
            >
              <option>Anna</option>
              <option>Ben</option>
              <option>Clara</option>
            </select>

            <label className="block text-xs text-slate-500 mb-1">Message</label>
            <select
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded border border-slate-300 text-sm mb-4"
            >
              {PRESET_MESSAGES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            <button type="submit" className="w-full py-2 rounded-lg bg-nudge-purple text-white text-sm font-semibold">
              Send Anonymous Nudge
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Nudge Log</div>
          {nudges.map((n) => (
            <div key={n.id} className="py-2 border-b border-slate-100 last:border-0">
              <div className="text-sm text-slate-700">"{n.message}"</div>
              <div className="text-xs text-slate-500">
                to <span className="text-nudge-purple font-medium">{n.target}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Nudge;
