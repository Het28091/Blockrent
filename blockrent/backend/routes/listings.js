const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const db = require('../database/db');
const {
  createListingValidation,
  updateListingValidation,
  searchListingsValidation,
} = require('../middleware/validation');
const { authMiddleware } = require('../services/authService');
const ipfsService = require('../services/ipfsService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ListingsRoutes');

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

// Get all active listings (public)
router.get('/', async (req, res) => {
  try {
    const {
      search,
      isForRent,
      minPrice,
      maxPrice,
      seller,
      category,
      status = 'active',
      limit = 50,
      offset = 0,
    } = req.query;

    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    const filters = {};

    if (search) filters.search = search;
    if (isForRent !== undefined) filters.isForRent = isForRent === 'true';
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (seller) filters.seller = seller.toLowerCase();
    if (category) filters.category = category;
    if (status) filters.status = status;

    const listings = await db.listingDB.searchListings(
      filters,
      parsedLimit,
      parsedOffset
    );

    // Transform listings to API format
    const transformedListings = listings.map(transformListing);

    // Get total count for pagination
    const countQuery = await db.query(
      'SELECT COUNT(*) as total FROM listings_cache WHERE is_active = TRUE',
      []
    );

    res.json({
      listings: transformedListings,
      pagination: {
        total: countQuery[0]?.total || 0,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + listings.length < (countQuery[0]?.total || 0),
      },
    });
  } catch (error) {
    logger.error('Error fetching listings', {
      error: error.message,
      stack: error.stack,
    });
    // Return error details for debugging
    res.status(500).json({
      error: 'Failed to load listings',
      message: error.message,
      listings: [],
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    });
  }
});

