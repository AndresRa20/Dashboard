/**
 * dump_users.js
 * Script utilitario para listar usuarios desde la base MySQL usando las
 * variables de entorno reales de Railway.
 * Uso: `node Scripts/dump_users.js`
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function dumpUsers() {
  const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT ? parseInt(process.env.MYSQLPORT, 10) : 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    connectionLimit: 5,
  });

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      'SELECT id, name, lastname, email, created_at FROM users ORDER BY id DESC LIMIT 50'
    );

    if (!rows || rows.length === 0) {
      console.log('No se encontraron usuarios en la tabla `users`.');
    } else {
      console.table(rows);
    }

    conn.release();
  } catch (err) {
    console.error('Error consultando la base de datos:', err.message || err);
    process.exitCode = 2;
  } finally {
    await pool.end();
  }
}

dumpUsers();
