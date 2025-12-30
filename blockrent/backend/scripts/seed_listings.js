const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const {
  initializeDatabase,
  userDB,
  listingDB,
  query,
} = require('../database/db');

async function seed() {
  try {
    await initializeDatabase();
    console.log('Database connected');

    const listingsPath = path.join(__dirname, '../listings.json');
    const listingsData = JSON.parse(fs.readFileSync(listingsPath, 'utf8'));

    console.log(`Found ${listingsData.length} listings to seed`);

    const categories = [
      'Electronics',
      'Photography',
      'Computing',
      'Gaming',
      'Audio',
      'Drones',
      'Sports',
      'Fashion',
      'Home',
      'Books',
      'Other',
    ];

    for (let i = 0; i < listingsData.length; i++) {
      const item = listingsData[i];
      const numericId = i + 1; // Generate numeric ID starting from 1

      // 1. Ensure owner exists
      const ownerWallet = item.owner.toLowerCase();
      await userDB.upsertUser(ownerWallet, {
        username: `user_${ownerWallet.substring(2, 8)}`,
        displayName: `User ${ownerWallet.substring(0, 6)}`,
      });

      // 2. Insert listing
      // We use raw query or listingDB.cacheBlisting if it supports our format
      // listingDB.cacheBlisting expects specific fields. Let's map them.

      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];

      const listingPayload = {
        listingId: numericId,
        ownerWallet: ownerWallet,
        category: randomCategory,
        priceWei: (parseFloat(item.price) * 1e18).toString(), // Convert to Wei (approx)
        depositWei: item.deposit
          ? (parseFloat(item.deposit) * 1e18).toString()
          : '0',
        ipfsHash: 'QmHash' + numericId, // Mock hash
        isForRent: item.isForRent,
        isActive: item.isActive,
        views: 0,
        favorites: 0,
        title: item.title,
        description: item.description,
        location: 'Global',
        tags: [],
        images: [item.image],
        createdAt: Math.floor(new Date(item.createdAt).getTime() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      };

      await listingDB.cacheBlisting(listingPayload);
      console.log(`Seeded listing ${numericId}: ${item.title}`);
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
