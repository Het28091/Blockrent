const path = require('path');
require('../backend/node_modules/dotenv').config({
  path: path.join(__dirname, '../backend/.env'),
});
const { initializeDatabase, query } = require('../backend/database/db');

async function migrate() {
  try {
    await initializeDatabase();

    console.log('Creating linked_wallets table...');

    const sql = `
      CREATE TABLE IF NOT EXISTS linked_wallets (
        wallet_address VARCHAR(42) PRIMARY KEY,
        primary_wallet_address VARCHAR(42) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_primary (primary_wallet_address),
        FOREIGN KEY (primary_wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await query(sql);
    console.log('✅ linked_wallets table created successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
