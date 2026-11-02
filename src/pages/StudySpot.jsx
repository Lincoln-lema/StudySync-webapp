import { useCallback, useEffect, useState } from 'react';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = API_ORIGIN + '/api';
const LOCAL_API_KEY = import.meta.env.VITE_API_KEY;
const PROPERTY_ID = 'prop-003';

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'X-API-Key': LOCAL_API_KEY,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const todayStr = () => new Date().toLocaleDateString('en-CA');
const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export default function StudySpot({ currentUser }) {
  const [amenities, setAmenities] = useState(null);
  const [status, setStatus] = useState('loading');
  const [members, setMembers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({
    booked_by: currentUser ? currentUser.id : '', session_date: todayStr(), start_time: '14:00', end_time: '17:00', guests: 1, note: '',
  });
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBookings = useCallback(
    () => api(`/bookings?propertyId=${PROPERTY_ID}`).then(setBookings).catch((e) => console.error(e)),
    []
  );

  useEffect(() => {
    let cancelled = false;
    api(`/properties/${PROPERTY_ID}/study-amenities`)
      .then((data) => { if (!cancelled) { setAmenities(data); setStatus('success'); } })
      .catch((err) => { if (!cancelled) { console.error(err); setStatus('error'); } });
    api('/members')
      .then((data) => { if (!cancelled) setMembers(data); })
      .catch((e) => console.error(e));
    loadBookings();
    return () => { cancelled = true; };
  }, [loadBookings]);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));
  const memberName = (id) => (members.find((m) => m.id === id) || {}).name || id;

  async function submit(e) {
    e.preventDefault();
    setFormError('');
    setNotice('');
    if (!form.booked_by) { setFormError('Choose who is booking.'); return; }
    setSaving(true);
    try {
      const created = await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          property_id: PROPERTY_ID,
          booked_by: form.booked_by,
          session_date: form.session_date,
          start_time: form.start_time,
          end_time: form.end_time,
          guests: Number(form.guests),
          note: form.note.trim() || undefined,
        }),
      });
      setNotice(`Booked for ${created.session_date}, ${created.start_time} to ${created.end_time}.`);
      await loadBookings();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id) {
    setFormError('');
    setNotice('');
    try {
      await api(`/bookings/${id}`, { method: 'DELETE' });
      setNotice('Booking cancelled.');
      await loadBookings();
    } catch (err) {
      setFormError(err.message);
    }
  }

  if (status === 'loading') {
    return <div className="p-8 text-slate-500">Loading live partner data...</div>;
  }

  if (status === 'error') {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Study Spot</h2>
        <div className="bg-danger-crimson/10 border border-danger-crimson/30 rounded-xl p-4 text-sm text-danger-crimson">
          Partner data is unavailable right now. Please try again later.
        </div>
      </div>
    );
  }

  const isStandIn = amenities.source === 'stand-in' || /\(mock\)/i.test(amenities.name || '');
  const quiet = amenities.quiet_hours;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Partner Study Spot</h2>
        <p className="text-sm text-slate-500 mt-1">
          {isStandIn ? 'Stand-in data (SettleIn offline)' : 'Live data from SettleIn Housing API'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-primary mb-4">{amenities.name}</h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <span className="block text-slate-500 mb-1">Wi-Fi Rating</span>
              <span className="font-semibold text-lg">{amenities.wifi_rating ?? 'N/A'} / 5</span>
            </div>
            <div>
              <span className="block text-slate-500 mb-1">Wi-Fi Speed</span>
              <span className="font-semibold text-lg">
                {amenities.wifi_speed_mbps != null ? `${amenities.wifi_speed_mbps} Mbps` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 mb-1">Dedicated Desk</span>
              <span className="font-semibold">{amenities.has_dedicated_desk ? '✅ Yes' : '❌ No'}</span>
            </div>
            <div>
              <span className="block text-slate-500 mb-1">Backup Generator</span>
              <span className="font-semibold">{amenities.has_backup_generator ? '✅ Yes' : '❌ No'}</span>
            </div>
            <div className="col-span-2 pt-4 border-t border-slate-100">
              <span className="block text-slate-500 mb-1">Quiet Hours</span>
              <span className="font-semibold">
                {quiet && quiet.starts_at && quiet.ends_at
                  ? `${quiet.starts_at} to ${quiet.ends_at}${quiet.policy_enforced ? ' (Enforced)' : ''}`
                  : 'Not specified'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-slate-500 mb-1">Max Study Guests</span>
              <span className="font-semibold">{amenities.max_study_guests ?? 'Not specified'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h3 className="text-xl font-bold text-slate-900">Book a study session</h3>

          <label className="block text-sm">
            <span className="block text-slate-500 mb-1">Booked by</span>
            <select className={field} value={form.booked_by} onChange={set('booked_by')}>
              <option value="">Select a member</option>
              {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="block text-slate-500 mb-1">Date</span>
            <input type="date" className={field} min={todayStr()} value={form.session_date} onChange={set('session_date')} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block text-slate-500 mb-1">From</span>
              <input type="time" className={field} value={form.start_time} onChange={set('start_time')} />
            </label>
            <label className="block text-sm">
              <span className="block text-slate-500 mb-1">To</span>
              <input type="time" className={field} value={form.end_time} onChange={set('end_time')} />
            </label>
          </div>

          <label className="block text-sm">
            <span className="block text-slate-500 mb-1">Guests</span>
            <input type="number" min="1" max={amenities.max_study_guests || undefined} className={field} value={form.guests} onChange={set('guests')} />
          </label>

          <label className="block text-sm">
            <span className="block text-slate-500 mb-1">Note (optional)</span>
            <input type="text" maxLength={200} className={field} value={form.note} onChange={set('note')} />
          </label>

          {formError && (
            <div className="bg-danger-crimson/10 border border-danger-crimson/30 rounded-lg p-3 text-sm text-danger-crimson">{formError}</div>
          )}
          {notice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{notice}</div>
          )}

          <button type="submit" disabled={saving} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {saving ? 'Booking...' : 'Book this spot'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Upcoming bookings</h3>
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-500">No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between text-sm">
                <span>
                  <span className="font-semibold">{b.session_date}</span> · {b.start_time} to {b.end_time} · {memberName(b.booked_by)} · {b.guests} guest{b.guests === 1 ? '' : 's'}
                  {b.note ? <span className="text-slate-500"> · {b.note}</span> : null}
                </span>
                <button type="button" onClick={() => cancel(b.id)} className="text-danger-crimson font-semibold">Cancel</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}