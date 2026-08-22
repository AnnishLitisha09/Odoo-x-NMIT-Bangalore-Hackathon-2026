const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaxDeduction = sequelize.define('TaxDeduction', {
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
  employeePfPct: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 12.00,
  },
  employerPfPct: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 12.00,
  },
  professionalTaxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 200.00,
  },
}, {
  tableName: 'tax_deductions',
});

module.exports = TaxDeduction;
