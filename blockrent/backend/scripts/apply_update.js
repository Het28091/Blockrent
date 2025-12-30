const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function applyUpdate() {
  console.log('🔌 Connecting to database...');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blockrent_db',
    multipleStatements: true // Important for running scripts
  };

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database.');

    const sqlPath = path.join(__dirname, '../../update-database.sql');
    console.log(`📖 Reading SQL file from: ${sqlPath}`);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Executing SQL script...');
    
    // Remove comments and split by semicolon
    const statements = sql
      .replace(/--.*$/gm, '') // Remove -- comments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        // Skip USE statement as we selected DB in connection
        if (statement.toUpperCase().startsWith('USE ')) continue;
        
        // Handle DROP INDEX IF EXISTS for older MySQL versions
        if (statement.toUpperCase().startsWith('DROP INDEX IF EXISTS')) {
             // Try to execute, if fail, ignore
             try {
                 await connection.query(statement);
                 console.log('   ✔ Executed: ' + statement.substring(0, 50) + '...');
             } catch (e) {
                 console.log('   ⚠ Skipped (likely not supported/needed): ' + statement.substring(0, 50) + '...');
             }
             continue;
        }

        await connection.query(statement);
        console.log('   ✔ Executed: ' + statement.substring(0, 50) + '...');
      } catch (err) {
        // Ignore "Duplicate column" or "Duplicate key" errors as they mean it's already applied
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_ENTRY') {
           console.log('   ℹ Already exists: ' + statement.substring(0, 50) + '...');
        } else {
           console.error('   ❌ Failed: ' + statement.substring(0, 50) + '...');
           console.error('      Error: ' + err.message);
        }
      }
    }
    
    console.log('✨ Database update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('👋 Connection closed.');
    }
  }
}

applyUpdate();