const { PublicHoliday } = require('../models');

async function insertHolidays() {
  const holidays = [
    { name: 'New Year Day', date: '2026-01-01', type: 'gazetted' },
    { name: 'Republic Day', date: '2026-01-26', type: 'gazetted' },
    { name: 'Independence Day', date: '2026-08-15', type: 'gazetted' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'gazetted' },
    { name: 'Christmas', date: '2026-12-25', type: 'gazetted' },
  ];

  for (const h of holidays) {
    await PublicHoliday.findOrCreate({ where: { date: h.date }, defaults: h });
  }

  console.log('✓ Public holidays initialized.');
}

if (require.main === module) {
  insertHolidays().then(() => process.exit(0));
}

module.exports = insertHolidays;
