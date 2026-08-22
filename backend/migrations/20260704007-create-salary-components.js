'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('salary_components', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      salary_structure_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'salary_structures', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.ENUM(
          'basic',
          'hra',
          'standard_allowance',
          'bonus',
          'lta',
          'fixed_allowance'
        ),
        allowNull: false,
      },
      computation_type: {
        type: Sequelize.ENUM('fixed_amount', 'percentage_of_basic'),
        allowNull: false,
        defaultValue: 'fixed_amount',
      },
      value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      computed_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
    });

    await queryInterface.addIndex('salary_components', ['salary_structure_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('salary_components');
  },
};
