import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiGetAttendance, apiGetMyAttendance } from '../api/client';
import Header from '../components/Header';

function StatusBadge({ status }) {
  const map = { present: 'badge-green', absent: 'badge-yellow', half_day: 'badge-blue', leave: 'badge-purple' };
  const labels = { present: 'Present', absent: 'Absent', half_day: 'Half Day', leave: 'On Leave' };
  return <span className={`badge ${map[status] || 'badge-yellow'}`}>{labels[status] || status}</span>;
}

export default function Attendance() {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // For admin: load all employees for this date. For self: load month summary.
  useEffect(() => {
    fetchData();
    window.addEventListener('attendance-changed', fetchData);
    return () => window.removeEventListener('attendance-changed', fetchData);
  }, [date]);

  async function fetchData() {
    setLoading(true);
    try {
      if (isAdmin) {
        const data = await apiGetAttendance(token, { date });
        setLogs(data);
      } else {
        const year = date.slice(0, 4);
        const month = date.slice(5, 7);
        const from = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        const data = await apiGetMyAttendance(token, { from, to });
        setLogs(data.logs || []);
        setSummary(data.summary || null);
      }
    } catch {}
    finally { setLoading(false); }
  }

  function changeDate(delta) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  }

  function formatTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const filtered = logs.filter(l => {
    if (!search) return true;
    const name = `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header activeTab="attendance" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, flex: 1 }}>Attendance</h1>
          {/* Date navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.35rem 0.75rem' }}>
            <button onClick={() => changeDate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
            <input id="date-picker" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }} />
            <button onClick={() => changeDate(1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}><ChevronRight size={18} /></button>
          </div>
          {isAdmin && (
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input id="att-search" className="input-field" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.2rem', width: 220 }} />
            </div>
          )}
        </div>

        {/* Summary cards — employee view */}
        {!isAdmin && summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Days Present', value: summary.daysPresent, color: '#10b981' },
              { label: 'Half Days', value: summary.daysHalfDay, color: '#f59e0b' },
              { label: 'Leaves Taken', value: summary.leavesTaken, color: '#a78bfa' },
              { label: 'Total Hours', value: `${summary.totalWorkHours}h`, color: '#60a5fa' },
            ].map(c => (
              <div key={c.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color }}>{c.value}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{c.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Clock size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p>No attendance records for this {isAdmin ? 'date' : 'period'}.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr>
                {isAdmin && <th>Employee</th>}
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Extra Hours</th>
                <th>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    {isAdmin && <td style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {(l.employee?.firstName?.[0] || '') + (l.employee?.lastName?.[0] || '')}
                      </div>
                      <span style={{ fontWeight: 500 }}>{l.employee?.firstName} {l.employee?.lastName}</span>
                    </td>}
                    <td>{l.date}</td>
                    <td>{formatTime(l.checkIn)}</td>
                    <td>{formatTime(l.checkOut)}</td>
                    <td>{l.workHours ? `${l.workHours}h` : '—'}</td>
                    <td>{l.extraHours > 0 ? <span style={{ color: '#34d399' }}>+{l.extraHours}h</span> : '—'}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
