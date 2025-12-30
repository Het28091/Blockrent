const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { initializeDatabase, listingDB, userDB } = require('../database/db');

async function testCreate() {
  try {
    await initializeDatabase();
    console.log('Testing listing creation...\n');

    const testWallet = '0x1234567890123456789012345678901234567890';

    // First, ensure user exists
    console.log('Creating user...');
    await userDB.upsertUser(testWallet.toLowerCase(), {
      username: `user_${testWallet.substring(2, 8).toLowerCase()}`,
      displayName: `Test User ${testWallet.substring(0, 8)}`,
    });
    console.log('✅ User created/updated\n');

    const testListing = {
      listingId: 999,
      ownerWallet: testWallet.toLowerCase(),
      category: 'Test',
      priceWei: '1000000000000000000', // 1 ETH/MATIC
      depositWei: '0',
      ipfsHash: 'QmTestHash123',
      isForRent: false,
      isActive: true,
      views: 0,
      favorites: 0,
      title: 'Test Listing from Script',
      description: 'This is a test listing to verify creation works',
      location: 'Test Location',
      tags: ['test'],
      images: ['https://via.placeholder.com/400'],
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    };

    await listingDB.cacheBlisting(testListing);
    console.log('✅ Test listing created successfully!');

    // Verify it was created
    const listings = await listingDB.searchListings({}, 100, 0);
    console.log(`\nTotal listings now: ${listings.length}`);

    const testFound = listings.find((l) => l.listing_id === 999);
    if (testFound) {
      console.log('✅ Test listing found in search results!');
      console.log(`   Title: ${testFound.title}`);
    } else {
      console.log('❌ Test listing NOT found in search results');
    }

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testCreate();
