import { useState } from 'react';
import { X, Eye, EyeOff, Copy, CheckCheck, AlertCircle } from 'lucide-react';
import { apiCreateEmployee } from '../api/client';

const ROLES = ['employee', 'hr', 'admin'];

export default function CreateEmployeeModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', companyEmail: '', mobile: '',
    role: 'employee', jobPosition: '', department: '', dateOfJoining: '', location: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.companyEmail || !form.dateOfJoining || !form.jobPosition) {
      setError('First name, last name, email, job position, and date of joining are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiCreateEmployee(form, token);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  function copyCredentials() {
    const text = `Login ID: ${result.credentials.loginId}\nEmail: ${result.credentials.email}\nTemp Password: ${result.credentials.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add New Employee</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {result ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '1rem', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '1.5rem' }}>
              <p style={{ color: '#34d399', fontWeight: 600, marginBottom: '1rem' }}>✓ Employee created successfully!</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Share these credentials securely. The employee must change their password on first login.</p>
              <div style={{ background: 'var(--color-surface-2)', borderRadius: 8, padding: '1rem', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.8 }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Login ID: </span><strong>{result.credentials.loginId}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Email: </span><strong>{result.credentials.email}</strong></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Temp Password: </span><strong>{result.credentials.tempPassword}</strong></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={copyCredentials} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {copied ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
              <button className="btn-primary" onClick={onCreated}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.875rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="field-label">First Name *</label>
                <input id="new-emp-fname" className="input-field" value={form.firstName} onChange={set('firstName')} placeholder="John" />
              </div>
              <div>
                <label className="field-label">Last Name *</label>
                <input id="new-emp-lname" className="input-field" value={form.lastName} onChange={set('lastName')} placeholder="Doe" />
              </div>
            </div>

            <div>
              <label className="field-label">Company Email *</label>
              <input id="new-emp-email" className="input-field" type="email" value={form.companyEmail} onChange={set('companyEmail')} placeholder="john.doe@company.com" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="field-label">Mobile</label>
                <input id="new-emp-mobile" className="input-field" value={form.mobile} onChange={set('mobile')} placeholder="+91..." />
              </div>
              <div>
                <label className="field-label">Role</label>
                <select id="new-emp-role" className="select-field" value={form.role} onChange={set('role')}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="field-label">Job Position *</label>
              <input id="new-emp-position" className="input-field" value={form.jobPosition} onChange={set('jobPosition')} placeholder="Software Engineer" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="field-label">Department</label>
                <input id="new-emp-dept" className="input-field" value={form.department} onChange={set('department')} placeholder="Engineering" />
              </div>
              <div>
                <label className="field-label">Location</label>
                <input id="new-emp-location" className="input-field" value={form.location} onChange={set('location')} placeholder="Mumbai" />
              </div>
            </div>

            <div>
              <label className="field-label">Date of Joining *</label>
              <input id="new-emp-doj" className="input-field" type="date" value={form.dateOfJoining} onChange={set('dateOfJoining')} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button id="create-emp-submit" type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Create Employee'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
