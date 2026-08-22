import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, AlertCircle, Save, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiGetAllLeaveBalances, apiUpdateLeaveBalance } from '../api/client';
import Header from '../components/Header';

function Avatar({ src, name, size = 32 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>{initials}</div>;
}

export default function LeaveAllocation() {
  const { token } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [balances, setBalances] = useState([]);
  const [drafts, setDrafts] = useState({});       // { [balanceId]: { paid, sick } }
  const [saving, setSaving] = useState({});       // { [balanceId]: bool }
  const [saved, setSaved] = useState({});         // { [balanceId]: bool }
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBalances();
    window.addEventListener('attendance-changed', fetchBalances);
    return () => window.removeEventListener('attendance-changed', fetchBalances);
  }, [year]);

  async function fetchBalances() {
    setLoading(true);
    setDrafts({});
    try {
      const data = await apiGetAllLeaveBalances(token, year);
      setBalances(data);
      // Init drafts from fetched data
      const d = {};
      data.forEach(b => {
        d[b.id] = { paid: b.paidDaysAvailable, sick: b.sickDaysAvailable };
      });
      setDrafts(d);
    } catch { setBalances([]); }
    finally { setLoading(false); }
  }

  function handleDraft(id, field, value) {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setSaved(prev => ({ ...prev, [id]: false }));
    setError(prev => ({ ...prev, [id]: '' }));
  }

  async function handleSave(balance) {
    const draft = drafts[balance.id];
    if (!draft) return;
    setSaving(prev => ({ ...prev, [balance.id]: true }));
    setError(prev => ({ ...prev, [balance.id]: '' }));
    try {
      await apiUpdateLeaveBalance(balance.employeeId, {
        paidDaysAvailable: parseFloat(draft.paid),
        sickDaysAvailable: parseFloat(draft.sick),
        year,
      }, token);
      setSaved(prev => ({ ...prev, [balance.id]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [balance.id]: false })), 2500);
    } catch (err) {
      setError(prev => ({ ...prev, [balance.id]: err.message }));
    } finally {
      setSaving(prev => ({ ...prev, [balance.id]: false }));
    }
  }

  const isDirty = (balance) => {
    const d = drafts[balance.id];
    return d && (parseFloat(d.paid) !== parseFloat(balance.paidDaysAvailable) ||
                 parseFloat(d.sick) !== parseFloat(balance.sickDaysAvailable));
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const filteredBalances = balances.filter(b => {
    if (!search) return true;
    const name = `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header activeTab="allocation" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>Leave Allocation</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Set each employee's annual paid and sick leave entitlement.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="alloc-search"
                className="input-field"
                placeholder="Search employee…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', width: 200 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="field-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Year:</label>
              <select
                id="year-select"
                className="select-field"
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
                style={{ width: 100 }}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          <span>Default: <strong style={{ color: 'var(--color-text)' }}>Paid = 24 days</strong>, <strong style={{ color: 'var(--color-text)' }}>Sick = 7 days</strong> per year</span>
          <span>• Editing a field and clicking Save updates immediately</span>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading allocations…</div>
          ) : filteredBalances.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No leave records found for {year} matching your search.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th style={{ width: 150 }}>Paid Days</th>
                  <th style={{ width: 150 }}>Sick Days</th>
                  <th style={{ width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBalances.map(b => {
                  const draft = drafts[b.id] || { paid: b.paidDaysAvailable, sick: b.sickDaysAvailable };
                  const name = `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`.trim();
                  const dirty = isDirty(b);
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                          <Avatar src={b.employee?.profilePicUrl} name={name} size={32} />
                          <div>
                            <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{name}</p>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{b.employee?.jobPosition || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{b.employee?.department || '—'}</td>
                      <td>
                        <input
                          id={`paid-${b.id}`}
                          className="input-field"
                          type="number"
                          min="0"
                          max="365"
                          step="0.5"
                          value={draft.paid}
                          onChange={e => handleDraft(b.id, 'paid', e.target.value)}
                          style={{ padding: '0.35rem 0.6rem', width: '100px', background: dirty ? 'rgba(124,58,237,0.06)' : undefined }}
                        />
                      </td>
                      <td>
                        <input
                          id={`sick-${b.id}`}
                          className="input-field"
                          type="number"
                          min="0"
                          max="365"
                          step="0.5"
                          value={draft.sick}
                          onChange={e => handleDraft(b.id, 'sick', e.target.value)}
                          style={{ padding: '0.35rem 0.6rem', width: '100px', background: dirty ? 'rgba(124,58,237,0.06)' : undefined }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            id={`save-alloc-${b.id}`}
                            className={dirty ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => handleSave(b)}
                            disabled={saving[b.id] || !dirty}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem' }}>
                            <Save size={13} />
                            {saving[b.id] ? 'Saving…' : 'Save'}
                          </button>
                          {saved[b.id] && <CheckCircle size={16} color="#10b981" />}
                          {error[b.id] && (
                            <span title={error[b.id]}><AlertCircle size={16} color="#f87171" /></span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
