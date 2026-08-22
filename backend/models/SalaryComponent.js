const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalaryComponent = sequelize.define('SalaryComponent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  salaryStructureId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.ENUM('basic', 'hra', 'standard_allowance', 'bonus', 'lta', 'fixed_allowance'),
    allowNull: false,
  },
  computationType: {
    type: DataTypes.ENUM('fixed_amount', 'percentage_of_basic'),
    allowNull: false,
    defaultValue: 'fixed_amount',
  },
  value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  computedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'salary_components',
  timestamps: false,
});

module.exports = SalaryComponent;
