const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, User, Employee, Skill, Certification, LeaveBalance, SalaryStructure, TaxDeduction, Attendance, LeaveRequest, Company } = require('../models');
const { generateLoginId } = require('../utils/loginIdGenerator');
const { generateTempPassword } = require('../utils/passwordGenerator');

async function createEmployee(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const {
      firstName,
      lastName,
      companyEmail,
      mobile,
      role, // 'admin', 'hr', 'employee'
      jobPosition,
      department,
      managerId,
      location,
      dateOfJoining,
      dob,
      address,
      nationality,
      personalEmail,
      gender,
      maritalStatus,
      // Bank details
      accountNumber,
      bankName,
      ifscCode,
      panNo,
      uanNo,
      empCode,
    } = req.body;

    if (!firstName || !lastName || !companyEmail || !dateOfJoining || !jobPosition) {
      return res.status(400).json({ message: 'First name, last name, company email, date of joining, and job position are required.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: companyEmail } });
    const existingEmp = await Employee.findOne({ where: { companyEmail } });
    if (existingUser || existingEmp) {
      return res.status(400).json({ message: 'Employee with this company email already exists.' });
    }

    // Get company name for login ID generation
    const company = await Company.findOne();
    const companyName = company ? company.name : 'Odoo India';

    // Generate Login ID
    const loginId = await generateLoginId(firstName, lastName, dateOfJoining, companyName, Employee);

    // Generate Temp Password
    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    // Create Employee record
    const employee = await Employee.create({
      firstName,
      lastName,
      companyEmail,
      mobile,
      jobPosition,
      department,
      managerId: managerId || null,
      location,
      dateOfJoining,
      dob,
      address,
      nationality,
      personalEmail,
      gender,
      maritalStatus,
      accountNumber,
      bankName,
      ifscCode,
      panNo,
      uanNo,
      empCode: empCode || loginId, // Default to loginId if not specified
    }, { transaction });

    // Create User record
    const user = await User.create({
      loginId,
      email: companyEmail,
      passwordHash,
      mustResetPassword: true,
      role: role || 'employee',
      employeeId: employee.id,
    }, { transaction });

    // Initialize Leave Balance for current year
    const year = new Date(dateOfJoining).getFullYear();
    await LeaveBalance.create({
      employeeId: employee.id,
      paidDaysAvailable: 24.0,
      sickDaysAvailable: 7.0,
      year,
    }, { transaction });

    // Initialize default Salary Structure
    const defaultWorkingDays = company ? company.defaultWorkingDaysPerWeek : 5;
    const defaultWorkingHours = company ? company.defaultWorkingHoursPerDay : 8;
    const salaryStructure = await SalaryStructure.create({
      employeeId: employee.id,
      monthlyWage: 0.00,
      yearlyWage: 0.00,
      workingDaysPerWeek: defaultWorkingDays,
      workingHoursPerDay: defaultWorkingHours,
    }, { transaction });

    // Initialize default Tax Deduction
    const defaultPf = company ? company.defaultPfPct : 12.00;
    const defaultPt = company ? company.defaultProfessionalTax : 200.00;
    await TaxDeduction.create({
      employeeId: employee.id,
      employeePfPct: defaultPf,
      employerPfPct: defaultPf,
      professionalTaxAmount: defaultPt,
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'Employee created successfully',
      employee,
      credentials: {
        loginId,
        email: companyEmail,
        tempPassword,
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating employee:', error);
    return res.status(500).json({ message: 'Error creating employee record.' });
  }
}

async function getEmployees(req, res) {
  try {
    const { search } = req.query;
    let whereClause = {};

    if (search) {
      whereClause = {
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { jobPosition: { [Op.like]: `%${search}%` } },
        ]
      };
    }

    // Exclude the current user's own employee record from the list
    const selfEmployeeId = req.user.employeeId;
    if (selfEmployeeId) {
      whereClause.id = { [Op.ne]: selfEmployeeId };
    }

    const employees = await Employee.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['role', 'loginId'] }
      ]
    });

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch all check-ins for today
    const attendancesToday = await Attendance.findAll({
      where: { date: todayStr }
    });

    // Fetch all active approved leaves today
    const leavesToday = await LeaveRequest.findAll({
      where: {
        status: 'approved',
        startDate: { [Op.lte]: todayStr },
        endDate: { [Op.gte]: todayStr }
      }
    });

    // Map status dots
    const attendanceMap = new Map(attendancesToday.map(a => [a.employeeId, a]));
    const leaveMap = new Map(leavesToday.map(l => [l.employeeId, l]));

    const result = employees.map(emp => {
      let status = 'absent'; // Yellow dot default
      const hasAttendance = attendanceMap.get(emp.id);
      const hasApprovedLeave = leaveMap.get(emp.id);

      if (hasApprovedLeave) {
        status = 'leave'; // Airplane icon
      } else if (hasAttendance && hasAttendance.checkIn) {
        status = 'present'; // Green dot
      }

      return {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        profilePicUrl: emp.profilePicUrl,
        jobPosition: emp.jobPosition,
        department: emp.department,
        location: emp.location,
        companyEmail: emp.companyEmail,
        status,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'loginId', 'role'] },
        { model: Skill, as: 'skills' },
        { model: Certification, as: 'certifications' },
        { model: LeaveBalance, as: 'leaveBalances' }
      ]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    return res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const isSelf = req.user.employeeId === parseInt(id);
    const isAdminOrHr = ['admin', 'hr'].includes(req.user.role);

    if (!isSelf && !isAdminOrHr) {
      return res.status(403).json({ message: 'Access denied: You can only edit your own profile.' });
    }

    let updateData = {};

    if (isAdminOrHr) {
      // Admin/HR can edit everything
      updateData = req.body;
    } else {
      // Employee editing self: only allowed certain fields
      // Edit rules: Profile picture, mobile, address, about, interests, loveAboutJob
      const allowedFields = ['mobile', 'address', 'profilePicUrl', 'about', 'interests', 'loveAboutJob'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
    }

    await employee.update(updateData);

    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'loginId', 'role'] },
        { model: Skill, as: 'skills' },
        { model: Certification, as: 'certifications' }
      ]
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Skill Management
async function addSkill(req, res) {
  try {
    const { employeeId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Skill name is required.' });
    }

    const isSelf = req.user.employeeId === parseInt(employeeId);
    const isAdminOrHr = ['admin', 'hr'].includes(req.user.role);

    if (!isSelf && !isAdminOrHr) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const skill = await Skill.create({
      employeeId: parseInt(employeeId),
      name: name.trim()
    });

    return res.status(201).json(skill);
  } catch (error) {
    console.error('Error adding skill:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function removeSkill(req, res) {
  try {
    const { employeeId, id } = req.params;

    const isSelf = req.user.employeeId === parseInt(employeeId);
    const isAdminOrHr = ['admin', 'hr'].includes(req.user.role);

    if (!isSelf && !isAdminOrHr) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const skill = await Skill.findOne({
      where: { id, employeeId }
    });

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' });
    }

    await skill.destroy();
    return res.status(200).json({ message: 'Skill removed.' });
  } catch (error) {
    console.error('Error removing skill:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Certification Management
async function addCertification(req, res) {
  try {
    const { employeeId } = req.params;
    const { name, issuedBy, date } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Certification name is required.' });
    }

    const isSelf = req.user.employeeId === parseInt(employeeId);
    const isAdminOrHr = ['admin', 'hr'].includes(req.user.role);

    if (!isSelf && !isAdminOrHr) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const certification = await Certification.create({
      employeeId: parseInt(employeeId),
      name: name.trim(),
      issuedBy: issuedBy ? issuedBy.trim() : null,
      date: date || null,
    });

    return res.status(201).json(certification);
  } catch (error) {
    console.error('Error adding certification:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function removeCertification(req, res) {
  try {
    const { employeeId, id } = req.params;

    const isSelf = req.user.employeeId === parseInt(employeeId);
    const isAdminOrHr = ['admin', 'hr'].includes(req.user.role);

    if (!isSelf && !isAdminOrHr) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const cert = await Certification.findOne({
      where: { id, employeeId }
    });

    if (!cert) {
      return res.status(404).json({ message: 'Certification not found.' });
    }

    await cert.destroy();
    return res.status(200).json({ message: 'Certification removed.' });
  } catch (error) {
    console.error('Error removing certification:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  addSkill,
  removeSkill,
  addCertification,
  removeCertification,
};
