function generateLoginId(name, companyCode = 'NMIT') {
  const cleanName = (name || 'EMP').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4);
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `${companyCode}-${cleanName}-${randNum}`;
}

module.exports = { generateLoginId };
