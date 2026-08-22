const sequelize = require('../config/database');
const Company = require('./Company');
const User = require('./User');
const Employee = require('./Employee');
const Skill = require('./Skill');
const Certification = require('./Certification');
const SalaryStructure = require('./SalaryStructure');
const SalaryComponent = require('./SalaryComponent');
const TaxDeduction = require('./TaxDeduction');
const Attendance = require('./Attendance');
const LeaveRequest = require('./LeaveRequest');
const LeaveBalance = require('./LeaveBalance');
const PublicHoliday = require('./PublicHoliday');
const Notification = require('./Notification');

// Associations

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Company <-> Employee

// Company <-> Employee
Company.hasMany(Employee, { foreignKey: 'companyId', as: 'employees', onDelete: 'CASCADE' });
Employee.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Employee <-> User
Employee.hasOne(User, { foreignKey: 'employeeId', as: 'user', onDelete: 'CASCADE' });
User.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee <-> Skill
Employee.hasMany(Skill, { foreignKey: 'employeeId', as: 'skills', onDelete: 'CASCADE' });
Skill.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee <-> Certification
Employee.hasMany(Certification, { foreignKey: 'employeeId', as: 'certifications', onDelete: 'CASCADE' });
Certification.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee <-> SalaryStructure
Employee.hasOne(SalaryStructure, { foreignKey: 'employeeId', as: 'salaryStructure', onDelete: 'CASCADE' });
SalaryStructure.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// SalaryStructure <-> SalaryComponent
SalaryStructure.hasMany(SalaryComponent, { foreignKey: 'salaryStructureId', as: 'components', onDelete: 'CASCADE' });
SalaryComponent.belongsTo(SalaryStructure, { foreignKey: 'salaryStructureId', as: 'salaryStructure' });

// Employee <-> TaxDeduction
Employee.hasOne(TaxDeduction, { foreignKey: 'employeeId', as: 'taxDeduction', onDelete: 'CASCADE' });
TaxDeduction.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee <-> Attendance
Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances', onDelete: 'CASCADE' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee <-> LeaveRequest
Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId', as: 'leaveRequests', onDelete: 'CASCADE' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee <-> LeaveBalance
Employee.hasMany(LeaveBalance, { foreignKey: 'employeeId', as: 'leaveBalances', onDelete: 'CASCADE' });
LeaveBalance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

module.exports = {
  sequelize,
  Company,
  User,
  Employee,
  Skill,
  Certification,
  SalaryStructure,
  SalaryComponent,
  TaxDeduction,
  Attendance,
  LeaveRequest,
  LeaveBalance,
  PublicHoliday,
  Notification,
};
