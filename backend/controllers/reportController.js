const { Employee, User, Attendance, LeaveRequest, SalaryStructure, SalaryComponent, TaxDeduction, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * Get Analytics Summary for Dashboard
 */
async function getAnalyticsSummary(req, res) {
  try {
    let userCompanyId = req.user.employee?.companyId;
    if (!userCompanyId && req.user.employeeId) {
      const selfEmp = await Employee.findByPk(req.user.employeeId);
      userCompanyId = selfEmp?.companyId;
    }

    const companyWhere = userCompanyId ? { companyId: userCompanyId } : {};

    // 1. Total Active Employees
    const totalEmployees = await Employee.count({
      where: { ...companyWhere, isActive: true },
    });

    // 2. Today's Attendance Stats
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await Attendance.findAll({
      where: { date: today },
      include: [{ model: Employee, as: 'employee', where: { ...companyWhere, isActive: true } }],
    });

    const presentCount = todayAttendance.filter(a => a.checkIn).length;
    const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

    // 3. Pending Leave Requests
    const pendingLeaves = await LeaveRequest.count({
      where: { status: 'pending' },
      include: [{ model: Employee, as: 'employee', where: { ...companyWhere, isActive: true } }],
    });

    // 4. Monthly Company Payroll Total Mass
    const salaryStructures = await SalaryStructure.findAll({
      include: [{ model: Employee, as: 'employee', where: { ...companyWhere, isActive: true } }],
    });
    const monthlyPayrollMass = salaryStructures.reduce((acc, s) => acc + parseFloat(s.monthlyWage || 0), 0);

    // 5. Department Distribution
    const employees = await Employee.findAll({
      where: { ...companyWhere, isActive: true },
      attributes: ['department', 'jobPosition'],
    });

    const deptMap = {};
    employees.forEach(e => {
      const dept = e.department || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const departmentDistribution = Object.keys(deptMap).map(dept => ({
      name: dept,
      count: deptMap[dept],
      percentage: totalEmployees > 0 ? Math.round((deptMap[dept] / totalEmployees) * 100) : 0,
    }));

    return res.status(200).json({
      totalEmployees,
      presentCount,
      absentCount: Math.max(0, totalEmployees - presentCount),
      attendanceRate,
      pendingLeaves,
      monthlyPayrollMass: Math.round(monthlyPayrollMass),
      departmentDistribution,
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Generate Detailed Salary Slip (Payslip) for an Employee & Month/Year
 */
async function generateSalarySlip(req, res) {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query; // e.g. month=8, year=2026

    const targetEmpId = parseInt(employeeId) || req.user.employeeId;

    // Authorization check
    const isSelf = req.user.employeeId === targetEmpId;
    const isAdminOrHr = ['admin', 'hr'].includes(req.user.role);
    if (!isSelf && !isAdminOrHr) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const employee = await Employee.findByPk(targetEmpId, {
      include: [
        { model: Company, as: 'company' },
        { model: SalaryStructure, as: 'salaryStructure' },
        { model: TaxDeduction, as: 'taxDeduction' },
      ],
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Fetch Custom Components
    const components = await SalaryComponent.findAll({
      where: { salaryStructureId: employee.salaryStructure?.id || 0 },
    });

    const compMap = {};
    components.forEach(c => {
      compMap[c.name] = { type: c.computationType, val: parseFloat(c.value) };
    });

    const activeWage = parseFloat(employee.salaryStructure?.monthlyWage || 0);

    // Basic calculation
    const basicComp = compMap['basic'] || { type: 'percentage_of_basic', val: 50 };
    const basicAmt = basicComp.type === 'percentage_of_basic' ? (basicComp.val / 100) * activeWage : basicComp.val;

    // Allowances
    const hraComp = compMap['hra'] || { type: 'percentage_of_basic', val: 50 };
    const hraAmt = hraComp.type === 'percentage_of_basic' ? (hraComp.val / 100) * basicAmt : hraComp.val;

    const stdComp = compMap['standard_allowance'] || { type: 'fixed_amount', val: 4167 };
    const stdAmt = stdComp.type === 'percentage_of_basic' ? (stdComp.val / 100) * basicAmt : stdComp.val;

    const bonusComp = compMap['bonus'] || { type: 'percentage_of_basic', val: 8.33 };
    const bonusAmt = bonusComp.type === 'percentage_of_basic' ? (bonusComp.val / 100) * basicAmt : bonusComp.val;

    const ltaComp = compMap['lta'] || { type: 'percentage_of_basic', val: 8.33 };
    const ltaAmt = ltaComp.type === 'percentage_of_basic' ? (ltaComp.val / 100) * basicAmt : ltaComp.val;

    const totalCalculated = basicAmt + hraAmt + stdAmt + bonusAmt + ltaAmt;
    const fixedAmt = Math.max(0, activeWage - totalCalculated);

    // Deductions
    const employeePfPct = parseFloat(employee.taxDeduction?.employeePfPct || 12);
    const employerPfPct = parseFloat(employee.taxDeduction?.employerPfPct || 12);
    const professionalTax = parseFloat(employee.taxDeduction?.professionalTaxAmount || 200);

    const pfEmployeeAmt = (employeePfPct / 100) * basicAmt;
    const pfEmployerAmt = (employerPfPct / 100) * basicAmt;

    const totalDeductions = pfEmployeeAmt + professionalTax;
    const netSalary = Math.max(0, activeWage - totalDeductions);

    // Format Month String
    const selectedMonth = parseInt(month || (new Date().getMonth() + 1));
    const selectedYear = parseInt(year || new Date().getFullYear());
    const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'long' });

    return res.status(200).json({
      payslipPeriod: `${monthName} ${selectedYear}`,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        jobPosition: employee.jobPosition,
        department: employee.department || 'General',
        companyEmail: employee.companyEmail,
        companyName: employee.company?.name || 'HRMS Corp',
        companyLogo: employee.company?.logoUrl,
        dateOfJoining: employee.dateOfJoining,
      },
      earnings: [
        { name: 'Basic Salary', amount: Math.round(basicAmt) },
        { name: 'House Rent Allowance (HRA)', amount: Math.round(hraAmt) },
        { name: 'Standard Allowance', amount: Math.round(stdAmt) },
        { name: 'Performance Bonus', amount: Math.round(bonusAmt) },
        { name: 'Leave Travel Allowance (LTA)', amount: Math.round(ltaAmt) },
        { name: 'Special / Fixed Allowance', amount: Math.round(fixedAmt) },
      ],
      deductions: [
        { name: `Provident Fund (PF ${employeePfPct}%)`, amount: Math.round(pfEmployeeAmt) },
        { name: 'Professional Tax (PTax)', amount: Math.round(professionalTax) },
      ],
      employerContributions: [
        { name: `Employer PF (${employerPfPct}%)`, amount: Math.round(pfEmployerAmt) },
      ],
      summary: {
        grossSalary: Math.round(activeWage),
        totalDeductions: Math.round(totalDeductions),
        netSalary: Math.round(netSalary),
      },
    });
  } catch (error) {
    console.error('Error generating salary slip:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Get Monthly Attendance & Leave Summary Report
 */
async function getAttendanceReport(req, res) {
  try {
    const { month, year } = req.query;

    let userCompanyId = req.user.employee?.companyId;
    if (!userCompanyId && req.user.employeeId) {
      const selfEmp = await Employee.findByPk(req.user.employeeId);
      userCompanyId = selfEmp?.companyId;
    }

    const companyWhere = userCompanyId ? { companyId: userCompanyId } : {};

    const employees = await Employee.findAll({
      where: { ...companyWhere, isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'jobPosition', 'department'],
    });

    const targetMonth = parseInt(month || (new Date().getMonth() + 1));
    const targetYear = parseInt(year || new Date().getFullYear());

    const monthStr = String(targetMonth).padStart(2, '0');
    const startOfMonth = `${targetYear}-${monthStr}-01`;
    const endOfMonth = `${targetYear}-${monthStr}-31`;

    const logs = await Attendance.findAll({
      where: {
        date: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });

    const leaves = await LeaveRequest.findAll({
      where: {
        status: 'approved',
        startDate: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });

    const report = employees.map(emp => {
      const empLogs = logs.filter(l => l.employeeId === emp.id);
      const empLeaves = leaves.filter(l => l.employeeId === emp.id);

      const daysPresent = empLogs.filter(l => l.checkIn).length;
      const totalHours = empLogs.reduce((acc, l) => acc + (parseFloat(l.workHours) || 0), 0);
      const daysOnLeave = empLeaves.reduce((acc, l) => acc + (parseFloat(l.allocationDays) || 0), 0);

      return {
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        jobPosition: emp.jobPosition,
        department: emp.department || 'General',
        daysPresent,
        totalHours: Math.round(totalHours * 10) / 10,
        daysOnLeave,
      };
    });

    return res.status(200).json({
      period: `${targetYear}-${monthStr}`,
      report,
    });
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Get Employee Master Audit Report
 */
async function getEmployeeReport(req, res) {
  try {
    let userCompanyId = req.user.employee?.companyId;
    if (!userCompanyId && req.user.employeeId) {
      const selfEmp = await Employee.findByPk(req.user.employeeId);
      userCompanyId = selfEmp?.companyId;
    }

    const companyWhere = userCompanyId ? { companyId: userCompanyId } : {};

    const employees = await Employee.findAll({
      where: { ...companyWhere, isActive: true },
      include: [{ model: User, as: 'user', attributes: ['loginId', 'role'] }],
      order: [['id', 'ASC']],
    });

    const report = employees.map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      loginId: emp.user?.loginId || '—',
      role: emp.user?.role || 'employee',
      jobPosition: emp.jobPosition,
      department: emp.department || 'General',
      companyEmail: emp.companyEmail,
      mobile: emp.mobile || '—',
      location: emp.location || '—',
      dateOfJoining: emp.dateOfJoining || '—',
      status: emp.status || 'absent',
    }));

    return res.status(200).json({ report });
  } catch (error) {
    console.error('Error fetching employee report:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  getAnalyticsSummary,
  generateSalarySlip,
  getAttendanceReport,
  getEmployeeReport,
};
