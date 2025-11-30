const mysql = require('mysql2/promise');

(async () => {
  const DB_HOST = process.env.DB_HOST || '127.0.0.1';
  const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASS = process.env.DB_PASS || 'TallerTokyoNoodles';
  const DB_NAME = process.env.DB_NAME || 'tokyo_noodles';

  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: false,
    connectionLimit: 1,
  });

  try {
    const conn = await pool.getConnection();
    console.log(`Connection to MySQL ${DB_HOST}:${DB_PORT} succeeded (user: ${DB_USER})`);
    conn.release();
  } catch (err) {
    console.error('DB connection failed:', err && err.code, err && (err.sqlMessage || err.message));
    console.error('Tip: verify DB_HOST, DB_PORT, DB_USER, DB_PASS in Datos.env and that MySQL is running.');
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
