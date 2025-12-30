const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { initializeDatabase, listingDB } = require('../database/db');

async function test() {
  try {
    await initializeDatabase();
    console.log('Testing listingDB.searchListings...\n');

    const results = await listingDB.searchListings({}, 50, 0);
    console.log(`Found ${results.length} listings:`);
    results.forEach((l) => {
      console.log(`  - ${l.listing_id}: ${l.title} (Active: ${l.is_active})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();
