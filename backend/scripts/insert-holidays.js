const db = require('../config/database');

const EXTRA = [
  { name: 'Holi',                  date: '2026-03-17' },
  { name: 'Good Friday',           date: '2026-04-03' },
  { name: 'Ram Navami',            date: '2026-04-08' },
  { name: 'Dr. Ambedkar Jayanti', date: '2026-04-14' },
  { name: 'Maharashtra Day',       date: '2026-05-01' },
  { name: 'Dussehra',             date: '2026-10-19' },
  { name: 'Diwali',               date: '2026-11-07' },
  { name: 'Diwali (Lakshmi Puja)', date: '2026-11-08' },
  { name: 'Guru Nanak Jayanti',   date: '2026-11-22' },
];

async function run() {
  await db.authenticate();
  for (const h of EXTRA) {
    await db.query(
      'INSERT IGNORE INTO public_holidays (name, date) VALUES (?, ?)',
      { replacements: [h.name, h.date] }
    );
    console.log('Inserted (or ignored):', h.name);
  }
  const [[row]] = await db.query('SELECT COUNT(*) AS cnt FROM public_holidays');
  console.log('Total public holidays now:', row.cnt);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
