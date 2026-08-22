import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, FileText, CalendarDays, Users, TrendingUp, DollarSign,
  CheckCircle, AlertTriangle, Download, Filter, Search, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  apiGetAnalyticsSummary, apiGetSalarySlip, apiGetAttendanceReport, apiGetEmployees
} from '../api/client';
import Header from '../components/Header';
import SalarySlipModal from '../components/SalarySlipModal';

export default function ReportsView() {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('analytics');

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Salary Slip State
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salarySlipData, setSalarySlipData] = useState(null);
  const [loadingSlip, setLoadingSlip] = useState(false);

  // Attendance Report State
  const [attReportMonth, setAttReportMonth] = useState(new Date().getMonth() + 1);
  const [attReportYear, setAttReportYear] = useState(new Date().getFullYear());
  const [attReportData, setAttReportData] = useState([]);
  const [loadingAttReport, setLoadingAttReport] = useState(false);
  const [attSearch, setAttSearch] = useState('');

  useEffect(() => {
    fetchAnalytics();
    if (isAdmin) {
      fetchEmployeeList();
    } else if (user?.employeeId) {
      setSelectedEmpId(String(user.employeeId));
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceReport();
    }
  }, [activeTab, attReportMonth, attReportYear]);

  async function fetchAnalytics() {
    setLoadingAnalytics(true);
    try {
      const data = await apiGetAnalyticsSummary(token);
      setAnalytics(data);
    } catch { /* silent */ }
    finally { setLoadingAnalytics(false); }
  }

  async function fetchEmployeeList() {
    try {
      const list = await apiGetEmployees(token);
      setEmployees(list || []);
      if (list && list.length > 0) {
        setSelectedEmpId(String(list[0].id));
      }
    } catch { /* silent */ }
  }

  async function handleGenerateSlip(e) {
    if (e) e.preventDefault();
    const empIdToFetch = selectedEmpId || user?.employeeId;
    if (!empIdToFetch) return;

    setLoadingSlip(true);
    try {
      const data = await apiGetSalarySlip(empIdToFetch, selectedMonth, selectedYear, token);
      setSalarySlipData(data);
    } catch (err) {
      alert(err.message || 'Failed to generate salary slip.');
    } finally {
      setLoadingSlip(false);
    }
  }

  async function fetchAttendanceReport() {
    setLoadingAttReport(true);
    try {
      const res = await apiGetAttendanceReport(attReportMonth, attReportYear, token);
      setAttReportData(res.report || []);
    } catch { /* silent */ }
    finally { setLoadingAttReport(false); }
  }

  function exportCSV() {
    if (attReportData.length === 0) return;

    const headers = ['Employee ID', 'Name', 'Department', 'Job Position', 'Days Present', 'Days On Leave', 'Total Work Hours'];
    const rows = attReportData.map(r => [
      r.employeeId,
      `"${r.name}"`,
      `"${r.department}"`,
      `"${r.jobPosition}"`,
      r.daysPresent,
      r.daysOnLeave,
      r.totalHours
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${attReportYear}_${attReportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const filteredAttReport = attReportData.filter(r =>
    r.name.toLowerCase().includes(attSearch.toLowerCase()) ||
    r.department.toLowerCase().includes(attSearch.toLowerCase()) ||
    r.jobPosition.toLowerCase().includes(attSearch.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <Header activeTab="reports" />

      <main style={{ flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '2rem 1.5rem' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Analytics & Reports</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0 0' }}>Comprehensive Insights, Salary Slips & Attendance Audits</p>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="card" style={{ padding: '0.4rem', marginBottom: '1.5rem', display: 'inline-flex', gap: '0.4rem', flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%', scrollbarWidth: 'none' }}>
          <button
            className={`btn-secondary ${activeTab === 'analytics' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('analytics')}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontSize: '0.85rem', borderRadius: 8, border: 'none', background: activeTab === 'analytics' ? 'rgba(124,58,237,0.2)' : 'transparent', color: activeTab === 'analytics' ? 'var(--color-accent-light)' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 600 }}>
            <BarChart3 size={16} /> Analytics Overview
          </button>
          <button
            className={`btn-secondary ${activeTab === 'salary' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('salary')}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontSize: '0.85rem', borderRadius: 8, border: 'none', background: activeTab === 'salary' ? 'rgba(124,58,237,0.2)' : 'transparent', color: activeTab === 'salary' ? 'var(--color-accent-light)' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 600 }}>
            <FileText size={16} /> Salary Slips
          </button>
          <button
            className={`btn-secondary ${activeTab === 'attendance' ? 'active-tab' : ''}`}
            onClick={() => setActiveTab('attendance')}
            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontSize: '0.85rem', borderRadius: 8, border: 'none', background: activeTab === 'attendance' ? 'rgba(124,58,237,0.2)' : 'transparent', color: activeTab === 'attendance' ? 'var(--color-accent-light)' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 600 }}>
            <CalendarDays size={16} /> Attendance Report
          </button>
        </div>

        {/* ── Tab 1: Analytics Overview ── */}
        {activeTab === 'analytics' && (
          loadingAnalytics ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading analytics summary…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Summary Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                
                <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>Active Headcount</p>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', margin: '0.1rem 0 0 0' }}>{analytics?.totalEmployees || 0}</h3>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>Attendance Rate</p>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', margin: '0.1rem 0 0 0' }}>{analytics?.attendanceRate || 0}%</h3>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>Pending Leaves</p>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', margin: '0.1rem 0 0 0' }}>{analytics?.pendingLeaves || 0}</h3>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>Monthly Payroll Mass</p>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', margin: '0.1rem 0 0 0' }}>₹{(analytics?.monthlyPayrollMass || 0).toLocaleString('en-IN')}</h3>
                  </div>
                </div>

              </div>

              {/* Attendance Breakdown & Department Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                
                {/* Attendance Today */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1.25rem' }}>Today's Presence Breakdown</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--color-text)' }}>Checked In (Present)</span>
                        <span style={{ fontWeight: 700, color: '#34d399' }}>{analytics?.presentCount}</span>
                      </div>
                      <div style={{ height: 8, width: '100%', background: 'var(--color-surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${analytics?.attendanceRate || 0}%`, background: '#10b981', borderRadius: 999 }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--color-text)' }}>Absent / Not Checked In</span>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>{analytics?.absentCount}</span>
                      </div>
                      <div style={{ height: 8, width: '100%', background: 'var(--color-surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${100 - (analytics?.attendanceRate || 0)}%`, background: '#f59e0b', borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Department Distribution */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1.25rem' }}>Department Distribution</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {analytics?.departmentDistribution?.map((d, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{d.name}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>{d.count} emp ({d.percentage}%)</span>
                        </div>
                        <div style={{ height: 6, width: '100%', background: 'var(--color-surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${d.percentage}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)', borderRadius: 999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )
        )}

        {/* ── Tab 2: Salary Slips ── */}
        {activeTab === 'salary' && (
          <div className="card" style={{ padding: '2rem', maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.4rem' }}>Generate Employee Salary Slip</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Select the month, year, and employee to generate a printable payslip.</p>

            <form onSubmit={handleGenerateSlip} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Employee Selector (Admin only) */}
              {isAdmin ? (
                <div>
                  <label className="field-label">Select Employee</label>
                  <select
                    className="input-field"
                    value={selectedEmpId}
                    onChange={e => setSelectedEmpId(e.target.value)}
                    required>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} — {emp.jobPosition} ({emp.department || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="field-label">Employee</label>
                  <input className="input-field" value={`${user?.firstName} ${user?.lastName}`} disabled />
                </div>
              )}

              {/* Month and Year Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="field-label">Month</label>
                  <select
                    className="input-field"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">Year</label>
                  <select
                    className="input-field"
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}>
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              <button className="btn-primary" type="submit" disabled={loadingSlip} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem' }}>
                <FileText size={16} /> {loadingSlip ? 'Generating Payslip…' : 'Generate & View Payslip'}
              </button>
            </form>
          </div>
        )}

        {/* ── Tab 3: Attendance Report ── */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Report Filters Toolbar */}
            <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--color-text-muted)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>Filters:</span>
              </div>

              <select
                className="input-field"
                value={attReportMonth}
                onChange={e => setAttReportMonth(parseInt(e.target.value))}
                style={{ width: 140 }}>
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                className="input-field"
                value={attReportYear}
                onChange={e => setAttReportYear(parseInt(e.target.value))}
                style={{ width: 100 }}>
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>

              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  className="input-field"
                  placeholder="Filter by name, department..."
                  value={attSearch}
                  onChange={e => setAttSearch(e.target.value)}
                  style={{ paddingLeft: '2.2rem' }}
                />
              </div>

              <button className="btn-secondary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}>
                <Download size={14} /> Export CSV
              </button>
            </div>

            {/* Attendance Report Table */}
            <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
              {loadingAttReport ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading attendance report…</div>
              ) : filteredAttReport.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No attendance records found for this period.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Employee</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Department</th>
                      <th style={{ padding: '0.85rem 1.25rem' }}>Job Position</th>
                      <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>Days Present</th>
                      <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>Days On Leave</th>
                      <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttReport.map(r => (
                      <tr key={r.employeeId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--color-text)' }}>{r.name}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>{r.department}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: 'var(--color-text-muted)' }}>{r.jobPosition}</td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                          <span className="badge badge-green">{r.daysPresent} days</span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                          <span className="badge badge-yellow">{r.daysOnLeave} days</span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-text)' }}>
                          {r.totalHours} hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Salary Slip Modal */}
      {salarySlipData && (
        <SalarySlipModal
          data={salarySlipData}
          onClose={() => setSalarySlipData(null)}
        />
      )}
    </div>
  );
}
