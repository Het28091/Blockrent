const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const db = require('../database/db');
const { updateProfileValidation } = require('../middleware/validation');
const { authMiddleware } = require('../services/authService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('UserRoutes');

// Helper to map DB user to API response
const mapUserToApi = (user, includePrivate = false) => {
  if (!user) return null;

  const piiProvided = Boolean(
    user.full_name && user.phone_number && user.address
  );

  const publicProfile = {
    walletAddress: user.wallet_address,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    bio: user.bio,
    avatarIpfsHash: user.avatar_ipfs_hash,
    reputation: user.reputation_score || 0,
    totalRatings: user.total_ratings || 0,
    createdAt: user.created_at,
    lastActive: user.last_login,
    piiProvided,
  };

  if (includePrivate) {
    return {
      ...publicProfile,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      address: user.address,
    };
  }

  return publicProfile;
};

// Get user profile by wallet address
router.get('/:walletAddress', async (req, res) => {
  const walletAddress = req.params.walletAddress.toLowerCase();
  try {
    const user = await db.userDB.getUserByWallet(walletAddress);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return public profile info
    res.json(mapUserToApi(user));
  } catch (error) {
    logger.error('Error fetching user', {
      error: error.message,
      walletAddress,
    });
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile (authenticated)
router.put(
  '/:walletAddress',
  authMiddleware,
  updateProfileValidation,
  async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();

      // Verify user is updating their own profile
      if (req.walletAddress.toLowerCase() !== walletAddress) {
        return res
          .status(403)
          .json({ error: "Cannot update another user's profile" });
      }

      const { username, email, displayName, bio, avatarIpfsHash, profileData, fullName, phoneNumber, address } =
        req.body;
      const updateData = {};

      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (displayName) updateData.displayName = displayName;
      if (bio) updateData.bio = bio;
      if (avatarIpfsHash) updateData.avatarIpfsHash = avatarIpfsHash;
      if (fullName) updateData.fullName = fullName;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (address) updateData.address = address;

      // Handle legacy profileData if needed
      if (profileData) {
        if (profileData.email && !updateData.email)
          updateData.email = profileData.email;
        if (profileData.displayName && !updateData.displayName)
          updateData.displayName = profileData.displayName;
        if (profileData.bio && !updateData.bio)
          updateData.bio = profileData.bio;
      }

      await db.userDB.upsertUser(walletAddress, updateData);
      const updatedUser = await db.userDB.getUserByWallet(walletAddress);

      // Log activity
      await db.activityDB.logActivity({
        walletAddress,
        action: 'update',
        entityType: 'user',
        entityId: walletAddress,
        metadata: { updates: Object.keys(updateData) },
      });
      res.json({
        message: 'Profile updated successfully',
        user: mapUserToApi(updatedUser, true),
      });
    } catch (error) {
      logger.error('Error updating profile', {
        error: error.message,
        walletAddress: req.params.walletAddress,
      });
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Helper to transform listing from DB format to API format
const transformListing = (listing) => {
  if (!listing) return null;

  // Parse JSON fields
  let images = [];
  let tags = [];

  try {
    images = listing.images
      ? typeof listing.images === 'string'
        ? JSON.parse(listing.images)
        : listing.images
      : [];
  } catch (e) {
    logger.warn('Failed to parse images JSON', {
      listingId: listing.listing_id,
    });
  }

  try {
    tags = listing.tags
      ? typeof listing.tags === 'string'
        ? JSON.parse(listing.tags)
        : listing.tags
      : [];
  } catch (e) {
    logger.warn('Failed to parse tags JSON', { listingId: listing.listing_id });
  }

  // Convert wei to MATIC for display
  const priceInMatic = listing.price_wei
    ? (parseFloat(listing.price_wei) / 1e18).toFixed(4)
    : '0';
  const depositInMatic = listing.deposit_wei
    ? (parseFloat(listing.deposit_wei) / 1e18).toFixed(4)
    : null;

  return {
    id: listing.listing_id,
    listing_id: listing.listing_id, // Keep both for compatibility
    owner: listing.owner_wallet,
    owner_wallet: listing.owner_wallet, // Keep both for compatibility
    category: listing.category,
    price: priceInMatic,
    price_wei: listing.price_wei, // Keep original for calculations
    deposit: depositInMatic,
    deposit_wei: listing.deposit_wei, // Keep original for calculations
    ipfsHash: listing.ipfs_hash,
    ipfs_hash: listing.ipfs_hash, // Keep both for compatibility
    isForRent: listing.is_for_rent,
    is_for_rent: listing.is_for_rent, // Keep both for compatibility
    isActive: listing.is_active,
    is_active: listing.is_active, // Keep both for compatibility
    views: listing.views,
    favorites: listing.favorites,
    title: listing.title,
    description: listing.description,
    location: listing.location,
    tags: tags,
    images: images,
    image: images[0] || null, // First image as primary
    createdAt: listing.blockchain_created_at,
    blockchain_created_at: listing.blockchain_created_at, // Keep both for compatibility
    updatedAt: listing.blockchain_updated_at,
    blockchain_updated_at: listing.blockchain_updated_at, // Keep both for compatibility
    lastSynced: listing.last_synced,
  };
};

// Get user's listings
router.get('/:walletAddress/listings', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const { limit = 50, offset = 0 } = req.query;

    // Get ALL listings for this user (both active and inactive)
    // Don't use searchListings as it filters by is_active = TRUE
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);

    const query = `
      SELECT * FROM listings_cache 
      WHERE owner_wallet = ?
      ORDER BY blockchain_created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const listings = await db.query(query, [walletAddress]);

    // Transform listings to API format
    const transformedListings = listings.map(transformListing);

    // Return array directly for frontend compatibility
    res.json(transformedListings);
  } catch (error) {
    logger.error('Error fetching user listings', {
      error: error.message,
      walletAddress: req.params.walletAddress,
    });
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get user's transactions (as buyer or seller)
router.get('/:walletAddress/transactions', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();

    // Verify user is accessing their own transactions
    if (req.walletAddress.toLowerCase() !== walletAddress) {
      return res
        .status(403)
        .json({ error: "Cannot view another user's transactions" });
    }

    const { role, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM transactions_cache 
      WHERE buyer_wallet = ? OR seller_wallet = ?
    `;
    const params = [walletAddress, walletAddress];

    if (role === 'buyer') {
      query = 'SELECT * FROM transactions_cache WHERE buyer_wallet = ?';
      params.length = 1;
    } else if (role === 'seller') {
      query = 'SELECT * FROM transactions_cache WHERE seller_wallet = ?';
      params.length = 1;
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const transactions = await db.query(query, params);

    res.json({
      transactions,
      total: transactions.length,
      walletAddress,
    });
  } catch (error) {
    logger.error('Error fetching transactions', {
      error: error.message,
      walletAddress: req.params.walletAddress,
    });
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get user's purchases (transactions where user is buyer)
router.get('/:walletAddress/purchases', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const { limit = 50, offset = 0 } = req.query;

    // Parse limit and offset as integers for safety
    const safeLimit = parseInt(limit) || 50;
    const safeOffset = parseInt(offset) || 0;

    const query = `
      SELECT 
        l.listing_id as id,
        l.title,
        l.description,
        l.category,
        l.price_wei as price,
        l.deposit_wei as deposit,
        l.ipfs_hash,
        l.is_for_rent as isForRent,
        l.is_active as isActive,
        l.owner_wallet as owner,
        l.images,
        l.location,
        l.tags,
        t.buyer_wallet as buyer,
        t.blockchain_started_at as purchaseDate,
        t.tx_hash as transactionHash,
        t.status
      FROM transactions_cache t
      JOIN listings_cache l ON t.listing_id = l.listing_id
      WHERE t.buyer_wallet = ?
      ORDER BY t.blockchain_started_at DESC 
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const purchases = await db.query(query, [walletAddress]);

    // Parse JSON fields and format data
    const formattedPurchases = purchases.map((purchase) => {
      try {
        const parsedImages = purchase.images
          ? typeof purchase.images === 'string'
            ? JSON.parse(purchase.images)
            : purchase.images
          : [];
        const parsedTags = purchase.tags
          ? typeof purchase.tags === 'string'
            ? JSON.parse(purchase.tags)
            : purchase.tags
          : [];

        return {
          ...purchase,
          images: parsedImages,
          tags: parsedTags,
          image: parsedImages[0] || null,
          price: purchase.price
            ? (parseFloat(purchase.price) / 1e18).toFixed(4)
            : '0',
          deposit: purchase.deposit
            ? (parseFloat(purchase.deposit) / 1e18).toFixed(4)
            : null,
        };
      } catch (parseError) {
        logger.error('Error parsing purchase data', {
          error: parseError.message,
          purchaseId: purchase.id,
        });
        return {
          ...purchase,
          images: [],
          tags: [],
          image: null,
          price: '0',
          deposit: null,
        };
      }
    });

    // Return array directly for frontend compatibility
    res.json(formattedPurchases);
  } catch (error) {
    logger.error('Error fetching purchases', {
      error: error.message,
      walletAddress: req.params.walletAddress,
    });
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// Get user's favorites
router.get('/:walletAddress/favorites', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();

    // Verify user is accessing their own favorites
    if (req.walletAddress.toLowerCase() !== walletAddress) {
      return res
        .status(403)
        .json({ error: "Cannot view another user's favorites" });
    }

    const favorites = await db.favoritesDB.getUserFavorites(walletAddress);

    res.json({
      favorites,
      count: favorites.length,
    });
  } catch (error) {
    logger.error('Error fetching favorites', {
      error: error.message,
      walletAddress: req.params.walletAddress,
    });
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Toggle favorite
router.post(
  '/:walletAddress/favorites/:listingId',
  authMiddleware,
  async (req, res) => {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const listingId = parseInt(req.params.listingId);
    try {
      // Verify user is managing their own favorites
      if (req.walletAddress.toLowerCase() !== walletAddress) {
        return res
          .status(403)
          .json({ error: "Cannot manage another user's favorites" });
      }

      const result = await db.favoritesDB.toggleFavorite(
        walletAddress,
        listingId
      );

      res.json({
        message: result.added ? 'Added to favorites' : 'Removed from favorites',
        isFavorited: result.added,
        listingId,
      });
    } catch (error) {
      logger.error('Error toggling favorite', {
        error: error.message,
        walletAddress,
        listingId,
      });
      res.status(500).json({ error: 'Failed to toggle favorite' });
    }
  }
);

// Get user statistics
router.get('/:walletAddress/stats', async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();

    // Get various stats
    const [listingsCount, transactionsAsBuyer, transactionsAsSeller, user] =
      await Promise.all([
        db.query(
          'SELECT COUNT(*) as count FROM listings_cache WHERE owner_wallet = ?',
          [walletAddress]
        ),
        db.query(
          'SELECT COUNT(*) as count FROM transactions_cache WHERE buyer_wallet = ?',
          [walletAddress]
        ),
        db.query(
          'SELECT COUNT(*) as count FROM transactions_cache WHERE seller_wallet = ?',
          [walletAddress]
        ),
        db.userDB.getUserByWallet(walletAddress),
      ]);

    res.json({
      walletAddress,
      stats: {
        totalListings: listingsCount[0].count,
        purchasesMade: transactionsAsBuyer[0].count,
        salesCompleted: transactionsAsSeller[0].count,
        reputation: user ? user.reputation_score : 0,
        totalRatings: user ? user.total_ratings : 0,
        memberSince: user ? user.created_at : null,
      },
    });
  } catch (error) {
    logger.error('Error fetching user stats', {
      error: error.message,
      walletAddress: req.params.walletAddress,
    });
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;
