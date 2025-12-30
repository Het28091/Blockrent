const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { initializeDatabase, query } = require('../database/db');

async function check() {
  try {
    await initializeDatabase();
    const result = await query('SELECT COUNT(*) as count FROM listings_cache');
    console.log('Total listings in database:', result[0].count);

    const listings = await query(
      'SELECT listing_id, title, is_active FROM listings_cache LIMIT 5'
    );
    console.log('\nSample listings:');
    listings.forEach((l) => {
      console.log(
        `  - ID: ${l.listing_id}, Title: ${l.title}, Active: ${l.is_active}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

check();
