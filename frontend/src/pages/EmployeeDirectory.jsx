import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Clock, LogOut, UserCircle, ChevronDown, Users, CalendarDays, Umbrella, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiGetEmployees, apiGetAttendance } from '../api/client';
import CreateEmployeeModal from '../components/CreateEmployeeModal';
import Header from '../components/Header';

const STATUS = {
  present: { dot: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />, label: 'Present' },
  leave:   { dot: <span style={{ fontSize: 12 }}>✈️</span>, label: 'On Leave' },
  absent:  { dot: <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />, label: 'Absent' },
};

function Avatar({ src, name, size = 56 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: size * 0.35 }}>{initials}</div>;
}

function EmployeeCard({ emp, onClick }) {
  const statusInfo = STATUS[emp.status] || STATUS.absent;
  return (
    <div id={`emp-card-${emp.id}`} className="card animate-fade-in" onClick={() => onClick(emp)} style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
        {statusInfo.dot}
        <span>{statusInfo.label}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
        <Avatar src={emp.profilePicUrl} name={`${emp.firstName} ${emp.lastName}`} size={64} />
        <div>
          <p style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.95rem' }}>{emp.firstName} {emp.lastName}</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{emp.jobPosition}</p>
          {emp.department && <p style={{ color: 'var(--color-text-dim)', fontSize: '0.72rem', marginTop: '0.1rem' }}>{emp.department}</p>}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDirectory() {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Employees should use their own dashboard
  useEffect(() => {
    if (user && !['admin', 'hr'].includes(user.role)) {
      navigate('/home', { replace: true });
    }
  }, [user]);

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchEmployees();
    // Listen for custom attendance events from Header to reload directory checklist statuses
    const handleAttChange = () => fetchEmployees(search);
    window.addEventListener('attendance-changed', handleAttChange);
    return () => window.removeEventListener('attendance-changed', handleAttChange);
  }, []);

  async function fetchEmployees(q = '') {
    setLoading(true);
    try { setEmployees(await apiGetEmployees(token, q)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }

  function handleSearch(e) {
    setSearch(e.target.value);
    fetchEmployees(e.target.value);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <Header activeTab="employees" />

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '2rem 1.5rem' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>Employees</h1>
          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input id="search-input" className="input-field" placeholder="Search employees…" value={search} onChange={handleSearch} style={{ paddingLeft: '2.4rem' }} />
          </div>
          {isAdmin && (
            <button id="add-employee-btn" className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Add Employee
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: '1.5rem', height: 160, background: 'var(--color-surface-2)', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            <Building2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No employees found{search ? ` for "${search}"` : ''}.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {employees.map(emp => (
              <EmployeeCard key={emp.id} emp={emp} onClick={() => navigate(`/employees/${emp.id}`)} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateEmployeeModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchEmployees(search); }}
        />
      )}
    </div>
  );
}
