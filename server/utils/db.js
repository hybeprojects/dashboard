const mysql = require('mysql2/promise');
require('dotenv').config();
const logger = require('./logger');

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

let pool = null;
let available = false;

async function init() {
  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME, // ✅ important: specify your schema
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // quick connection test
    const [rows] = await pool.query('SELECT 1 as ok');
    available = true;
    logger.info('MySQL pool initialized');
  } catch (err) {
    logger.warn('MySQL not available:', err && err.message ? err.message : err);
    available = false;
    pool = null;
  }
}

async function query(sql, params) {
  if (!pool) throw new Error('DB pool not initialized');
  return pool.query(sql, params);
}

function isAvailable() {
  return available;
}

module.exports = { init, query, isAvailable };
