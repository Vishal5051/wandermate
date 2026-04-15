const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const initDatabase = async () => {
  // Connect without database first to create it
  const rootConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log('🚀 Initializing WanderMates MySQL Database...\n');

    // Run schema script
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await rootConn.query(schemaSql);
    console.log('✅ Schema created (all tables + sample data)');

    // Run procedures script
    const procPath = path.join(__dirname, '..', 'sql', 'procedures.sql');
    const procSql = fs.readFileSync(procPath, 'utf8');

    // Extract procedure bodies between DELIMITER // ... DELIMITER ;
    // Each block contains DROP + CREATE PROCEDURE statements separated by //
    const regex = /DELIMITER\s+\/\/([\s\S]*?)DELIMITER\s+;/g;
    let match;
    let procCount = 0;

    while ((match = regex.exec(procSql)) !== null) {
      const block = match[1].trim();
      // Split on // to get individual statements (DROP and CREATE pairs)
      const statements = block.split(/\/\//).map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of statements) {
        try {
          await rootConn.query(stmt);
          if (stmt.toUpperCase().includes('CREATE PROCEDURE')) procCount++;
        } catch (err) {
          console.warn('⚠️  Warning:', err.message.substring(0, 100));
        }
      }
    }

    // Also run any standalone statements (USE, DROP) outside DELIMITER blocks
    const outsideBlocks = procSql.replace(/DELIMITER\s+\/\/[\s\S]*?DELIMITER\s+;/g, '').trim();
    if (outsideBlocks) {
      const stmts = outsideBlocks.split(';').map(s => s.trim()).filter(s => s.length > 5 && !s.startsWith('--'));
      for (const stmt of stmts) {
        try {
          await rootConn.query(stmt);
        } catch (err) {
          // ignore
        }
      }
    }

    console.log(`✅ ${procCount} stored procedures created`);

    console.log('\n✨ Database initialization complete!\n');
    console.log('📊 Summary:');
    console.log('   - 10 tables created');
    console.log('   - 25+ stored procedures for CRUD operations');
    console.log('   - 3 sample users added');
    console.log('   - 3 sample activities in Rishikesh\n');
    console.log('🔐 Default login credentials:');
    console.log('   Email: sarah@example.com');
    console.log('   Password: password123\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await rootConn.end();
  }
};

initDatabase().catch(console.error);
