const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL Database Connection Pool
 * Handles all database operations with connection pooling for better performance
 */

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blockrent_db',
  waitForConnections: true,
  connectionLimit: 20, // Increased for better concurrency
  maxIdle: 10, // Maximum idle connections
  idleTimeout: 60000, // Close idle connections after 60 seconds
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
};

let pool;

/**
 * Initialize database connection pool
 */
async function initializeDatabase() {
  try {
    pool = mysql.createPool(poolConfig);

    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();

    return pool;
  } catch (error) {
    console.error('❌ MySQL connection error:', error.message);
    throw error;
  }
}

/**
 * Get database connection pool
 */
function getPool() {
  if (!pool) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first'
    );
  }
  return pool;
}

/**
 * Execute a query with error handling
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

/**
 * Execute a transaction
 */
async function transaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * User database operations
 */
const userDB = {
  /**
   * Create or update user
   */
  async upsertUser(walletAddress, userData = {}) {
    const sql = `
      INSERT INTO users (wallet_address, email, username, display_name, bio, avatar_ipfs_hash, full_name, phone_number, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email = COALESCE(VALUES(email), email),
        username = COALESCE(VALUES(username), username),
        display_name = COALESCE(VALUES(display_name), display_name),
        bio = COALESCE(VALUES(bio), bio),
        avatar_ipfs_hash = COALESCE(VALUES(avatar_ipfs_hash), avatar_ipfs_hash),
        full_name = COALESCE(VALUES(full_name), full_name),
        phone_number = COALESCE(VALUES(phone_number), phone_number),
        address = COALESCE(VALUES(address), address),
        updated_at = CURRENT_TIMESTAMP
    `;

    return query(sql, [
      walletAddress,
      userData.email || null,
      userData.username || null,
      userData.displayName || null,
      userData.bio || null,
      userData.avatarIpfsHash || null,
      userData.fullName || null,
      userData.phoneNumber || null,
      userData.address || null,
    ]);
  },

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress) {
    const sql = 'SELECT * FROM users WHERE wallet_address = ?';
    const results = await query(sql, [walletAddress]);
    return results[0] || null;
  },

  /**
   * Update last login
   */
  async updateLastLogin(walletAddress) {
    const sql =
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE wallet_address = ?';
    return query(sql, [walletAddress]);
  },

  /**
   * Search users
   */
  async searchUsers(searchTerm, limit = 10) {
    const sql = `
      SELECT wallet_address, username, display_name, avatar_ipfs_hash
      FROM users
      WHERE username LIKE ? OR display_name LIKE ?
      LIMIT ?
    `;
    const term = `%${searchTerm}%`;
    return query(sql, [term, term, limit]);
  },
};

/**
 * Session database operations
 */
