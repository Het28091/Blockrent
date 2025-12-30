const path = require('path');
require('../backend/node_modules/dotenv').config({
  path: path.join(__dirname, '../backend/.env'),
});
const { initializeDatabase, query } = require('../backend/database/db');

async function migrate() {
  try {
    await initializeDatabase();

    console.log('Creating link_tokens table...');

    const sql = `
      CREATE TABLE IF NOT EXISTS link_tokens (
        token VARCHAR(64) PRIMARY KEY,
        user_wallet VARCHAR(42) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await query(sql);
    console.log('✅ link_tokens table created successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
