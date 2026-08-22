import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CalendarDays, Umbrella, Building2, LogOut, Clock,
  ChevronDown, UserCircle, CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiCheckIn, apiCheckOut, apiGetAttendance } from '../api/client';

function Avatar({ src, name, size = 32 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>{initials}</div>;
}

export default function Header({ activeTab }) {
  const { user, company, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const dropRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [myAttendance, setMyAttendance] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const isCheckedIn  = myAttendance?.checkIn && !myAttendance?.checkOut;
  const isCheckedOut = myAttendance?.checkIn &&  myAttendance?.checkOut;
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  useEffect(() => {
    if (user?.employeeId) {
      fetchMyAttendance();
    }
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [user]);

  async function fetchMyAttendance() {
    try {
      const logs = await apiGetAttendance(token, { employeeId: user.employeeId, date: today });
      setMyAttendance(logs[0] || null);
    } catch { /* silent */ }
  }

  async function handleCheckToggle() {
    try {
      if (isCheckedIn) {
        await apiCheckOut(token);
      } else {
        await apiCheckIn(token);
      }
      await fetchMyAttendance();
      // Dispatch custom event to let current page know attendance changed (so it reloads data if needed)
      window.dispatchEvent(new CustomEvent('attendance-changed'));
    } catch (err) {
      alert(err.message);
    }
  }

  function formatTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <header style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', gap: '2rem' }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, cursor: 'pointer' }} onClick={() => navigate(isAdmin ? '/employees' : '/home')}>
          {company?.logoUrl
            ? <img src={company.logoUrl} alt="Logo" style={{ height: '32px', maxWidth: '100px', objectFit: 'contain' }} />
            : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} color="white" /></div>}
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>{company?.name || 'HRMS'}</span>
        </div>

        {/* Navigation Tabs based on role */}
        <nav style={{ display: 'flex', gap: '0.25rem' }}>
          {[
            ...(isAdmin 
              ? [{ id: 'employees', label: 'Employees', path: '/employees', icon: <Users size={14} /> }]
              : [{ id: 'home', label: 'Home', path: '/home', icon: <Users size={14} /> }]
            ),
            { id: 'attendance', label: 'Attendance', path: '/attendance', icon: <CalendarDays size={14} /> },
            { id: 'timeoff', label: 'Time Off', path: '/timeoff', icon: <Umbrella size={14} /> },
            ...(isAdmin 
              ? [{ id: 'allocation', label: 'Allocation', path: '/timeoff/allocation', icon: <Building2 size={14} /> }]
              : []
            ),
          ].map(t => (
            <button key={t.id} onClick={() => navigate(t.path)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, fontFamily: 'inherit', background: activeTab === t.id ? 'rgba(124,58,237,0.2)' : 'transparent', color: activeTab === t.id ? 'var(--color-accent-light)' : 'var(--color-text-muted)', transition: 'all 0.15s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Check-In / Check-Out Systray — three states */}
          {user?.employeeId && (
            isCheckedOut ? (
              // ── Completed for today ──
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: 8, border: '1px solid rgba(100,116,139,0.35)', background: 'rgba(100,116,139,0.1)', color: 'var(--color-text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                <CheckCircle size={14} style={{ color: '#10b981' }} />
                Done • {formatTime(myAttendance?.checkIn)} – {formatTime(myAttendance?.checkOut)}
              </div>
            ) : (
              // ── Check In / Check Out button ──
              <button id="checkin-btn" onClick={handleCheckToggle}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: 8, border: `1px solid ${isCheckedIn ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`, background: isCheckedIn ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isCheckedIn ? '#f87171' : '#34d399', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isCheckedIn ? <LogOut size={14} /> : <Clock size={14} />}
                {isCheckedIn ? `Check Out • ${formatTime(myAttendance?.checkIn)}` : 'Check In'}
              </button>
            )
          )}

          {/* Avatar dropdown */}
          <div style={{ position: 'relative' }} ref={dropRef}>
            <button onClick={() => setDropdownOpen(d => !d)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: '0.3rem' }}>
              <Avatar src={user?.profilePicUrl} name={fullName} size={32} />
              <ChevronDown size={14} color="var(--color-text-muted)" />
            </button>
            {dropdownOpen && (
              <div className="card animate-fade-in" style={{ position: 'absolute', right: 0, top: '2.5rem', minWidth: 180, padding: '0.5rem', zIndex: 200 }}>
                <button onClick={() => { navigate('/profile/me'); setDropdownOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: 8, border: 'none', background: 'none', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <UserCircle size={16} /> My Profile
                </button>
                <button onClick={logout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: 8, border: 'none', background: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
