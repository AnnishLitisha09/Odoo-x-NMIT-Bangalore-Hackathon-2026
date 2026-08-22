'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('employees');
    if (!tableInfo.is_active) {
      await queryInterface.addColumn('employees', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    await queryInterface.sequelize.query(
      'UPDATE employees SET is_active = true WHERE is_active IS NULL;'
    );
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('employees');
    if (tableInfo.is_active) {
      await queryInterface.removeColumn('employees', 'is_active');
    }
  }
};
