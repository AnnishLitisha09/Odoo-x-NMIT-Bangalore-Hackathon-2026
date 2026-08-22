const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalaryStructure = sequelize.define('SalaryStructure', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  monthlyWage: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  yearlyWage: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  workingDaysPerWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  workingHoursPerDay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 8,
  },
}, {
  tableName: 'salary_structures',
});

module.exports = SalaryStructure;