const sessionDB = {
  /**
   * Create a new session
   */
  async createSession(sessionData) {
    const sql = `
      INSERT INTO sessions (session_id, wallet_address, signature, message, nonce, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return query(sql, [
      sessionData.sessionId,
      sessionData.walletAddress,
      sessionData.signature,
      sessionData.message,
      sessionData.nonce,
      sessionData.ipAddress,
      sessionData.userAgent,
      sessionData.expiresAt,
    ]);
  },

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    const sql =
      'SELECT * FROM sessions WHERE session_id = ? AND expires_at > NOW()';
    const results = await query(sql, [sessionId]);
    return results[0] || null;
  },

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    const sql = 'DELETE FROM sessions WHERE session_id = ?';
    return query(sql, [sessionId]);
  },

  /**
   * Delete expired sessions
   */
  async cleanExpiredSessions() {
    const sql = 'DELETE FROM sessions WHERE expires_at < NOW()';
    return query(sql);
  },

  /**
   * Get all sessions for a wallet
   */
  async getWalletSessions(walletAddress) {
    const sql =
      'SELECT * FROM sessions WHERE wallet_address = ? AND expires_at > NOW()';
    return query(sql, [walletAddress]);
  },

  /**
   * Check if nonce has been used (prevent replay attacks)
   */
  async isNonceUsed(nonce) {
    const sql =
      'SELECT COUNT(*) as count FROM used_nonces WHERE nonce = ? AND expires_at > NOW()';
    const results = await query(sql, [nonce]);
    return results[0].count > 0;
  },

  /**
   * Mark nonce as used
   */
  async markNonceAsUsed(nonce, walletAddress) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Nonce valid for 10 minutes

    const sql = `
      INSERT INTO used_nonces (nonce, wallet_address, expires_at)
      VALUES (?, ?, ?)
    `;
    return query(sql, [nonce, walletAddress, expiresAt]);
  },

  /**
   * Clean expired nonces
   */
  async cleanExpiredNonces() {
    const sql = 'DELETE FROM used_nonces WHERE expires_at < NOW()';
    return query(sql);
  },
};

/**
 * Listing cache operations
 */
const listingDB = {
  /**
   * Cache listing from blockchain
   */
  async cacheBlisting(listingData) {
    const sql = `
      INSERT INTO listings_cache (
        listing_id, owner_wallet, category, price_wei, deposit_wei, ipfs_hash,
        is_for_rent, is_active, views, favorites, title, description, location, tags, images,
        blockchain_created_at, blockchain_updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        price_wei = VALUES(price_wei),
        deposit_wei = VALUES(deposit_wei),
        ipfs_hash = VALUES(ipfs_hash),
        is_active = VALUES(is_active),
        blockchain_updated_at = VALUES(blockchain_updated_at),
        last_synced = CURRENT_TIMESTAMP
    `;

    return query(sql, [
      listingData.listingId,
      listingData.ownerWallet,
      listingData.category,
      listingData.priceWei,
      listingData.depositWei || '0',
      listingData.ipfsHash,
      listingData.isForRent,
      listingData.isActive,
      listingData.views || 0,
      listingData.favorites || 0,
      listingData.title,
      listingData.description,
      listingData.location,
      JSON.stringify(listingData.tags || []),
      JSON.stringify(listingData.images || []),
      listingData.createdAt
        ? new Date(listingData.createdAt * 1000)
        : new Date(),
      listingData.updatedAt
        ? new Date(listingData.updatedAt * 1000)
        : new Date(),
    ]);
  },

  /**
   * Search listings with filters
   */
  async searchListings(filters = {}, limit = 20, offset = 0) {
    let sql = 'SELECT * FROM listings_cache WHERE is_active = TRUE';
    const params = [];

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.isForRent !== undefined) {
      sql += ' AND is_for_rent = ?';
      params.push(filters.isForRent);
    }

    if (filters.minPrice) {
      sql += ' AND CAST(price_wei AS DECIMAL(78)) >= ?';
      params.push(filters.minPrice);
    }

    if (filters.maxPrice) {
      sql += ' AND CAST(price_wei AS DECIMAL(78)) <= ?';
      params.push(filters.maxPrice);
    }

    if (filters.searchTerm) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      const term = `%${filters.searchTerm}%`;
      params.push(term, term);
    }

    if (filters.ownerWallet) {
      sql += ' AND owner_wallet = ?';
      params.push(filters.ownerWallet);
    }

    // Sorting - WHITELIST to prevent SQL injection
    const allowedSortColumns = [
      'blockchain_created_at',
      'blockchain_updated_at',
      'price_wei',
      'views',
      'favorites',
      'title',
      'listing_id',
    ];
    const allowedSortOrders = ['ASC', 'DESC'];

    const sortBy = allowedSortColumns.includes(filters.sortBy)
      ? filters.sortBy
      : 'blockchain_created_at';
    const sortOrder = allowedSortOrders.includes(
      filters.sortOrder?.toUpperCase()
    )
      ? filters.sortOrder.toUpperCase()
      : 'DESC';

    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    // LIMIT and OFFSET - sanitize integers
    const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // Cap at 100
    const safeOffset = Math.max(parseInt(offset) || 0, 0);
    sql += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    return query(sql, params);
  },

  /**
   * Get listing by ID
   */
  async getListingById(listingId) {
    const sql = 'SELECT * FROM listings_cache WHERE listing_id = ?';
    const results = await query(sql, [listingId]);
    return results[0] || null;
  },

  /**
   * Increment views
   */
  async incrementViews(listingId) {
    const sql =
      'UPDATE listings_cache SET views = views + 1 WHERE listing_id = ?';
    return query(sql, [listingId]);
  },
};

/**
 * Notification operations
 */
const notificationDB = {
  /**
   * Create notification
   */
  async createNotification(notificationData) {
    const sql = `
      INSERT INTO notifications (wallet_address, type, title, message, data, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    return query(sql, [
      notificationData.walletAddress,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      JSON.stringify(notificationData.data || {}),
      notificationData.link || null,
    ]);
  },

  /**
   * Get user notifications
   */
  async getUserNotifications(walletAddress, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM notifications
      WHERE wallet_address = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    return query(sql, [walletAddress, limit, offset]);
  },

  /**
   * Mark as read
   */
  async markAsRead(notificationId) {
    const sql = 'UPDATE notifications SET is_read = TRUE WHERE id = ?';
    return query(sql, [notificationId]);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(walletAddress) {
    const sql =
      'SELECT COUNT(*) as count FROM notifications WHERE wallet_address = ? AND is_read = FALSE';
    const results = await query(sql, [walletAddress]);
    return results[0].count;
  },
};

/**
 * Activity log operations
 */
const activityDB = {
  /**
   * Log activity
   */
  async logActivity(activityData) {
    const sql = `
      INSERT INTO activity_log (wallet_address, action, entity_type, entity_id, metadata, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    return query(sql, [
      activityData.walletAddress || null,
      activityData.action,
      activityData.entityType || null,
      activityData.entityId || null,
      JSON.stringify(activityData.metadata || {}),
      activityData.ipAddress || null,
      activityData.userAgent || null,
    ]);
  },

  /**
   * Get user activity
   */
  async getUserActivity(walletAddress, limit = 50, offset = 0) {
    const sql = `
      SELECT * FROM activity_log
      WHERE wallet_address = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    return query(sql, [walletAddress, limit, offset]);
  },
};

/**
 * Favorites operations
 */
const favoritesDB = {
  /**
   * Toggle favorite
   */
  async toggleFavorite(walletAddress, listingId) {
    const checkSql =
      'SELECT * FROM favorites WHERE wallet_address = ? AND listing_id = ?';
    const existing = await query(checkSql, [walletAddress, listingId]);

    if (existing.length > 0) {
      const deleteSql =
        'DELETE FROM favorites WHERE wallet_address = ? AND listing_id = ?';
      await query(deleteSql, [walletAddress, listingId]);
      return { action: 'removed', isFavorited: false };
    } else {
      const insertSql =
        'INSERT INTO favorites (wallet_address, listing_id) VALUES (?, ?)';
      await query(insertSql, [walletAddress, listingId]);
      return { action: 'added', isFavorited: true };
    }
  },

  /**
   * Get user favorites
   */
  async getUserFavorites(walletAddress, limit = 50, offset = 0) {
    const sql = `
      SELECT l.* FROM listings_cache l
      INNER JOIN favorites f ON l.listing_id = f.listing_id
      WHERE f.wallet_address = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;
    return query(sql, [walletAddress, limit, offset]);
  },

  /**
   * Check if favorited
   */
  async isFavorited(walletAddress, listingId) {
    const sql =
      'SELECT COUNT(*) as count FROM favorites WHERE wallet_address = ? AND listing_id = ?';
    const results = await query(sql, [walletAddress, listingId]);
    return results[0].count > 0;
  },
};

/**
 * Linked Wallets operations
 */
const linkedWalletsDB = {
  /**
   * Link a new wallet to a primary wallet
   */
  async linkWallet(walletAddress, primaryWalletAddress) {
    const sql = `
      INSERT INTO linked_wallets (wallet_address, primary_wallet_address)
      VALUES (?, ?)
    `;
    return query(sql, [walletAddress, primaryWalletAddress]);
  },

  /**
   * Get primary wallet for a given wallet address
   * Returns null if the wallet is not a linked wallet (meaning it might be a primary wallet itself)
   */
  async getPrimaryWallet(walletAddress) {
    const sql =
      'SELECT primary_wallet_address FROM linked_wallets WHERE wallet_address = ?';
    const results = await query(sql, [walletAddress]);
    return results[0] ? results[0].primary_wallet_address : null;
  },

  /**
   * Get all linked wallets for a primary wallet
   */
  async getLinkedWallets(primaryWalletAddress) {
    const sql =
      'SELECT wallet_address, added_at FROM linked_wallets WHERE primary_wallet_address = ?';
    return query(sql, [primaryWalletAddress]);
  },

  /**
   * Unlink a wallet
   */
  async unlinkWallet(walletAddress) {
    const sql = 'DELETE FROM linked_wallets WHERE wallet_address = ?';
    return query(sql, [walletAddress]);
  },
};

/**
 * Link Tokens operations
 */
const linkTokensDB = {
  async createToken(token, userWallet) {
    const sql = `
      INSERT INTO link_tokens (token, user_wallet, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    `;
    return query(sql, [token, userWallet]);
  },

  async getToken(token) {
    const sql =
      'SELECT * FROM link_tokens WHERE token = ? AND expires_at > NOW()';
    const results = await query(sql, [token]);
    return results[0] || null;
  },

  async deleteToken(token) {
    const sql = 'DELETE FROM link_tokens WHERE token = ?';
    return query(sql, [token]);
  },
};

/**
 * Ratings operations
 */
const ratingsDB = {
  async addRating(listingId, reviewerWallet, rating, comment) {
    const sql = `
      INSERT INTO ratings (listing_id, reviewer_wallet, rating, comment)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        comment = VALUES(comment),
        created_at = CURRENT_TIMESTAMP
    `;
    return query(sql, [listingId, reviewerWallet, rating, comment]);
  },

  async getRatings(listingId) {
    const sql = `
      SELECT r.*, u.username, u.display_name, u.avatar_ipfs_hash
      FROM ratings r
      JOIN users u ON r.reviewer_wallet = u.wallet_address
      WHERE r.listing_id = ?
      ORDER BY r.created_at DESC
    `;
    return query(sql, [listingId]);
  }
};

/**
 * System settings operations
 */
const systemDB = {
  async getSetting(key) {
    const sql = 'SELECT setting_value FROM system_settings WHERE setting_key = ?';
    const results = await query(sql, [key]);
    return results[0] ? results[0].setting_value : null;
  },

  async updateSetting(key, value) {
    const sql = `
      INSERT INTO system_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `;
    return query(sql, [key, value]);
  }
};

module.exports = {
  initializeDatabase,
  getPool,
  query,
  transaction,
  userDB,
  sessionDB,
  listingDB,
  notificationDB,
  activityDB,
  favoritesDB,
  linkedWalletsDB,
  linkTokensDB,
  ratingsDB,
  systemDB,
};
