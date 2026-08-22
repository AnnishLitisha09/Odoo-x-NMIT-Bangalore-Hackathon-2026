import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Check, Paperclip, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiGetLeaveRequests, apiGetLeaveBalance, apiGetHolidays, apiApproveLeave, apiRejectLeave } from '../api/client';
import Header from '../components/Header';

// ─── Mini Calendar ───
function MiniCalendar({ year, month, onChangeMonth, leaves, holidays }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  function getDayMark(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isHoliday = holidays.some(h => h.date === dateStr);
    const isLeave = approvedLeaves.some(l => dateStr >= l.startDate && dateStr <= l.endDate);
    const isPending = pendingLeaves.some(l => dateStr >= l.startDate && dateStr <= l.endDate);
    return { isHoliday, isLeave, isPending };
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button onClick={() => onChangeMonth(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => onChangeMonth(1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}><ChevronRight size={18} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', padding: '0.3rem 0' }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const { isHoliday, isLeave, isPending } = getDayMark(day);
          const isToday = isCurrentMonth && today.getDate() === day;
          return (
            <div key={day} style={{
              padding: '0.35rem 0', borderRadius: 6, fontSize: '0.78rem', fontWeight: isToday ? 700 : 400,
              background: isToday ? 'rgba(124,58,237,0.3)' : isLeave ? 'rgba(16,185,129,0.15)' : isPending ? 'rgba(245,158,11,0.1)' : isHoliday ? 'rgba(239,68,68,0.1)' : 'transparent',
              color: isToday ? 'var(--color-accent-light)' : isHoliday ? '#f87171' : 'var(--color-text)',
              position: 'relative',
            }}>
              {day}
              {(isLeave || isPending || isHoliday) && (
                <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: isLeave ? '#10b981' : isPending ? '#f59e0b' : '#f87171' }} />
              )}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />Leave</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />Pending</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />Holiday</span>
      </div>
    </div>
  );
}

// ─── Leave Request Modal ───
function LeaveRequestModal({ token, onClose, onSubmitted }) {
  const [form, setForm] = useState({ type: 'paid', startDate: '', endDate: '', remarks: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.startDate || !form.endDate) { setError('Please select a date range.'); return; }
    if (form.type === 'sick' && !file) { setError('Medical certificate attachment required for Sick Leave.'); return; }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('attachment', file);

    setLoading(true);
    try {
      const { apiApplyLeave } = await import('../api/client');
      await apiApplyLeave(fd, token);
      onSubmitted();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>New Leave Request</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: '0.875rem' }}><AlertCircle size={14} />{error}</div>}
          <div>
            <label className="field-label">Leave Type</label>
            <select id="leave-type" className="select-field" value={form.type} onChange={set('type')}>
              <option value="paid">Paid Time Off</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="field-label">From *</label>
              <input id="leave-from" className="input-field" type="date" value={form.startDate} onChange={set('startDate')} />
            </div>
            <div>
              <label className="field-label">To *</label>
              <input id="leave-to" className="input-field" type="date" value={form.endDate} onChange={set('endDate')} />
            </div>
          </div>
          {form.startDate && form.endDate && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-accent-light)' }}>
              Duration: {Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1} day(s)
            </p>
          )}
          <div>
            <label className="field-label">Remarks</label>
            <textarea id="leave-remarks" className="input-field" value={form.remarks} onChange={set('remarks')} rows={2} style={{ resize: 'vertical' }} placeholder="Reason for leave…" />
          </div>
          {form.type === 'sick' && (
            <div>
              <label className="field-label">Medical Certificate * (PDF/JPG/PNG, max 5MB)</label>
              <label id="leave-attach" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: 8, border: '1px dashed var(--color-border)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                <Paperclip size={14} />
                {file ? file.name : 'Click to attach file'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button id="leave-submit-btn" className="btn-primary" type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit Request'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main TimeOff Page ───
export default function TimeOff() {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [reqs, hols] = await Promise.all([
        apiGetLeaveRequests(token, isAdmin ? {} : {}),
        apiGetHolidays(token),
      ]);
      setRequests(reqs);
      setHolidays(hols);
      if (!isAdmin) {
        const bal = await apiGetLeaveBalance(token);
        setBalance(bal);
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function handleApprove(id) {
    try { await apiApproveLeave(id, { reviewerComment: reviewComment }, token); await fetchAll(); }
    catch (err) { alert(err.message); }
  }

  async function handleReject(id) {
    try { await apiRejectLeave(id, { reviewerComment: reviewComment }, token); await fetchAll(); }
    catch (err) { alert(err.message); }
  }

  function changeCalMonth(delta) {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m); setCalYear(y);
  }

  const filtered = requests.filter(r => !filterStatus || r.status === filterStatus);

  const statusMap = {
    pending: 'badge-yellow',
    approved: 'badge-green',
    rejected: 'badge-red',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header activeTab="timeoff" />
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, flex: 1 }}>Time Off</h1>
          {!isAdmin && <button id="new-leave-btn" className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Request</button>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr' : '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left column — employee only */}
          {!isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Balance cards */}
              {balance && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'Paid Time Off', available: balance.paidDaysAvailable, total: 24, color: '#10b981' },
                    { label: 'Sick Leave', available: balance.sickDaysAvailable, total: 7, color: '#a78bfa' },
                  ].map(b => (
                    <div key={b.label} className="card" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.label}</span>
                        <span style={{ color: b.color, fontWeight: 700, fontSize: '1.1rem' }}>{b.available}<span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 400 }}> / {b.total} days</span></span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: b.color, width: `${(b.available / b.total) * 100}%`, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Calendar */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <MiniCalendar year={calYear} month={calMonth} onChangeMonth={changeCalMonth} leaves={requests} holidays={holidays} />
              </div>

              {/* Holidays list */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Public Holidays</h3>
                {holidays.length === 0 && <p style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem' }}>None configured.</p>}
                {holidays.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                    <span>{h.name}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right column — requests table */}
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {['', 'pending', 'approved', 'rejected'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{ padding: '0.35rem 0.9rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${filterStatus === s ? 'var(--color-accent)' : 'var(--color-border)'}`, background: filterStatus === s ? 'rgba(124,58,237,0.2)' : 'transparent', color: filterStatus === s ? 'var(--color-accent-light)' : 'var(--color-text-muted)', fontFamily: 'inherit' }}>
                  {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                </button>
              ))}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No leave requests found.</div>
              ) : (
                <table className="data-table">
                  <thead><tr>
                    {isAdmin && <th>Employee</th>}
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr></thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id}>
                        {isAdmin && <td style={{ fontWeight: 500 }}>{r.employee?.firstName} {r.employee?.lastName}</td>}
                        <td><span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{r.type}</span></td>
                        <td>{r.startDate}</td>
                        <td>{r.endDate}</td>
                        <td>{r.allocationDays}</td>
                        <td><span className={`badge ${statusMap[r.status] || ''}`} style={{ textTransform: 'capitalize' }}>{r.status}</span></td>
                        {isAdmin && r.status === 'pending' && (
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button id={`approve-${r.id}`} className="btn-success" onClick={() => handleApprove(r.id)} style={{ padding: '0.35rem 0.75rem' }}><Check size={13} /></button>
                              <button id={`reject-${r.id}`} className="btn-danger" onClick={() => handleReject(r.id)} style={{ padding: '0.35rem 0.75rem' }}><X size={13} /></button>
                            </div>
                          </td>
                        )}
                        {isAdmin && r.status !== 'pending' && <td><span style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>{r.reviewerComment || '—'}</span></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && <LeaveRequestModal token={token} onClose={() => setShowModal(false)} onSubmitted={() => { setShowModal(false); fetchAll(); }} />}
    </div>
  );
}
