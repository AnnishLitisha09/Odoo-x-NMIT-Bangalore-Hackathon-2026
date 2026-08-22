import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CalendarDays, Umbrella, Building2, LogOut, Clock,
  ChevronDown, UserCircle, CheckCircle, Bell, Check, Trash2, Info, AlertTriangle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  apiCheckIn, apiCheckOut, apiGetAttendance,
  apiGetNotifications, apiGetUnreadNotificationCount,
  apiMarkNotificationAsRead, apiMarkAllNotificationsAsRead, apiDeleteNotification
} from '../api/client';

function Avatar({ src, name, size = 32 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justify: 'center', color: 'white', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>{initials}</div>;
}

export default function Header({ activeTab }) {
  const { user, company, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const dropRef = useRef(null);
  const notifRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myAttendance, setMyAttendance] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const isCheckedIn  = myAttendance?.checkIn && !myAttendance?.checkOut;
  const isCheckedOut = myAttendance?.checkIn &&  myAttendance?.checkOut;
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  useEffect(() => {
    if (user?.employeeId) {
      fetchMyAttendance();
    }
    if (token) {
      fetchNotifications();
      fetchUnreadCount();
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function fetchMyAttendance() {
    try {
      const logs = await apiGetAttendance(token, { employeeId: user.employeeId, date: today });
      setMyAttendance(logs[0] || null);
    } catch { /* silent */ }
  }

  async function fetchNotifications() {
    try {
      const list = await apiGetNotifications(token);
      setNotifications(list || []);
    } catch { /* silent */ }
  }

  async function fetchUnreadCount() {
    try {
      const res = await apiGetUnreadNotificationCount(token);
      setUnreadCount(res.count || 0);
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
      window.dispatchEvent(new CustomEvent('attendance-changed'));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleMarkRead(id, link) {
    try {
      await apiMarkNotificationAsRead(id, token);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
      if (link) {
        setNotifOpen(false);
        navigate(link);
      }
    } catch { /* silent */ }
  }

  async function handleMarkAllRead() {
    try {
      await apiMarkAllNotificationsAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }

  async function handleDeleteNotif(e, id) {
    e.stopPropagation();
    try {
      await apiDeleteNotification(id, token);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchUnreadCount();
    } catch { /* silent */ }
  }

  function formatTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function timeAgo(dateStr) {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={15} color="#34d399" />;
      case 'warning': return <AlertTriangle size={15} color="#fbbf24" />;
      case 'danger':  return <AlertCircle size={15} color="#f87171" />;
      default:        return <Info size={15} color="#60a5fa" />;
    }
  };

  return (
    <header style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', gap: '2rem' }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, cursor: 'pointer' }} onClick={() => navigate(isAdmin ? '/employees' : '/home')}>
          {company?.logoUrl
            ? <img src={company.logoUrl} alt="Logo" style={{ height: '32px', maxWidth: '100px', objectFit: 'contain' }} />
            : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justify: 'center' }}><Users size={16} color="white" /></div>}
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
          {/* Check-In / Check-Out Systray */}
          {user?.employeeId && (
            isCheckedOut ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: 8, border: '1px solid rgba(100,116,139,0.35)', background: 'rgba(100,116,139,0.1)', color: 'var(--color-text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                <CheckCircle size={14} style={{ color: '#10b981' }} />
                Done • {formatTime(myAttendance?.checkIn)} – {formatTime(myAttendance?.checkOut)}
              </div>
            ) : (
              <button id="checkin-btn" onClick={handleCheckToggle}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: 8, border: `1px solid ${isCheckedIn ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`, background: isCheckedIn ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isCheckedIn ? '#f87171' : '#34d399', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isCheckedIn ? <LogOut size={14} /> : <Clock size={14} />}
                {isCheckedIn ? `Check Out • ${formatTime(myAttendance?.checkIn)}` : 'Check In'}
              </button>
            )
          )}

          {/* Notification Bell Dropdown */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(o => !o);
                if (!notifOpen) fetchNotifications();
              }}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: 'white', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.35rem', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="card animate-fade-in" style={{ position: 'absolute', right: 0, top: '2.5rem', width: 340, maxHeight: 420, overflowY: 'auto', padding: 0, zIndex: 200, boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                    Notifications {unreadCount > 0 && <span style={{ color: 'var(--color-accent-light)', fontSize: '0.8rem' }}>({unreadCount} new)</span>}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--color-accent-light)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id, n.link)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--color-border)',
                          background: n.isRead ? 'transparent' : 'rgba(124,58,237,0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = n.isRead ? 'var(--color-surface-2)' : 'rgba(124,58,237,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(124,58,237,0.08)'}>
                        <div style={{ marginTop: 2, flexShrink: 0 }}>{getNotifIcon(n.type)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: n.isRead ? 600 : 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', flexShrink: 0, marginLeft: 6 }}>{timeAgo(n.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>{n.message}</p>
                        </div>
                        <button
                          onClick={e => handleDeleteNotif(e, n.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer', padding: 2, opacity: 0.6 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
