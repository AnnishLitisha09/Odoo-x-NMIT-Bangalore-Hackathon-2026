const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeaveBalance = sequelize.define('LeaveBalance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  paidDaysAvailable: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
    defaultValue: 24.0,
  },
  sickDaysAvailable: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
    defaultValue: 7.0,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: () => new Date().getFullYear(),
  },
}, {
  tableName: 'leave_balances',
  indexes: [
    {
      unique: true,
      fields: ['employee_id', 'year'],
    },
  ],
});

module.exports = LeaveBalance;
