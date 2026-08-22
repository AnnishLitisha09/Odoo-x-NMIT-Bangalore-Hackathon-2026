const { Op } = require('sequelize');

function getCompanyInitials(companyName) {
  if (!companyName) return 'HR';
  // Strip special chars and trim
  const cleanName = companyName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleanName.split(/\s+/);
  
  if (words.length >= 2) {
    // Take first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (cleanName.length >= 2) {
    // If single word, take first two letters
    return cleanName.substring(0, 2).toUpperCase();
  }
  return cleanName.toUpperCase().padEnd(2, 'X');
}

function getNamePart(firstName, lastName) {
  const cleanFirst = (firstName || '').replace(/[^a-zA-Z]/g, '').trim();
  const cleanLast = (lastName || '').replace(/[^a-zA-Z]/g, '').trim();
  
  let firstPart = cleanFirst.substring(0, 2).toUpperCase();
  if (firstPart.length < 2) firstPart = firstPart.padEnd(2, 'X');
  
  let lastPart = cleanLast.substring(0, 2).toUpperCase();
  if (lastPart.length < 2) lastPart = lastPart.padEnd(2, 'X');
  
  return firstPart + lastPart;
}

async function generateLoginId(firstName, lastName, dateOfJoining, companyName, EmployeeModel) {
  const companyInitials = getCompanyInitials(companyName);
  const namePart = getNamePart(firstName, lastName);
  
  const joiningDate = new Date(dateOfJoining);
  const year = isNaN(joiningDate.getTime()) ? new Date().getFullYear() : joiningDate.getFullYear();
  
  // Query to count how many employees joined in this specific year
  // In Sequelize, we search for employees where dateOfJoining is between year-01-01 and year-12-31
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;
  
  let count = 0;
  if (EmployeeModel) {
    count = await EmployeeModel.count({
      where: {
        dateOfJoining: {
          [Op.between]: [startOfYear, endOfYear]
        }
      }
    });
  }
  
  const serialNumber = String(count + 1).padStart(4, '0');
  
  return `${companyInitials}${namePart}${year}${serialNumber}`;
}

module.exports = {
  generateLoginId,
  getCompanyInitials,
  getNamePart
};
