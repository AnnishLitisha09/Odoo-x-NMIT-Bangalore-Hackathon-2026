'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employees', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      profile_pic_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      job_position: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      manager_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL',
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      company_email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dob: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      nationality: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      personal_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      marital_status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      date_of_joining: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      // Bank details
      account_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bank_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ifsc_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      pan_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      uan_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emp_code: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      // Free text
      about: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      interests: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      love_about_job: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Indexes for lookup performance
    await queryInterface.addIndex('employees', ['company_email']);
    await queryInterface.addIndex('employees', ['date_of_joining']);
    await queryInterface.addIndex('employees', ['department']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employees');
  },
};
