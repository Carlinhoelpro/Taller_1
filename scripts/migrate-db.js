const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || 'TallerTokyoNoodles';
const DB_NAME = process.env.DB_NAME || 'tokyo_noodles';

(async () => {
  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  async function checkConnection(retries = 3, delayMs = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const conn = await pool.getConnection();
        conn.release();
        return;
      } catch (err) {
        if (i === retries - 1) throw err;
        console.warn(`Connection failed (attempt ${i + 1}/${retries}): ${err.code} ${err.message}. Retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2;
      }
    }
  }

  try {
    console.log(`Trying to connect to MySQL at ${DB_HOST}:${DB_PORT} as ${DB_USER}`);
    await checkConnection(3, 1000);
    console.log('Connected to database - proceeding with migration.');
    console.log('Checking for google_id column in usuarios...');
    const [columns] = await pool.query("SHOW COLUMNS FROM usuarios LIKE 'google_id'");
    if (!columns || !columns.length) {
      console.log('google_id column missing; adding it...');
      await pool.query("ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255) NULL AFTER imagen_nombre");
      const [idxRows] = await pool.query("SHOW INDEX FROM usuarios WHERE Key_name = 'idx_usuarios_google_id'");
      if (!idxRows || !idxRows.length) {
        await pool.query('CREATE INDEX idx_usuarios_google_id ON usuarios(google_id)');
      }
      console.log('Added google_id and index.');
    } else {
      console.log('google_id column exists - OK');
    }

    console.log('Ensuring sessions table exists for express-mysql-session...');
    await pool.query(`CREATE TABLE IF NOT EXISTS sessions (
      session_id VARCHAR(128) NOT NULL PRIMARY KEY,
      expires INT(11) UNSIGNED NOT NULL,
      data TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`);
    console.log('Sessions table ensured.');
  } catch (e) {
    if (e && e.code === 'ECONNREFUSED') {
      console.error(`Unable to connect to MySQL at ${DB_HOST}:${DB_PORT}.`);
      console.error('Please ensure MySQL is running and accepting TCP connections, and that your credentials are correct.');
      console.error(`DB_HOST=${DB_HOST} DB_PORT=${DB_PORT} DB_USER=${DB_USER}`);
      console.error('On Windows you can check services: Get-Service *mysql* | Format-Table -AutoSize');
    }
    console.error('Migration error:', e && e.code, e && (e.sqlMessage || e.message));
  } finally {
    await pool.end();
  }
})();
