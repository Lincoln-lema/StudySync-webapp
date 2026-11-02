import { useState } from 'react';
import { createMember, updateMember, deleteMember, makeMemberId } from '../api';

const field = 'w-full rounded border border-slate-300 px-3 py-2 text-sm';

function badge(r) {
  if (r > 70) return 'bg-sync-green/10 text-sync-green';
  if (r >= 40) return 'bg-warning-amber/10 text-warning-amber';
  return 'bg-danger-crimson/10 text-danger-crimson';
}

function Members({ members, reload, showToast }) {
  const groups = [...new Map(members.filter((m) => m.group_id).map((m) => [m.group_id, m.group_name || m.group_id])).entries()];
  const defaultGroup = groups.length ? groups[0][0] : '';

  const [form, setForm] = useState({ name: '', initials: '', reliability: 100, group_id: null });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [rowError, setRowError] = useState('');

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setE = (k) => (e) => setEdit((f) => ({ ...f, [k]: e.target.value }));

  async function addMember(e) {
    e.preventDefault();
    setFormError('');
    const name = form.name.trim();
    if (!name) { setFormError('Enter a name.'); return; }
    const rel = Number(form.reliability);
    if (!Number.isInteger(rel) || rel < 0 || rel > 100) { setFormError('Reliability must be a whole number from 0 to 100.'); return; }
    const initials = (form.initials.trim() || name.slice(0, 2)).toUpperCase().slice(0, 5);
    const group = form.group_id === null ? defaultGroup : form.group_id;
    setSaving(true);
    try {
      await createMember({
        id: makeMemberId(name, members.map((m) => m.id)),
        name,
        initials,
        reliability: rel,
        group_id: group || null,
      });
      setForm({ name: '', initials: '', reliability: 100, group_id: null });
      await reload();
      showToast(`${name} added`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(m) {
    setRowError('');
    setConfirmId(null);
    setEditId(m.id);
    setEdit({ name: m.name, initials: m.initials, reliability: m.reliability, group_id: m.group_id || '' });
  }

  async function saveEdit(id) {
    setRowError('');
    const name = (edit.name || '').trim();
    const initials = (edit.initials || '').trim().toUpperCase();
    const rel = Number(edit.reliability);
    if (!name || !initials) { setRowError('Name and initials cannot be empty.'); return; }
    if (!Number.isInteger(rel) || rel < 0 || rel > 100) { setRowError('Reliability must be a whole number from 0 to 100.'); return; }
    try {
      await updateMember(id, { name, initials, reliability: rel, group_id: edit.group_id || null });
      setEditId(null);
      await reload();
      showToast('Member updated');
    } catch (err) {
      setRowError(err.message);
    }
  }

  async function remove(id) {
    setRowError('');
    try {
      await deleteMember(id);
      setConfirmId(null);
      await reload();
      showToast('Member deleted');
    } catch (err) {
      setConfirmId(null);
      setRowError(`${err.message}. A member who still has tasks, activity or study bookings can't be deleted yet; reassign or remove those first.`);
    }
  }

  const groupSelect = (value, onChange) => (
    <select value={value} onChange={onChange} className={field}>
      <option value="">No group</option>
      {groups.map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
    </select>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Members</h2>
        <p className="text-sm text-slate-500 mt-1">{members.length} in your team · saved to the database</p>
      </div>

      <form onSubmit={addMember} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Add a member</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <label className="block text-sm md:col-span-2">
            <span className="block text-xs text-slate-500 mb-1">Name</span>
            <input className={field} maxLength={100} value={form.name} onChange={setF('name')} placeholder="e.g., Dan" />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-slate-500 mb-1">Initials (optional)</span>
            <input className={field} maxLength={5} value={form.initials} onChange={setF('initials')} placeholder="DA" />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-slate-500 mb-1">Reliability %</span>
            <input type="number" min="0" max="100" className={field} value={form.reliability} onChange={setF('reliability')} />
          </label>
          <label className="block text-sm">
            <span className="block text-xs text-slate-500 mb-1">Group</span>
            {groupSelect(form.group_id === null ? defaultGroup : form.group_id, setF('group_id'))}
          </label>
        </div>
        {formError && (
          <div className="mt-3 rounded-lg border border-danger-crimson/30 bg-danger-crimson/10 p-3 text-sm text-danger-crimson">{formError}</div>
        )}
        <button type="submit" disabled={saving} className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">
          {saving ? 'Adding...' : '+ Add member'}
        </button>
      </form>

      {rowError && (
        <div className="mb-4 rounded-lg border border-danger-crimson/30 bg-danger-crimson/10 p-3 text-sm text-danger-crimson">{rowError}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 overflow-x-auto">
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">No members yet. Add the first one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Initials</th>
                <th className="py-2 pr-3">Reliability</th>
                <th className="py-2 pr-3">Group</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) =>
                editId === m.id ? (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="py-2 pr-3"><input className={field} maxLength={100} value={edit.name} onChange={setE('name')} /></td>
                    <td className="py-2 pr-3"><input className={field} maxLength={5} value={edit.initials} onChange={setE('initials')} /></td>
                    <td className="py-2 pr-3"><input type="number" min="0" max="100" className={field} value={edit.reliability} onChange={setE('reliability')} /></td>
                    <td className="py-2 pr-3">{groupSelect(edit.group_id, setE('group_id'))}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => saveEdit(m.id)} className="text-primary font-semibold mr-3">Save</button>
                      <button onClick={() => setEditId(null)} className="text-slate-500 font-semibold">Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="py-3 pr-3 font-medium text-slate-800">{m.name}</td>
                    <td className="py-3 pr-3 text-slate-600">{m.initials}</td>
                    <td className="py-3 pr-3">
                      <span className={'text-xs font-semibold px-3 py-1 rounded-full ' + badge(m.reliability)}>{m.reliability}%</span>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{m.group_name || '—'}</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(m)} className="text-primary font-semibold mr-3">Edit</button>
                      {confirmId === m.id ? (
                        <>
                          <button onClick={() => remove(m.id)} className="text-danger-crimson font-semibold mr-3">Confirm delete</button>
                          <button onClick={() => setConfirmId(null)} className="text-slate-500 font-semibold">Keep</button>
                        </>
                      ) : (
                        <button onClick={() => { setRowError(''); setConfirmId(m.id); }} className="text-danger-crimson font-semibold">Delete</button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Members;