// Get single listing by ID
router.get('/:listingId', async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);

    const listing = await db.listingDB.getListingById(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Fetch IPFS metadata if available
    if (listing.ipfs_hash) {
      try {
        const metadata = await ipfsService.fetchFromIPFS(listing.ipfs_hash);
        listing.metadata = metadata;
      } catch (error) {
        logger.warn('Error fetching IPFS metadata', {
          error: error.message,
          ipfsHash: listing.ipfs_hash,
        });
      }
    }

    // Transform to API format
    const transformedListing = transformListing(listing);
    if (listing.metadata) {
      transformedListing.metadata = listing.metadata;
    }

    res.json(transformedListing);
  } catch (error) {
    logger.error('Error fetching listing', {
      error: error.message,
      listingId: req.params.listingId,
    });
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Create listing cache (after blockchain transaction)
router.post('/', authMiddleware, createListingValidation, async (req, res) => {
  try {
    const {
      blockchainId,
      seller,
      isForRent,
      price,
      deposit,
      ipfsHash,
      metadata,
      transactionHash,
    } = req.body;

    // Verify authenticated user is the seller
    if (req.walletAddress.toLowerCase() !== seller.toLowerCase()) {
      logger.warn('Unauthorized listing creation attempt', {
        authenticatedUser: req.walletAddress,
        attemptedSeller: seller,
      });
      return res
        .status(403)
        .json({ error: 'Cannot create listing for another user' });
    }

    // Ensure user exists in database (for foreign key constraint)
    const user = await db.userDB.getUserByWallet(seller.toLowerCase());
    if (!user) {
      // Create user if doesn't exist
      await db.userDB.upsertUser(seller.toLowerCase(), {
        username: `user_${seller.substring(2, 8).toLowerCase()}`,
        displayName: `User ${seller.substring(0, 8)}`,
      });
    }

    // Convert price to Wei if it's a number
    const priceWei =
      typeof price === 'number' || !price.toString().includes('e')
        ? (parseFloat(price) * 1e18).toString()
        : price;
    const depositWei =
      deposit &&
      (typeof deposit === 'number' || !deposit.toString().includes('e'))
        ? (parseFloat(deposit) * 1e18).toString()
        : deposit || '0';

    // Cache the listing
    const listingPayload = {
      listingId: blockchainId || Date.now(),
      ownerWallet: seller.toLowerCase(),
      category: metadata?.category || 'General',
      priceWei: priceWei,
      depositWei: depositWei,
      ipfsHash: ipfsHash,
      isForRent: isForRent,
      isActive: true,
      views: 0,
      favorites: 0,
      title: metadata?.title || 'Untitled',
      description: metadata?.description || '',
      location: metadata?.location || 'Global',
      tags: metadata?.tags || [],
      images: metadata?.images || [],
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    };

    await db.listingDB.cacheBlisting(listingPayload);

    // Log activity
    await db.activityDB.logActivity({
      walletAddress: seller.toLowerCase(),
      action: 'create_listing',
      entityType: 'listing',
      entityId: blockchainId?.toString(),
      metadata: { listingId: blockchainId, price, isForRent },
    });

    // Get the created listing
    const createdListing = await db.listingDB.getListingById(
      blockchainId || listingPayload.listingId
    );

    // Broadcast to marketplace if socket.io is configured
    const io = req.app.get('io');
    if (io) {
      io.to('marketplace').emit('listingCreated', createdListing);
    }

    res.status(201).json({
      message: 'Listing cached successfully',
      listing: createdListing,
    });
  } catch (error) {
    logger.error('Error caching listing', {
      error: error.message,
      seller: req.body.seller,
    });
    res.status(500).json({ error: 'Failed to cache listing' });
  }
});

// Update listing cache (e.g., status change)
router.put('/:listingId', authMiddleware, async (req, res) => {
  try {
    const listingId = parseInt(req.params.listingId);
    const { status, metadata } = req.body;

    const existing = await db.listingDB.getListingById(listingId);

    if (!existing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Verify user owns this listing
    if (
      existing.owner_wallet.toLowerCase() !== req.walletAddress.toLowerCase()
    ) {
      return res
        .status(403)
        .json({ error: "Cannot update another user's listing" });
    }

    const updates = {};
    if (status !== undefined) updates.is_active = status === 'active';
    if (metadata) {
      if (metadata.title) updates.title = metadata.title;
      if (metadata.description) updates.description = metadata.description;
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    if (updates.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(updates.is_active);
    }
    if (updates.title) {
      updateFields.push('title = ?');
      updateValues.push(updates.title);
    }
    if (updates.description) {
      updateFields.push('description = ?');
      updateValues.push(updates.description);
    }

    if (updateFields.length > 0) {
      updateValues.push(listingId);
      await db.query(
        `UPDATE listings_cache SET ${updateFields.join(', ')}, last_synced = NOW() WHERE listing_id = ?`,
        updateValues
      );
    }

    const updated = await db.listingDB.getListingById(listingId);

    // Broadcast update
    const io = req.app.get('io');
    if (io) {
      io.to('marketplace').emit('listingUpdated', updated);
    }

    res.json({
      message: 'Listing updated successfully',
      listing: updated,
    });
  } catch (error) {
    logger.error('Error updating listing', {
      error: error.message,
      listingId: req.params.listingId,
    });
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// Upload metadata to IPFS
router.post('/metadata/upload', authMiddleware, async (req, res) => {
  try {
    const { title, description, images, category, additionalDetails } =
      req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: 'Title and description are required' });
    }

    const metadata = {
      title,
      description,
      images: images || [],
      category: category || 'general',
      additionalDetails: additionalDetails || {},
      createdBy: req.walletAddress,
      timestamp: new Date().toISOString(),
    };

    const ipfsHash = await ipfsService.pinListingMetadata(metadata);

    res.json({
      message: 'Metadata uploaded to IPFS successfully',
      ipfsHash,
      metadata,
    });
  } catch (error) {
    logger.error('Error uploading metadata', { error: error.message });
    res.status(500).json({ error: 'Failed to upload metadata to IPFS' });
  }
});

// Search listings
router.post('/search', async (req, res) => {
  try {
    const { query, filters, limit = 50, offset = 0 } = req.body;

    const searchFilters = {
      ...filters,
      search: query,
    };

    const listings = await db.listingDB.searchListings(
      searchFilters,
      limit,
      offset
    );

    res.json({
      results: listings,
      query,
      total: listings.length,
    });
  } catch (error) {
    logger.error('Error searching listings', { error: error.message });
    res.status(500).json({ error: 'Failed to search listings' });
  }
});



// Delete a listing (authenticated, owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);
    const walletAddress = req.walletAddress.toLowerCase();

    // Get the listing to verify ownership
    const listing = await db.listingDB.getListingById(listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Verify ownership
    if (listing.owner_wallet.toLowerCase() !== walletAddress) {
      return res
        .status(403)
        .json({ error: 'You can only delete your own listings' });
    }

    // Delete from database (soft delete by setting is_active = false)
    const [result] = await db.query(
      'UPDATE listings_cache SET is_active = FALSE, updated_at = NOW() WHERE listing_id = ?',
      [listingId]
    );

    // Verify the update was successful
    if (result.affectedRows === 0) {
      logger.warn('No rows affected during delete', { listingId });
      return res
        .status(404)
        .json({ error: 'Listing not found or already deleted' });
    }

    logger.info('Listing marked as inactive', {
      listingId,
      affectedRows: result.affectedRows,
    });

    // Log activity
    await db.activityDB.logActivity({
      walletAddress,
      action: 'delete',
      entityType: 'listing',
      entityId: listingId.toString(),
      metadata: { listingId, title: listing.title },
    });

    logger.info('Listing deleted', { listingId, walletAddress });
    res.json({ message: 'Listing deleted successfully', listingId });
  } catch (error) {
    logger.error('Error deleting listing', {
      error: error.message,
      listingId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// Add rating
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const listingId = req.params.id;
    const { rating, comment } = req.body;
    const reviewerWallet = req.walletAddress;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating (1-5)' });
    }

    await db.ratingsDB.addRating(listingId, reviewerWallet, rating, comment);
    
    // Notify owner
    const listing = await db.listingDB.getListingById(listingId);
    if (listing && listing.owner_wallet !== reviewerWallet) {
       await db.notificationDB.createNotification({
         walletAddress: listing.owner_wallet,
         type: 'rating',
         title: 'New Rating Received',
         message: `Someone rated your listing "${listing.title}"`,
         data: { listingId, rating },
         link: `/marketplace/${listingId}`
       });
    }

    res.json({ message: 'Rating added successfully' });
  } catch (error) {
    logger.error('Error adding rating', { error: error.message });
    res.status(500).json({ error: 'Failed to add rating' });
  }
});

// Get ratings
router.get('/:id/ratings', async (req, res) => {
  try {
    const listingId = req.params.id;
    const ratings = await db.ratingsDB.getRatings(listingId);
    res.json(ratings);
  } catch (error) {
    logger.error('Error fetching ratings', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

module.exports = router;
