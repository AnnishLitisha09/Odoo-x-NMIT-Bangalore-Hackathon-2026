'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('employees');
    if (!tableInfo.company_id) {
      await queryInterface.addColumn('employees', 'company_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    // Set default company_id = 1 for any employees currently without company_id
    await queryInterface.sequelize.query(
      'UPDATE employees SET company_id = 1 WHERE company_id IS NULL;'
    );
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('employees');
    if (tableInfo.company_id) {
      await queryInterface.removeColumn('employees', 'company_id');
    }
  }
};
