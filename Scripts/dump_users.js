/**
 * dump_users.js
 * Script utilitario para listar usuarios desde la base MySQL usando las mismas
 * variables de entorno que el servidor (lee .env mediante dotenv).
 * Uso: `node Scripts/dump_users.js`
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function dumpUsers() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_login',
    connectionLimit: 5,
  });

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id, name, lastname, email, created_at FROM users ORDER BY id DESC LIMIT 50');
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
