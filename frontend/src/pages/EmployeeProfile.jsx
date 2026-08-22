import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Camera, Plus, Trash2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  apiGetEmployee, apiUpdateEmployee, apiGetSalary, apiUpdateSalary,
  apiAddSkill, apiRemoveSkill, apiAddCertification, apiRemoveCertification, apiChangePassword
} from '../api/client';
import Header from '../components/Header';

function Avatar({ src, name, size = 90, editable, onEdit }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {src
        ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-border)' }} />
        : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: size * 0.35, border: '3px solid var(--color-border)' }}>{initials}</div>
      }
      {editable && (
        <button onClick={onEdit} style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: 'var(--color-accent)', border: '2px solid var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Camera size={12} color="white" />
        </button>
      )}
    </div>
  );
}

function Field({ label, value, name, editing, onChange, type = 'text', readOnly = false }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {editing && !readOnly
        ? <input className="input-field" type={type} name={name} value={value || ''} onChange={onChange} />
        : <p style={{ color: value ? 'var(--color-text)' : 'var(--color-text-dim)', fontSize: '0.9rem', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>{value || '—'}</p>
      }
    </div>
  );
}

// ─── Resume Tab ───
function ResumeTab({ emp, editing, onChange, isAdmin, token, onRefresh }) {
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState({ name: '', issuedBy: '', date: '' });
  const [addingCert, setAddingCert] = useState(false);

  async function addSkill() {
    if (!newSkill.trim()) return;
    await apiAddSkill(emp.id, { name: newSkill.trim() }, token);
    setNewSkill('');
    onRefresh();
  }

  async function removeSkill(id) {
    await apiRemoveSkill(emp.id, id, token);
    onRefresh();
  }

  async function addCert() {
    if (!newCert.name.trim()) return;
    await apiAddCertification(emp.id, newCert, token);
    setNewCert({ name: '', issuedBy: '', date: '' });
    setAddingCert(false);
    onRefresh();
  }

  async function removeCert(id) {
    await apiRemoveCertification(emp.id, id, token);
    onRefresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.2rem' }}>
        <Field label="Job Position" value={emp.jobPosition} name="jobPosition" editing={editing && isAdmin} onChange={onChange} />
        <Field label="Department" value={emp.department} name="department" editing={editing && isAdmin} onChange={onChange} />
        <Field label="Company Email" value={emp.companyEmail} name="companyEmail" editing={editing && isAdmin} onChange={onChange} type="email" />
        <Field label="Mobile" value={emp.mobile} name="mobile" editing={editing} onChange={onChange} />
        <Field label="Location" value={emp.location} name="location" editing={editing && isAdmin} onChange={onChange} />
      </div>

      <div>
        <label className="field-label">About</label>
        {editing
          ? <textarea className="input-field" name="about" value={emp.about || ''} onChange={onChange} rows={3} style={{ resize: 'vertical' }} />
          : <p style={{ color: emp.about ? 'var(--color-text)' : 'var(--color-text-dim)', fontSize: '0.875rem', lineHeight: 1.7 }}>{emp.about || '—'}</p>
        }
      </div>

      <div>
        <label className="field-label">What I love about my job</label>
        {editing
          ? <textarea className="input-field" name="loveAboutJob" value={emp.loveAboutJob || ''} onChange={onChange} rows={2} style={{ resize: 'vertical' }} />
          : <p style={{ color: emp.loveAboutJob ? 'var(--color-text)' : 'var(--color-text-dim)', fontSize: '0.875rem', lineHeight: 1.7 }}>{emp.loveAboutJob || '—'}</p>
        }
      </div>

      <div>
        <label className="field-label">Interests & Hobbies</label>
        {editing
          ? <textarea className="input-field" name="interests" value={emp.interests || ''} onChange={onChange} rows={2} style={{ resize: 'vertical' }} />
          : <p style={{ color: emp.interests ? 'var(--color-text)' : 'var(--color-text-dim)', fontSize: '0.875rem', lineHeight: 1.7 }}>{emp.interests || '—'}</p>
        }
      </div>

      {/* Skills */}
      <div>
        <label className="field-label" style={{ marginBottom: '0.6rem' }}>Skills</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: editing ? '0.75rem' : 0 }}>
          {(emp.skills || []).map(s => (
            <span key={s.id} className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {s.name}
              {editing && <button onClick={() => removeSkill(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}><X size={10} /></button>}
            </span>
          ))}
          {(!emp.skills || emp.skills.length === 0) && !editing && <span style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem' }}>No skills added.</span>}
        </div>
        {editing && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input-field" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Type a skill and press Enter" style={{ flex: 1 }} />
            <button className="btn-secondary" onClick={addSkill}><Plus size={14} /></button>
          </div>
        )}
      </div>

      {/* Certifications */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label className="field-label" style={{ margin: 0 }}>Certifications</label>
          {editing && <button className="btn-secondary" onClick={() => setAddingCert(true)} style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}><Plus size={12} /> Add</button>}
        </div>
        {addingCert && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <input className="input-field" placeholder="Certificate name *" value={newCert.name} onChange={e => setNewCert(p => ({ ...p, name: e.target.value }))} style={{ flex: 1, minWidth: 160 }} />
            <input className="input-field" placeholder="Issued by" value={newCert.issuedBy} onChange={e => setNewCert(p => ({ ...p, issuedBy: e.target.value }))} style={{ flex: 1, minWidth: 130 }} />
            <input className="input-field" type="date" value={newCert.date} onChange={e => setNewCert(p => ({ ...p, date: e.target.value }))} style={{ width: 140 }} />
            <button className="btn-primary" onClick={addCert} style={{ padding: '0.5rem 0.9rem' }}>Add</button>
            <button className="btn-secondary" onClick={() => setAddingCert(false)} style={{ padding: '0.5rem 0.9rem' }}>Cancel</button>
          </div>
        )}
        {(emp.certifications || []).length === 0 && !editing && <p style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem' }}>No certifications added.</p>}
        {(emp.certifications || []).map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.name}</p>
              {c.issuedBy && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{c.issuedBy} {c.date ? `• ${c.date}` : ''}</p>}
            </div>
            {editing && <button onClick={() => removeCert(c.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Private Info Tab ───
function PrivateInfoTab({ emp, editing, isAdmin, onChange, showPayroll, empId, token }) {
  const [salary, setSalary] = useState(null);
  useEffect(() => {
    if (showPayroll && empId && token) {
      apiGetSalary(empId, token).then(setSalary).catch(() => {});
    }
  }, [showPayroll, empId, token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.2rem' }}>
        <Field label="Date of Birth" value={emp.dob} name="dob" editing={editing && isAdmin} onChange={onChange} type="date" />
        <Field label="Gender" value={emp.gender} name="gender" editing={editing && isAdmin} onChange={onChange} />
        <Field label="Marital Status" value={emp.maritalStatus} name="maritalStatus" editing={editing && isAdmin} onChange={onChange} />
        <Field label="Nationality" value={emp.nationality} name="nationality" editing={editing && isAdmin} onChange={onChange} />
        <Field label="Personal Email" value={emp.personalEmail} name="personalEmail" editing={editing && isAdmin} onChange={onChange} type="email" />
        <Field label="Date of Joining" value={emp.dateOfJoining} name="dateOfJoining" editing={editing && isAdmin} onChange={onChange} type="date" />
      </div>
      <div>
        <label className="field-label">Residing Address</label>
        {editing
          ? <textarea className="input-field" name="address" value={emp.address || ''} onChange={onChange} rows={2} style={{ resize: 'vertical' }} />
          : <p style={{ color: emp.address ? 'var(--color-text)' : 'var(--color-text-dim)', fontSize: '0.875rem', lineHeight: 1.7 }}>{emp.address || '—'}</p>
        }
      </div>
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.2rem' }}>
          <Field label="Account Number" value={emp.accountNumber} name="accountNumber" editing={editing && isAdmin} onChange={onChange} />
          <Field label="Bank Name" value={emp.bankName} name="bankName" editing={editing && isAdmin} onChange={onChange} />
          <Field label="IFSC Code" value={emp.ifscCode} name="ifscCode" editing={editing && isAdmin} onChange={onChange} />
          <Field label="PAN No" value={emp.panNo} name="panNo" editing={editing && isAdmin} onChange={onChange} />
          <Field label="UAN No" value={emp.uanNo} name="uanNo" editing={editing && isAdmin} onChange={onChange} />
          <Field label="Emp Code" value={emp.empCode} name="empCode" editing={editing && isAdmin} onChange={onChange} />
        </div>
      </div>

      {/* Read-only Payroll Summary for employees */}
      {showPayroll && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salary Overview <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.72rem', marginLeft: '0.5rem' }}>Read-only</span></h3>
          {salary ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Monthly CTC', value: `₹${Number(salary?.salaryStructure?.monthlyWage || 0).toLocaleString('en-IN')}`, color: '#a78bfa' },
                ...( salary?.salaryStructure?.components || []).slice(0, 3).map(c => ({
                  label: c.name === 'basic' ? 'Basic Salary' : c.name === 'hra' ? 'HRA' : c.name,
                  value: `₹${Number(c.computedAmount || 0).toLocaleString('en-IN')}`,
                  color: '#60a5fa'
                }))
              ].map(item => (
                <div key={item.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: item.color }}>{item.value}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{item.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Salary information not yet configured.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Salary Info Tab (Admin-only) ───
function SalaryInfoTab({ empId, token }) {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const COMP_NAMES = ['basic', 'hra', 'standard_allowance', 'bonus', 'lta', 'fixed_allowance'];
  const COMP_LABELS = {
    basic: 'Basic Salary',
    hra: 'House Rent Allowance',
    standard_allowance: 'Standard Allowance',
    bonus: 'Performance Bonus',
    lta: 'Leave Travel Allowance',
    fixed_allowance: 'Fixed Allowance (computed)'
  };
  const COMP_DESCS = {
    basic: 'Define Basic salary from company cost compute it based on monthly Wages',
    hra: 'HRA provided to employees 50% of the basic salary',
    standard_allowance: 'A standard allowance is a predetermined, fixed amount provided to employee as part of their salary',
    bonus: 'Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary',
    lta: 'LTA is paid by the company to employees to cover their travel expenses and calculated as a % of the basic salary',
    fixed_allowance: 'fixed allowance portion of wages is determined after calculating all salary components'
  };

  useEffect(() => { fetchSalary(); }, [empId]);

  async function fetchSalary() {
    setLoading(true);
    try {
      const d = await apiGetSalary(empId, token);
      setData(d);
      initForm(d);
    } catch {}
    finally { setLoading(false); }
  }

  function initForm(d) {
    const compMap = {};
    (d?.salaryStructure?.components || []).forEach(c => { compMap[c.name] = c; });
    
    // Set fallback defaults if no components saved yet
    const getDefVal = (name) => {
      if (compMap[name] !== undefined) return parseFloat(compMap[name].value);
      if (name === 'basic') return 50;
      if (name === 'hra') return 50;
      if (name === 'standard_allowance') return 4167;
      if (name === 'bonus') return 8.33;
      if (name === 'lta') return 8.33;
      return 0;
    };
    
    const getDefType = (name) => {
      if (compMap[name] !== undefined) return compMap[name].computationType;
      if (name === 'standard_allowance' || name === 'fixed_allowance') return 'fixed_amount';
      return 'percentage_of_basic'; // standard represents % basic (except basic which is % of wage)
    };

    setForm({
      monthlyWage: d?.salaryStructure?.monthlyWage || 0,
      workingDaysPerWeek: d?.salaryStructure?.workingDaysPerWeek || 5,
      workingHoursPerDay: d?.salaryStructure?.workingHoursPerDay || 8,
      components: COMP_NAMES.filter(n => n !== 'fixed_allowance').map(name => ({
        name,
        computationType: getDefType(name),
        value: getDefVal(name),
      })),
      taxDeduction: {
        employeePfPct: d?.taxDeduction?.employeePfPct || 12,
        employerPfPct: d?.taxDeduction?.employerPfPct || 12,
        professionalTaxAmount: d?.taxDeduction?.professionalTaxAmount || 200,
      }
    });
  }

  async function save() {
    setSaving(true); setError('');
    try {
      await apiUpdateSalary(empId, form, token);
      await fetchSalary();
      setEditing(false);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)', padding: '2rem' }}>Loading salary data…</p>;

  // Dynamically compute values for display (handles edit-mode states and defaults)
  const activeWage = parseFloat(editing ? form.monthlyWage : data?.salaryStructure?.monthlyWage || 0);
  const activeWorkingDays = parseInt(editing ? form.workingDaysPerWeek : data?.salaryStructure?.workingDaysPerWeek || 5);
  const activeWorkingHours = parseInt(editing ? form.workingHoursPerDay : data?.salaryStructure?.workingHoursPerDay || 8);
  const activeComponents = editing ? form.components : form.components; // we use initForm to populate components
  
  const activeEmployeePf = parseFloat(editing ? form.taxDeduction?.employeePfPct : data?.taxDeduction?.employeePfPct || 12);
  const activeEmployerPf = parseFloat(editing ? form.taxDeduction?.employerPfPct : data?.taxDeduction?.employerPfPct || 12);
  const activeProfessionalTax = parseFloat(editing ? form.taxDeduction?.professionalTaxAmount : data?.taxDeduction?.professionalTaxAmount || 200);

  // Math Calculations
  const basicComp = activeComponents?.find(c => c.name === 'basic') || { computationType: 'percentage_of_basic', value: 50 };
  const basicAmt = basicComp.computationType === 'percentage_of_basic' ? (parseFloat(basicComp.value || 0) / 100 * activeWage) : parseFloat(basicComp.value || 0);

  const hraComp = activeComponents?.find(c => c.name === 'hra') || { computationType: 'percentage_of_basic', value: 50 };
  const hraAmt = hraComp.computationType === 'percentage_of_basic' ? (parseFloat(hraComp.value || 0) / 100 * basicAmt) : parseFloat(hraComp.value || 0);

  const stdComp = activeComponents?.find(c => c.name === 'standard_allowance') || { computationType: 'fixed_amount', value: 4167 };
  const stdAmt = stdComp.computationType === 'percentage_of_basic' ? (parseFloat(stdComp.value || 0) / 100 * basicAmt) : parseFloat(stdComp.value || 0);

  const bonusComp = activeComponents?.find(c => c.name === 'bonus') || { computationType: 'percentage_of_basic', value: 8.33 };
  const bonusAmt = bonusComp.computationType === 'percentage_of_basic' ? (parseFloat(bonusComp.value || 0) / 100 * basicAmt) : parseFloat(bonusComp.value || 0);

  const ltaComp = activeComponents?.find(c => c.name === 'lta') || { computationType: 'percentage_of_basic', value: 8.33 };
  const ltaAmt = ltaComp.computationType === 'percentage_of_basic' ? (parseFloat(ltaComp.value || 0) / 100 * basicAmt) : parseFloat(ltaComp.value || 0);

  const totalWithoutFixed = basicAmt + hraAmt + stdAmt + bonusAmt + ltaAmt;
  const fixedAmt = Math.max(0, activeWage - totalWithoutFixed);
  
  const pfEmployeeAmt = (activeEmployeePf / 100) * basicAmt;
  const pfEmployerAmt = (activeEmployerPf / 100) * basicAmt;

  const handleComponentChange = (index, field, value) => {
    setForm(f => {
      const comps = [...f.components];
      comps[index] = { ...comps[index], [field]: value };
      return { ...f, components: comps };
    });
  };

  const getComputedDisplayAmount = (name) => {
    if (name === 'basic') return basicAmt;
    if (name === 'hra') return hraAmt;
    if (name === 'standard_allowance') return stdAmt;
    if (name === 'bonus') return bonusAmt;
    if (name === 'lta') return ltaAmt;
    if (name === 'fixed_allowance') return fixedAmt;
    return 0;
  };

  const getPercentOfBasicDisplay = (name, amt) => {
    if (name === 'basic') {
      const c = activeComponents?.find(x => x.name === 'basic');
      return c?.computationType === 'percentage_of_basic' ? parseFloat(c.value) : (activeWage ? (amt / activeWage) * 100 : 0);
    }
    return basicAmt ? (amt / basicAmt) * 100 : 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'inherit' }}>
      {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: '0.875rem' }}><AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>Salary Information</h2>
        <div>
          {editing
            ? <><button className="btn-secondary" onClick={() => { setEditing(false); initForm(data); }} style={{ marginRight: 8 }}>Cancel</button><button className="btn-primary" onClick={save} disabled={saving}><Save size={14} />{saving ? ' Saving…' : ' Save'}</button></>
            : <button className="btn-secondary" onClick={() => setEditing(true)}><Edit2 size={14} /> Edit</button>
          }
        </div>
      </div>

      {/* Wage & Hours Card */}
      <div className="card" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div>
          <label className="field-label">Month Wage (₹)</label>
          {editing 
            ? <input className="input-field" type="number" value={form.monthlyWage} onChange={e => setForm(f => ({ ...f, monthlyWage: e.target.value }))} style={{ fontSize: '1rem' }} /> 
            : <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent-light)' }}>₹{activeWage.toLocaleString('en-IN')}</p>
          }
        </div>
        <div>
          <label className="field-label">Yearly wage (₹)</label>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>₹{(activeWage * 12).toLocaleString('en-IN')}</p>
        </div>
        <div>
          <label className="field-label">No of working days in a week</label>
          {editing 
            ? <input className="input-field" type="number" min={1} max={7} value={form.workingDaysPerWeek} onChange={e => setForm(f => ({ ...f, workingDaysPerWeek: e.target.value }))} /> 
            : <p style={{ fontSize: '1rem', fontWeight: 600 }}>{activeWorkingDays} days</p>
          }
        </div>
        <div>
          <label className="field-label">Working Hours / Day</label>
          {editing 
            ? <input className="input-field" type="number" min={1} max={24} value={form.workingHoursPerDay} onChange={e => setForm(f => ({ ...f, workingHoursPerDay: e.target.value }))} /> 
            : <p style={{ fontSize: '1rem', fontWeight: 600 }}>{activeWorkingHours} hrs</p>
          }
        </div>
      </div>

      {/* Two Column Layout (Components & PF/Deductions) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Column: Salary Components */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '1.2rem' }}>Salary Components</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {COMP_NAMES.map((name, i) => {
              const amt = getComputedDisplayAmount(name);
              const pct = getPercentOfBasicDisplay(name, amt);
              const comp = activeComponents?.find(x => x.name === name);
              
              if (name === 'fixed_allowance') {
                return (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 8, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{COMP_LABELS[name]}</p>
                      <p style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{COMP_DESCS[name]}</p>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 140 }}>
                      <p style={{ fontWeight: 700, color: 'var(--color-accent-light)', fontSize: '0.95rem' }}>₹{amt.toFixed(2)} / month</p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>{pct.toFixed(2)}%</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem' }}>
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{COMP_LABELS[name]}</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{COMP_DESCS[name]}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {editing ? (
                      <>
                        <select 
                          className="select-field" 
                          value={comp?.computationType} 
                          onChange={e => handleComponentChange(i, 'computationType', e.target.value)}
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', width: 120 }}>
                          <option value="percentage_of_basic">{name === 'basic' ? '% of Wage' : '% of Basic'}</option>
                          <option value="fixed_amount">Fixed Amount</option>
                        </select>
                        <input 
                          className="input-field" 
                          type="number" 
                          step="0.01"
                          value={comp?.value} 
                          onChange={e => handleComponentChange(i, 'value', e.target.value)}
                          style={{ padding: '0.3rem 0.5rem', width: 80, fontSize: '0.82rem' }} 
                        />
                      </>
                    ) : (
                      <div style={{ textAlign: 'right', minWidth: 120 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                          {comp?.computationType === 'percentage_of_basic' ? `${parseFloat(comp.value).toFixed(2)}%` : `${pct.toFixed(2)}%`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {totalWithoutFixed > activeWage && (
              <p style={{ color: '#f87171', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={14} /> Total components sum (₹{totalWithoutFixed.toFixed(2)}) exceeds monthly wage (₹{activeWage.toFixed(2)})!
              </p>
            )}
          </div>
        </div>

        {/* Right Column: PF & Tax Deductions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Provident Fund Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '1.2rem' }}>Provident Fund (PF) Contribution</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {[
                { label: "Employee", pctKey: "employeePfPct", amt: pfEmployeeAmt },
                { label: "Employer", pctKey: "employerPfPct", amt: pfEmployerAmt }
              ].map(pf => (
                <div key={pf.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{pf.label}'s PF Contribution</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>PF is calculated based on the basic salary</p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {editing ? (
                      <>
                        <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Rate %:</label>
                        <input
                          className="input-field"
                          type="number"
                          step="0.1"
                          value={form.taxDeduction?.[pf.pctKey] || 0}
                          onChange={e => setForm(f => ({ ...f, taxDeduction: { ...f.taxDeduction, [pf.pctKey]: e.target.value } }))}
                          style={{ padding: '0.3rem 0.5rem', width: 70, fontSize: '0.82rem' }}
                        />
                      </>
                    ) : (
                      <div style={{ textAlign: 'right', minWidth: 120 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{pf.amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                          {pf.label === "Employee" ? activeEmployeePf.toFixed(2) : activeEmployerPf.toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Deductions Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '1.2rem' }}>Tax Deductions</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>Professional Tax</p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Professional Tax deducted from the Gross salary</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {editing ? (
                  <input
                    className="input-field"
                    type="number"
                    value={form.taxDeduction?.professionalTaxAmount || 0}
                    onChange={e => setForm(f => ({ ...f, taxDeduction: { ...f.taxDeduction, professionalTaxAmount: e.target.value } }))}
                    style={{ padding: '0.3rem 0.5rem', width: 90, fontSize: '0.82rem' }}
                  />
                ) : (
                  <div style={{ textAlign: 'right', minWidth: 120 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>₹{activeProfessionalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// ─── Security Tab ───
function SecurityTab({ token }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPass !== confirm) { setError('Passwords do not match.'); return; }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.]).{8,}$/.test(newPass)) {
      setError('Password must be 8+ chars with 1 uppercase, 1 number, 1 special char.');
      return;
    }
    setLoading(true);
    try {
      await apiChangePassword({ currentPassword: current, newPassword: newPass }, token);
      setSuccess('Password changed successfully.');
      setCurrent(''); setNewPass(''); setConfirm('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <h3 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Change Password</h3>
      {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}><AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />{error}</div>}
      {success && <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#34d399', fontSize: '0.875rem', marginBottom: '1rem' }}><CheckCircle size={14} style={{ display: 'inline', marginRight: 6 }} />{success}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div><label className="field-label">Current Password</label><input id="sec-curr-pass" className="input-field" type={show ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} /></div>
        <div><label className="field-label">New Password</label><input id="sec-new-pass" className="input-field" type={show ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
        <div><label className="field-label">Confirm New Password</label><input id="sec-confirm-pass" className="input-field" type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={show} onChange={() => setShow(s => !s)} /> Show passwords
        </label>
        <button id="change-pass-btn" className="btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>{loading ? 'Saving…' : 'Update Password'}</button>
      </form>
    </div>
  );
}

// ─── Main Profile Page ───
export default function EmployeeProfile() {
  const { id: paramId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, isAdmin } = useAuth();

  // Support /profile/me route — resolve to current user's employee ID
  const isSelfRoute = location.pathname === '/profile/me';
  // Guard: only convert employeeId to string if it's actually set (avoids String(null) → 'null')
  const id = isSelfRoute
    ? (user?.employeeId != null ? String(user.employeeId) : null)
    : paramId;
  const isSelf = isSelfRoute || user?.employeeId === parseInt(id);

  // Employees see Salary Info only in admin context; they get a read-only overview in Private Info
  const showSalaryTab = isAdmin;
  const showPayrollInPrivate = !isAdmin && isSelf;  // employee viewing own profile

  const [emp, setEmp] = useState(null);
  const [empForm, setEmpForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');

  const canEdit = isAdmin || isSelf;

  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (id) {
      fetchEmp();
    } else if (isSelfRoute) {
      // employeeId not yet available — wait for user to be populated
      setLoading(false);
      setFetchError('Your employee profile could not be found. Please contact your HR administrator.');
    }
  }, [id]);

  async function fetchEmp() {
    setLoading(true);
    setFetchError('');
    try {
      const data = await apiGetEmployee(id, token);
      setEmp(data);
      setEmpForm(data);
    } catch (err) {
      // For the self-route (/profile/me) don't redirect — show an error message.
      // For admin browsing a specific employee, redirect back to the directory.
      if (isSelfRoute) {
        setFetchError(err?.message || 'Failed to load profile. Please try again.');
      } else {
        navigate(isAdmin ? '/employees' : '/home');
      }
    }
    finally { setLoading(false); }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setEmpForm(f => ({ ...f, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiUpdateEmployee(id, empForm, token);
      await fetchEmp();
      setEditing(false);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  const TABS = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    ...(showSalaryTab ? [{ id: 'salary', label: 'Salary Info' }] : []),
    { id: 'security', label: 'Security' },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header activeTab={isAdmin ? 'employees' : 'home'} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>Loading profile…</div>
    </div>
  );

  if (fetchError) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header activeTab={isAdmin ? 'employees' : 'home'} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--color-text-muted)' }}>
        <AlertCircle size={40} style={{ opacity: 0.4 }} />
        <p>{fetchError}</p>
        <button className="btn-secondary" onClick={fetchEmp}>Retry</button>
      </div>
    </div>
  );

  if (!emp) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Unified header with check-in/out */}
      <Header activeTab={isAdmin ? 'employees' : 'home'} />

      {/* Breadcrumb / action sub-bar */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '0 1.5rem', height: 48, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => navigate(isAdmin ? '/employees' : '/home')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontFamily: 'inherit' }}>
          <ArrowLeft size={16} /> {isAdmin ? 'All Employees' : 'Home'}
        </button>
        <span style={{ color: 'var(--color-border)' }}>|</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{emp.firstName} {emp.lastName}{isSelf ? ' (You)' : ''}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {canEdit && !editing && <button id="edit-profile-btn" className="btn-secondary" onClick={() => setEditing(true)}><Edit2 size={14} /> Edit</button>}
          {editing && <>
            <button className="btn-secondary" onClick={() => { setEditing(false); setEmpForm(emp); }}>Cancel</button>
            <button id="save-profile-btn" className="btn-primary" onClick={handleSave} disabled={saving}><Save size={14} />{saving ? ' Saving…' : ' Save'}</button>
          </>}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Profile Header */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Avatar src={emp.profilePicUrl} name={`${emp.firstName} ${emp.lastName}`} size={90} editable={editing} onEdit={() => {}} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>{emp.firstName} {emp.lastName}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{emp.jobPosition}{emp.department ? ` · ${emp.department}` : ''}</p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <span>📧 {emp.companyEmail}</span>
              {emp.mobile && <span>📱 {emp.mobile}</span>}
              {emp.location && <span>📍 {emp.location}</span>}
              {emp.user && <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>{emp.user.role}</span>}
            </div>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Login ID: {emp.user?.loginId}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="tab-bar" style={{ padding: '0 1.5rem' }}>
            {TABS.map(t => (
              <button key={t.id} id={`tab-${t.id}`} className={`tab-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)} style={{ background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>{t.label}</button>
            ))}
          </div>
          <div style={{ padding: '1.75rem' }}>
            {activeTab === 'resume' && <ResumeTab emp={empForm} editing={editing} isAdmin={isAdmin} onChange={handleChange} token={token} onRefresh={fetchEmp} />}
            {activeTab === 'private' && <PrivateInfoTab emp={empForm} editing={editing} isAdmin={isAdmin} onChange={handleChange} showPayroll={showPayrollInPrivate} empId={id} token={token} />}
            {activeTab === 'salary' && showSalaryTab && <SalaryInfoTab empId={id} token={token} />}
            {activeTab === 'security' && <SecurityTab token={token} />}
          </div>
        </div>
      </div>
    </div>
  );
}
