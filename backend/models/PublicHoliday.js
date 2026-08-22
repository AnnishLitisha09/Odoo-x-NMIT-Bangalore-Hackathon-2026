const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PublicHoliday = sequelize.define('PublicHoliday', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'public_holidays',
  timestamps: false,
});

module.exports = PublicHoliday;
