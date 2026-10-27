import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5000/api/properties';
// We must send our StudySync API key to talk to our own backend
const LOCAL_API_KEY = '22b0c9ec0c8f48c84cbb9137da374ff4ed31a9bef1197448'; 

export default function StudySpot() {
  const [amenities, setAmenities] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    
    fetch(`${API_BASE}/prop-003/study-amenities`, {
      headers: { 'X-API-Key': LOCAL_API_KEY }
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setAmenities(data);
          setStatus('success');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setStatus('error');
        }
      });

    return () => { cancelled = true; };
  }, []);

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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Partner Study Spot</h2>
        <p className="text-sm text-slate-500 mt-1">Live data from SettleIn Housing API</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 md:w-2/3">
        <h3 className="text-xl font-bold text-primary mb-4">{amenities.name}</h3>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div>
            <span className="block text-slate-500 mb-1">Wi-Fi Rating</span>
            <span className="font-semibold text-lg">{amenities.wifi_rating} / 5</span>
          </div>
          <div>
            <span className="block text-slate-500 mb-1">Wi-Fi Speed</span>
            <span className="font-semibold text-lg">{amenities.wifi_speed_mbps} Mbps</span>
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
              {amenities.quiet_hours.starts_at} to {amenities.quiet_hours.ends_at}
              {amenities.quiet_hours.policy_enforced && ' (Enforced)'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="block text-slate-500 mb-1">Max Study Guests</span>
            <span className="font-semibold">{amenities.max_study_guests}</span>
          </div>
        </div>
      </div>
    </div>
  );
}