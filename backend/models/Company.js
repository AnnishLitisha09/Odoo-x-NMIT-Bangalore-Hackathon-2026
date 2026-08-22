const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Odoo India',
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  defaultWorkingDaysPerWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  defaultWorkingHoursPerDay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 8,
  },
  defaultPfPct: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 12.00,
  },
  defaultProfessionalTax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 200.00,
  },
}, {
  tableName: 'companies',
});

module.exports = Company;
