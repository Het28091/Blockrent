const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load backend env (relative to backend/scripts/setup-db-node.cjs)
const backendEnvPath = path.join(__dirname, '../.env');
console.log(`Loading env from ${backendEnvPath}`);
const envConfig = dotenv.parse(fs.readFileSync(backendEnvPath));

async function setupDatabase() {
  console.log('🔌 Connecting to MySQL...');
  console.log(`User: ${envConfig.DB_USER}`);
  console.log(`Database: ${envConfig.DB_NAME}`);
  
  try {
    // Create connection without database selected first
    const connection = await mysql.createConnection({
      host: envConfig.DB_HOST || 'localhost',
      user: envConfig.DB_USER || 'root',
      password: envConfig.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Connected.');

    // Create DB if not exists
    console.log(`🔨 Creating database ${envConfig.DB_NAME} if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS 
${envConfig.DB_NAME}
 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log('✅ Database checked/created.');

    // Use DB
    await connection.changeUser({ database: envConfig.DB_NAME });
    console.log(`📂 Selected database ${envConfig.DB_NAME}.`);

    // Read schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    console.log(`📖 Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    console.log('⚡ Executing schema...');
    await connection.query(schemaSql);
    console.log('✅ Schema executed successfully.');

    await connection.end();
    console.log('👋 Connection closed.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
