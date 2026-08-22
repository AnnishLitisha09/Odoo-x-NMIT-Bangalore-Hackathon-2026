import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiChangePassword } from '../api/client';

const RULES = [
  { test: v => v.length >= 8,              label: 'At least 8 characters' },
  { test: v => /[A-Z]/.test(v),            label: 'One uppercase letter' },
  { test: v => /\d/.test(v),              label: 'One number' },
  { test: v => /[@$!%*?&#.]/.test(v),      label: 'One special character (@$!%*?&#.)' },
];

export default function ResetPassword() {
  const { user, token, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const satisfied = RULES.map(r => r.test(newPass));
  const allGood = satisfied.every(Boolean) && newPass === confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allGood) { setError('Please satisfy all password requirements.'); return; }
    setError(''); setLoading(true);
    try {
      await apiChangePassword({ newPassword: newPass }, token);
      updateUser({ mustResetPassword: false });
      setDone(true);
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
            <KeyRound size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.3rem' }}>Set your new password</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>This is a one-time reset. Your account will be activated after this.</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#34d399' }}>
              <CheckCircle size={40} style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600 }}>Password set! Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div>
                <label className="field-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="new-password" className="input-field" type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Enter new password" style={{ paddingRight: '2.8rem' }} />
                  <button type="button" onClick={() => setShowNew(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Rules */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {RULES.map((r, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: satisfied[i] ? '#34d399' : 'var(--color-text-muted)' }}>
                    <CheckCircle size={12} style={{ flexShrink: 0, opacity: satisfied[i] ? 1 : 0.3 }} /> {r.label}
                  </li>
                ))}
              </ul>

              <div>
                <label className="field-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="confirm-password" className="input-field" type={showConf ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" style={{ paddingRight: '2.8rem', borderColor: confirm && confirm !== newPass ? 'var(--color-danger)' : undefined }} />
                  <button type="button" onClick={() => setShowConf(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && confirm !== newPass && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem' }}>Passwords do not match</p>}
              </div>

              <button id="reset-pass-btn" className="btn-primary" type="submit" disabled={loading || !allGood} style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
                {loading ? 'Saving…' : 'Set Password & Continue'}
              </button>
              <button type="button" onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'center' }}>
                ← Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
