'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Odoo India',
      },
      logo_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      default_working_days_per_week: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      default_working_hours_per_day: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 8,
      },
      default_pf_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 12.00,
      },
      default_professional_tax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 200.00,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('companies');
  },
};
