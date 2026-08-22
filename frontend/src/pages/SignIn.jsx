import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiLogin } from '../api/client';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!loginId.trim() || !password.trim()) {
      setError('Please enter your Login ID / Email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin({ loginIdOrEmail: loginId, password });
      login(data);
      if (data.user.mustResetPassword) {
        navigate('/reset-password', { replace: true });
      } else if (['admin', 'hr'].includes(data.user.role)) {
        navigate('/employees', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {/* Custom brand mark */}
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 50%, #ec4899 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(124,58,237,0.45)',
              marginBottom: '0.25rem',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Shine overlay */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
                borderRadius: '18px 18px 0 0'
              }} />
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            {/* App name */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
              <span style={{
                fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg,#c4b5fd,#7c3aed)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>HR</span>
              <span style={{
                fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg,#f0abfc,#a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>MS</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                color: 'rgba(167,139,250,0.7)', alignSelf: 'flex-end', marginBottom: '0.35rem', marginLeft: '0.25rem'
              }}>PRO</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.18em', color: 'rgba(167,139,250,0.55)', textTransform: 'uppercase' }}>
              Human Resource Management
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Sign in to your HR Portal</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.875rem' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="field-label">Login ID or Email</label>
              <input id="loginId" className="input-field" type="text" placeholder="e.g. OIJODO20260001 or john@company.com" value={loginId} onChange={e => setLoginId(e.target.value)} autoComplete="username" />
            </div>

            <div>
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="password" className="input-field" type={show ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: '2.8rem' }} />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id="signin-btn" className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.4rem' }}>
              {loading ? 'Signing in…' : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Don't have an Account? <Link to="/signup" style={{ color: 'var(--color-accent-light)', textDecoration: 'none', fontWeight: 500 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
