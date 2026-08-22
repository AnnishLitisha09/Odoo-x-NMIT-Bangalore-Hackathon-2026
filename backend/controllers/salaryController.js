const { sequelize, SalaryStructure, SalaryComponent, TaxDeduction, Employee } = require('../models');

async function getSalaryInfo(req, res) {
  try {
    const { id } = req.params; // employeeId

    const salaryStructure = await SalaryStructure.findOne({
      where: { employeeId: id },
      include: [{ model: SalaryComponent, as: 'components' }]
    });

    const taxDeduction = await TaxDeduction.findOne({
      where: { employeeId: id }
    });

    if (!salaryStructure) {
      return res.status(404).json({ message: 'Salary structure not found for this employee.' });
    }

    return res.status(200).json({
      salaryStructure,
      taxDeduction,
    });
  } catch (error) {
    console.error('Error fetching salary info:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function updateSalaryInfo(req, res) {
  const { id } = req.params; // employeeId
  const { monthlyWage, workingDaysPerWeek, workingHoursPerDay, components, taxDeduction } = req.body;

  const transaction = await sequelize.transaction();
  try {
    const salaryStructure = await SalaryStructure.findOne({
      where: { employeeId: id },
      transaction
    });

    if (!salaryStructure) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Salary structure not found.' });
    }

    // 1. Update general structure
    const updatedWage = monthlyWage !== undefined ? parseFloat(monthlyWage) : parseFloat(salaryStructure.monthlyWage);
    salaryStructure.monthlyWage = updatedWage;
    salaryStructure.yearlyWage = updatedWage * 12;
    if (workingDaysPerWeek !== undefined) salaryStructure.workingDaysPerWeek = workingDaysPerWeek;
    if (workingHoursPerDay !== undefined) salaryStructure.workingHoursPerDay = workingHoursPerDay;
    await salaryStructure.save({ transaction });

    // 2. Process and compute salary components
    if (components && Array.isArray(components)) {
      // Find basic first because percentages are calculated based on basic
      const basicInput = components.find(c => c.name === 'basic') || {
        computationType: 'fixed_amount',
        value: 0
      };

      let basicAmount = 0.00;
      if (basicInput.computationType === 'percentage_of_basic') {
        // For basic component, percentage_of_basic is treated as percentage of monthlyWage
        basicAmount = (parseFloat(basicInput.value) / 100) * updatedWage;
      } else {
        basicAmount = parseFloat(basicInput.value || 0);
      }

      let otherSum = 0.00;
      const computedComponents = [];

      // Add basic first
      computedComponents.push({
        name: 'basic',
        computationType: basicInput.computationType,
        value: parseFloat(basicInput.value || 0),
        computedAmount: parseFloat(basicAmount.toFixed(2))
      });

      // Calculate other components except fixed_allowance
      for (const comp of components) {
        if (comp.name === 'basic' || comp.name === 'fixed_allowance') continue;

        let compAmount = 0.00;
        const val = parseFloat(comp.value || 0);

        if (comp.computationType === 'percentage_of_basic') {
          compAmount = (val / 100) * basicAmount;
        } else {
          compAmount = val;
        }

        otherSum += compAmount;

        computedComponents.push({
          name: comp.name,
          computationType: comp.computationType,
          value: val,
          computedAmount: parseFloat(compAmount.toFixed(2))
        });
      }

      const totalWithoutFixed = parseFloat((basicAmount + otherSum).toFixed(2));

      if (totalWithoutFixed > updatedWage) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Validation Error: Sum of defined components (${totalWithoutFixed.toFixed(2)}) exceeds monthly wage (${updatedWage.toFixed(2)}).`
        });
      }

      // Compute fixed allowance as residual
      const fixedAmount = parseFloat((updatedWage - totalWithoutFixed).toFixed(2));
      computedComponents.push({
        name: 'fixed_allowance',
        computationType: 'fixed_amount',
        value: parseFloat(fixedAmount.toFixed(2)),
        computedAmount: parseFloat(fixedAmount.toFixed(2))
      });

      // Delete existing components and bulk insert new ones
      await SalaryComponent.destroy({
        where: { salaryStructureId: salaryStructure.id },
        transaction
      });

      const componentsToSave = computedComponents.map(c => ({
        salaryStructureId: salaryStructure.id,
        name: c.name,
        computationType: c.computationType,
        value: c.value,
        computedAmount: c.computedAmount
      }));

      await SalaryComponent.bulkCreate(componentsToSave, { transaction });
    }

    // 3. Update tax deductions
    if (taxDeduction) {
      const dbTax = await TaxDeduction.findOne({ where: { employeeId: id }, transaction });
      if (dbTax) {
        if (taxDeduction.employeePfPct !== undefined) dbTax.employeePfPct = taxDeduction.employeePfPct;
        if (taxDeduction.employerPfPct !== undefined) dbTax.employerPfPct = taxDeduction.employerPfPct;
        if (taxDeduction.professionalTaxAmount !== undefined) dbTax.professionalTaxAmount = taxDeduction.professionalTaxAmount;
        await dbTax.save({ transaction });
      }
    }

    await transaction.commit();

    // Fetch updated data to return
    const result = await SalaryStructure.findOne({
      where: { employeeId: id },
      include: [{ model: SalaryComponent, as: 'components' }]
    });
    const updatedTax = await TaxDeduction.findOne({ where: { employeeId: id } });

    return res.status(200).json({
      message: 'Salary structure updated successfully.',
      salaryStructure: result,
      taxDeduction: updatedTax
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating salary structure:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  getSalaryInfo,
  updateSalaryInfo,
};
