import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Umbrella, LogOut, Clock, CheckCircle,
  Users, Building2, ArrowRight, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  apiGetAttendance, apiGetLeaveBalance, apiGetHolidays, apiGetLeaveRequests
} from '../api/client';
import Header from '../components/Header';

function Avatar({ src, name, size = 38 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: size * 0.35 }}>{initials}</div>;
}

export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [myAttendance, setMyAttendance] = useState(null);
  const [balance, setBalance] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [loadingAtt, setLoadingAtt] = useState(true);

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  useEffect(() => {
    fetchAll();
    // Listen for custom attendance events from Header
    const handleAttChange = () => fetchAttendanceOnly();
    window.addEventListener('attendance-changed', handleAttChange);
    return () => window.removeEventListener('attendance-changed', handleAttChange);
  }, []);

  async function fetchAll() {
    setLoadingAtt(true);
    try {
      const [att, bal, hols, leaves] = await Promise.all([
        apiGetAttendance(token, { employeeId: user.employeeId, date: today }).catch(() => []),
        apiGetLeaveBalance(token).catch(() => null),
        apiGetHolidays(token).catch(() => []),
        apiGetLeaveRequests(token).catch(() => []),
      ]);
      setMyAttendance(att[0] || null);
      setBalance(bal);
      setHolidays(hols.slice(0, 5));
      setMyLeaves(leaves.slice(0, 4));
    } finally { setLoadingAtt(false); }
  }

  async function fetchAttendanceOnly() {
    try {
      const att = await apiGetAttendance(token, { employeeId: user.employeeId, date: today });
      setMyAttendance(att[0] || null);
    } catch {}
  }

  const isCheckedIn  = myAttendance?.checkIn && !myAttendance?.checkOut;
  const isCheckedOut = myAttendance?.checkIn &&  myAttendance?.checkOut;

  function formatTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const quickCards = [
    {
      id: 'attendance', icon: <CalendarDays size={28} />, label: 'Attendance',
      sub: 'View your attendance log', color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)', onClick: () => navigate('/attendance')
    },
    {
      id: 'timeoff', icon: <Umbrella size={28} />, label: 'Time Off',
      sub: 'Apply & track leaves', color: '#10b981',
      bg: 'rgba(16,185,129,0.12)', onClick: () => navigate('/timeoff')
    },
  ];

  const statusBadge = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header activeTab="home" />

      {/* ── Main ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Welcome banner */}
        <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(168,85,247,0.08) 100%)', border: '1px solid rgba(124,58,237,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
            <Avatar src={user?.profilePicUrl} name={fullName} size={64} />
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{greeting},</p>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                {fullName || 'Welcome!'}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
                {isCheckedOut
                  ? <><CheckCircle size={14} style={{ color: '#10b981' }} /><span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.875rem' }}>Checked Out</span></>
                  : isCheckedIn
                    ? <><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} /><span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.875rem' }}>Checked In</span></>
                    : <><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /><span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.875rem' }}>Not Checked In</span></>}
              </div>
              {isCheckedIn && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>Since {formatTime(myAttendance?.checkIn)}</p>}
              {isCheckedOut && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{formatTime(myAttendance?.checkIn)} – {formatTime(myAttendance?.checkOut)} · {myAttendance?.workHours}h</p>}
            </div>
          </div>
        </div>

        {/* Quick access cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {quickCards.map(card => (
            <div key={card.id} id={`quick-${card.id}`} className="card animate-fade-in" onClick={card.onClick}
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${card.color}80`; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: '0.9rem' }}>
                {card.icon}
              </div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>{card.label}</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{card.sub}</p>
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: card.color, fontSize: '0.78rem', fontWeight: 600 }}>
                Open <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom grid: Leave balance + Upcoming holidays + Recent requests */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* Leave Balance */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Leave Balance</h2>
            {balance ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { label: 'Paid Time Off', avail: balance.paidDaysAvailable, total: 24, color: '#10b981' },
                  { label: 'Sick Leave', avail: balance.sickDaysAvailable, total: 7, color: '#a78bfa' },
                ].map(b => (
                  <div key={b.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{b.label}</span>
                      <span style={{ color: b.color, fontWeight: 700, fontSize: '0.875rem' }}>{b.avail}<span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.75rem' }}> / {b.total} days</span></span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: 'var(--color-border)' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: b.color, width: `${Math.min((b.avail / b.total) * 100, 100)}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading balance…</p>
            )}
            <button onClick={() => navigate('/timeoff')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.5rem' }}>
              Apply for Leave
            </button>
          </div>

          {/* Upcoming Holidays */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Upcoming Holidays</h2>
            {holidays.length === 0
              ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No upcoming holidays.</p>
              : holidays.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                  <div>
                    <p style={{ fontWeight: 500 }}>{h.name}</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>Holiday</span>
                </div>
              ))}
          </div>

          {/* Recent Leave Requests */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>My Leaves</h2>
              <button onClick={() => navigate('/timeoff')} style={{ background: 'none', border: 'none', color: 'var(--color-accent-light)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>View all</button>
            </div>
            {myLeaves.length === 0
              ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No leave requests yet.</p>
              : myLeaves.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                  <div>
                    <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{l.type} Leave</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{l.startDate} – {l.endDate}</p>
                  </div>
                  <span className={`badge ${statusBadge[l.status] || 'badge-yellow'}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>{l.status}</span>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
