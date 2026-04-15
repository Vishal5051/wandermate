const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'wandermates',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  multipleStatements: true,
});

// Helper: execute a stored procedure and return the result rows
// Usage: db.callProc('sp_name', [param1, param2])
const callProc = async (procedureName, params = []) => {
  const placeholders = params.map(() => '?').join(', ');
  const sql = `CALL ${procedureName}(${placeholders})`;
  const [results] = await pool.execute(sql, params);
  // MySQL returns an array of result sets; the first is the actual data
  if (Array.isArray(results) && Array.isArray(results[0])) {
    return results[0];
  }
  return results;
};

// Helper: run a raw query (for cases not covered by stored procedures)
const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

module.exports = {
  pool,
  query,
  callProc,
};
