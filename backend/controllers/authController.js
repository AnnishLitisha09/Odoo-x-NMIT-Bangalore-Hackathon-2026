const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, User, Employee, Company, LeaveBalance, SalaryStructure, TaxDeduction } = require('../models');
const { generateLoginId } = require('../utils/loginIdGenerator');

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.]).{8,}$/;

async function login(req, res) {
  try {
    const { loginIdOrEmail, password } = req.body;

    if (!loginIdOrEmail || !password) {
      return res.status(400).json({ message: 'Login ID or Email and password are required' });
    }

    // Find user by loginId or email
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { loginId: loginIdOrEmail },
          { email: loginIdOrEmail }
        ]
      },
      include: { model: Employee, as: 'employee' }
    });

    if (!user) {
      // Generic error to avoid leakage of user presence
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        mustResetPassword: user.mustResetPassword,
      },
      process.env.JWT_SECRET || 'hrms_jwt_secret_key_2026',
      { expiresIn: '24h' }
    );

    // Get company details (single-tenant default)
    const company = await Company.findOne() || { name: 'Odoo India', logoUrl: null };

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        mustResetPassword: user.mustResetPassword,
        employeeId: user.employee?.id || null,
        firstName: user.employee?.firstName || null,
        lastName: user.employee?.lastName || null,
        profilePicUrl: user.employee?.profilePicUrl || null,
        employee: user.employee
      },
      company: {
        name: company.name,
        logoUrl: company.logoUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Password validation
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character.'
      });
    }

    const user = await User.findByPk(req.user.id);

    // For first-time resets (mustResetPassword = true), we don't necessarily require currentPassword,
    // but if provided or if they are already active, we check current password.
    if (user.mustResetPassword === false && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.mustResetPassword = false;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function register(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { companyName, name, email, phone, password } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ message: 'Company name, name, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email is already registered.' });
    }

    let logoUrl = null;
    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
    }

    // Create or update company settings
    let company = await Company.findOne();
    if (company) {
      company.name = companyName;
      if (logoUrl) {
        company.logoUrl = logoUrl;
      }
      await company.save({ transaction });
    } else {
      company = await Company.create({
        name: companyName,
        logoUrl,
        defaultWorkingDaysPerWeek: 5,
        defaultWorkingHoursPerDay: 8,
        defaultPfPct: 12.00,
        defaultProfessionalTax: 200.00
      }, { transaction });
    }

    // Split name into first and last
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Admin';

    // Generate Login ID for this Admin employee
    const todayStr = new Date().toISOString().split('T')[0];
    const loginId = await generateLoginId(firstName, lastName, todayStr, companyName, Employee);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create Employee record
    const employee = await Employee.create({
      firstName,
      lastName,
      companyEmail: email,
      mobile: phone || null,
      jobPosition: 'Administrator',
      department: 'HR & IT',
      location: 'Headquarters',
      dateOfJoining: todayStr,
      empCode: loginId
    }, { transaction });

    // Create User record
    const user = await User.create({
      loginId,
      email,
      passwordHash,
      mustResetPassword: false, // Since they created their own password during Sign Up
      role: 'admin',
      employeeId: employee.id
    }, { transaction });

    // Initialize Leave Balance for current year
    const year = new Date().getFullYear();
    await LeaveBalance.create({
      employeeId: employee.id,
      paidDaysAvailable: 24.0,
      sickDaysAvailable: 7.0,
      year,
    }, { transaction });

    // Initialize default Salary Structure
    await SalaryStructure.create({
      employeeId: employee.id,
      monthlyWage: 0.00,
      yearlyWage: 0.00,
      workingDaysPerWeek: 5,
      workingHoursPerDay: 8,
    }, { transaction });

    // Initialize default Tax Deduction
    await TaxDeduction.create({
      employeeId: employee.id,
      employeePfPct: 12.00,
      employerPfPct: 12.00,
      professionalTaxAmount: 200.00,
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'Company and Admin registered successfully.',
      loginId,
      email
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Error registering company and administrator.' });
  }
}

async function getCompany(req, res) {
  try {
    const company = await Company.findOne();
    if (!company) {
      return res.status(200).json({ name: 'Odoo India', logoUrl: null });
    }
    return res.status(200).json({ name: company.name, logoUrl: company.logoUrl });
  } catch (error) {
    console.error('Error fetching company info:', error);
    return res.status(500).json({ message: 'Error fetching company configuration.' });
  }
}

module.exports = {
  login,
  changePassword,
  register,
  getCompany,
};
