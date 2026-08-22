const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  workHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  extraHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'half_day', 'leave'),
    allowNull: false,
    defaultValue: 'absent',
  },
}, {
  tableName: 'attendances',
  indexes: [
    {
      unique: true,
      fields: ['employee_id', 'date'],
    },
  ],
});

module.exports = Attendance;
