'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 1. Seed company
    const companyExists = await queryInterface.sequelize.query(
      'SELECT id FROM companies LIMIT 1',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (companyExists.length === 0) {
      await queryInterface.bulkInsert('companies', [{
        name: 'Odoo India',
        logo_url: null,
        default_working_days_per_week: 5,
        default_working_hours_per_day: 8,
        default_pf_pct: 12.00,
        default_professional_tax: 200.00,
        created_at: new Date(),
        updated_at: new Date(),
      }]);
    }

    // 2. Seed admin employee
    const adminExists = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE login_id = 'admin' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (adminExists.length === 0) {
      // Insert admin employee record
      await queryInterface.bulkInsert('employees', [{
        first_name: 'System',
        last_name: 'Admin',
        company_email: 'admin@company.com',
        mobile: '+919999999999',
        job_position: 'Administrator',
        department: 'HR & IT',
        location: 'Mumbai, India',
        date_of_joining: '2026-07-04',
        emp_code: 'ADMIN001',
        created_at: new Date(),
        updated_at: new Date(),
      }]);

      const [adminEmpRow] = await queryInterface.sequelize.query(
        "SELECT id FROM employees WHERE company_email = 'admin@company.com' LIMIT 1",
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      const adminEmpId = adminEmpRow.id;

      // Insert admin user
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Password123!', salt);

      await queryInterface.bulkInsert('users', [{
        login_id: 'admin',
        email: 'admin@company.com',
        password_hash: passwordHash,
        must_reset_password: false,
        role: 'admin',
        employee_id: adminEmpId,
        created_at: new Date(),
        updated_at: new Date(),
      }]);

      // Initialize leave balance for admin
      await queryInterface.bulkInsert('leave_balances', [{
        employee_id: adminEmpId,
        paid_days_available: 24.0,
        sick_days_available: 7.0,
        year: 2026,
        created_at: new Date(),
        updated_at: new Date(),
      }]);

      // Initialize salary structure
      await queryInterface.bulkInsert('salary_structures', [{
        employee_id: adminEmpId,
        monthly_wage: 100000.00,
        yearly_wage: 1200000.00,
        working_days_per_week: 5,
        working_hours_per_day: 8,
        created_at: new Date(),
        updated_at: new Date(),
      }]);

      const [salaryRow] = await queryInterface.sequelize.query(
        `SELECT id FROM salary_structures WHERE employee_id = ${adminEmpId} LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      // Initialize salary components for admin
      await queryInterface.bulkInsert('salary_components', [
        { salary_structure_id: salaryRow.id, name: 'basic', computation_type: 'fixed_amount', value: 50000.00, computed_amount: 50000.00 },
        { salary_structure_id: salaryRow.id, name: 'hra', computation_type: 'percentage_of_basic', value: 50, computed_amount: 25000.00 },
        { salary_structure_id: salaryRow.id, name: 'standard_allowance', computation_type: 'fixed_amount', value: 5000.00, computed_amount: 5000.00 },
        { salary_structure_id: salaryRow.id, name: 'bonus', computation_type: 'percentage_of_basic', value: 10, computed_amount: 5000.00 },
        { salary_structure_id: salaryRow.id, name: 'lta', computation_type: 'fixed_amount', value: 3000.00, computed_amount: 3000.00 },
        { salary_structure_id: salaryRow.id, name: 'fixed_allowance', computation_type: 'fixed_amount', value: 12000.00, computed_amount: 12000.00 },
      ]);

      // Initialize tax deductions
      await queryInterface.bulkInsert('tax_deductions', [{
        employee_id: adminEmpId,
        employee_pf_pct: 12.00,
        employer_pf_pct: 12.00,
        professional_tax_amount: 200.00,
        created_at: new Date(),
        updated_at: new Date(),
      }]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { login_id: 'admin' });
    await queryInterface.bulkDelete('employees', { company_email: 'admin@company.com' });
    await queryInterface.bulkDelete('companies', null);
  },
};
