const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

async function createTestUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'wandermates',
    port: process.env.DB_PORT || 3306
  });

  try {
    const username = 'yash';
    const email = 'yash@test.com';
    const password = 'password123';
    const fullName = 'Yash';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Delete existing if any
    await connection.execute('DELETE FROM users WHERE username = ? OR email = ?', [username, email]);

    // Insert verified user
    const [result] = await connection.execute(
      `INSERT INTO users (email, password_hash, full_name, username, aadhaar_status, trust_score, created_at) 
       VALUES (?, ?, ?, ?, 'verified', 100, NOW())`,
      [email, hashedPassword, fullName, username]
    );

    console.log(`User created successfully with ID: ${result.insertId}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Email: ${email}`);
    console.log(`Status: VERIFIED`);

  } catch (err) {
    console.error('Error creating user:', err.message);
  } finally {
    await connection.end();
  }
}

createTestUser();
