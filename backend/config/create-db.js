const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Creates the MySQL database if it does not already exist.
 * Does NOT drop the existing database — schema changes are
 * managed exclusively through Sequelize CLI migrations.
 */
async function createDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`✅  Database '${process.env.DB_NAME}' is ready.`);
  } catch (error) {
    console.error('❌  Error ensuring database exists:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  createDatabase();
}

module.exports = createDatabase;
