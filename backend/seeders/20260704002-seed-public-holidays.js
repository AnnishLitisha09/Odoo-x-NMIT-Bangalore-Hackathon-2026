'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS cnt FROM public_holidays',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existing[0].cnt === 0 || existing[0].cnt === '0') {
      await queryInterface.bulkInsert('public_holidays', [
        { name: 'Republic Day',         date: '2026-01-26' },
        { name: 'Holi',                 date: '2026-03-17' },
        { name: 'Good Friday',          date: '2026-04-03' },
        { name: 'Dr. Ambedkar Jayanti', date: '2026-04-14' },
        { name: 'Ram Navami',           date: '2026-04-08' },
        { name: 'Maharashtra Day',      date: '2026-05-01' },
        { name: 'Independence Day',     date: '2026-08-15' },
        { name: 'Gandhi Jayanti',       date: '2026-10-02' },
        { name: 'Dussehra',            date: '2026-10-19' },
        { name: 'Diwali',              date: '2026-11-07' },
        { name: 'Diwali (Lakshmi Puja)', date: '2026-11-08' },
        { name: 'Guru Nanak Jayanti',  date: '2026-11-22' },
        { name: 'Christmas Day',        date: '2026-12-25' },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('public_holidays', null);
  },
};
