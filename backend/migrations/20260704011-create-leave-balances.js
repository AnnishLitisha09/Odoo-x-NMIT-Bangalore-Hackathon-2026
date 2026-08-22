'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_balances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      paid_days_available: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: false,
        defaultValue: 24.0,
      },
      sick_days_available: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: false,
        defaultValue: 7.0,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    // Composite unique: one balance row per employee per year
    await queryInterface.addIndex('leave_balances', ['employee_id', 'year'], {
      unique: true,
      name: 'leave_balance_employee_year_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('leave_balances');
  },
};
