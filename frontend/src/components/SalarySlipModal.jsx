import { Printer, Download, X, Building2, Calendar, FileText } from 'lucide-react';

export default function SalarySlipModal({ data, onClose }) {
  if (!data) return null;

  const { payslipPeriod, employee, earnings, deductions, employerContributions, summary } = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 1000 }}>
      <div className="modal-box animate-fade-in printable-payslip" style={{ maxWidth: 720, padding: '2rem', background: '#161929', border: '1px solid #2a2f45', borderRadius: 16, color: '#e2e8f0' }}>
        
        {/* Top Controls (Hidden when printing) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: '#a78bfa' }}>
            <FileText size={20} /> Payslip Preview
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              <Printer size={15} /> Print / Save PDF
            </button>
            <button className="btn-secondary" onClick={onClose} style={{ padding: '0.45rem' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Payslip Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2a2f45', paddingBottom: '1.2rem', marginBottom: '1.2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              {employee.companyLogo
                ? <img src={employee.companyLogo} alt="Company Logo" style={{ height: 32, objectFit: 'contain' }} />
                : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={16} color="white" /></div>
              }
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{employee.companyName}</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Official Salary Slip / Payslip</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', padding: '0.35rem 0.8rem', borderRadius: 8, color: '#c4b5fd', fontSize: '0.85rem', fontWeight: 600 }}>
              <Calendar size={14} /> {payslipPeriod}
            </div>
          </div>
        </div>

        {/* Employee Info Grid */}
        <div style={{ background: '#1e2235', border: '1px solid #2a2f45', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem 1.5rem', fontSize: '0.85rem' }}>
          <div><span style={{ color: '#94a3b8' }}>Employee Name:</span> <strong style={{ color: '#f8fafc' }}>{employee.name}</strong></div>
          <div><span style={{ color: '#94a3b8' }}>Employee ID:</span> <strong style={{ color: '#f8fafc' }}>#{employee.id}</strong></div>
          <div><span style={{ color: '#94a3b8' }}>Designation:</span> <strong style={{ color: '#f8fafc' }}>{employee.jobPosition}</strong></div>
          <div><span style={{ color: '#94a3b8' }}>Department:</span> <strong style={{ color: '#f8fafc' }}>{employee.department}</strong></div>
          <div><span style={{ color: '#94a3b8' }}>Email:</span> <span style={{ color: '#cbd5e1' }}>{employee.companyEmail}</span></div>
          <div><span style={{ color: '#94a3b8' }}>Date of Joining:</span> <span style={{ color: '#cbd5e1' }}>{employee.dateOfJoining || '—'}</span></div>
        </div>

        {/* Earnings vs Deductions Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          
          {/* Earnings */}
          <div style={{ background: '#191d2e', border: '1px solid #2a2f45', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: 'rgba(16,185,129,0.12)', borderBottom: '1px solid #2a2f45', padding: '0.6rem 1rem', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
              Earnings (Gross Pay)
            </div>
            <div style={{ padding: '0.5rem 1rem' }}>
              {earnings.map((e, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: idx === earnings.length - 1 ? 'none' : '1px dashed #2a2f45', fontSize: '0.82rem' }}>
                  <span style={{ color: '#cbd5e1' }}>{e.name}</span>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions */}
          <div style={{ background: '#191d2e', border: '1px solid #2a2f45', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid #2a2f45', padding: '0.6rem 1rem', color: '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>
              Deductions
            </div>
            <div style={{ padding: '0.5rem 1rem' }}>
              {deductions.map((d, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: idx === deductions.length - 1 ? 'none' : '1px dashed #2a2f45', fontSize: '0.82rem' }}>
                  <span style={{ color: '#cbd5e1' }}>{d.name}</span>
                  <span style={{ fontWeight: 600, color: '#f87171' }}>- ₹{d.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {employerContributions.map((c, idx) => (
                <div key={`emp-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                  <span>{c.name} (Benefits)</span>
                  <span>₹{c.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Net Salary Total Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 12, padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#a78bfa', margin: '0 0 0.2rem 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Salary Payable</p>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Gross Earnings (₹{summary.grossSalary.toLocaleString('en-IN')}) - Deductions (₹{summary.totalDeductions.toLocaleString('en-IN')})</p>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
            ₹{summary.netSalary.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          This is a computer-generated salary slip and does not require a signature.
        </div>

      </div>
    </div>
  );
}
