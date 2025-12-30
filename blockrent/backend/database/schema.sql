-- Blockrent MySQL Database Schema
-- Wallet-first architecture with off-chain data storage

CREATE DATABASE IF NOT EXISTS blockrent_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blockrent_db;

-- System settings for blockchain sync state and global configs
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User preferences and off-chain data (wallet is primary identifier)
CREATE TABLE IF NOT EXISTS users (
    wallet_address VARCHAR(42) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    bio TEXT,
    avatar_ipfs_hash VARCHAR(100),
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session management (wallet-based authentication)
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    signature TEXT NOT NULL,
    message TEXT NOT NULL,
    nonce VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wallet (wallet_address),
    INDEX idx_expires (expires_at),
    INDEX idx_nonce (nonce),
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Used nonces to prevent replay attacks
CREATE TABLE IF NOT EXISTS used_nonces (
    nonce VARCHAR(100) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    INDEX idx_wallet (wallet_address),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listings cache (synced from blockchain with additional metadata)
CREATE TABLE IF NOT EXISTS listings_cache (
    listing_id BIGINT UNSIGNED PRIMARY KEY,
    owner_wallet VARCHAR(42) NOT NULL,
    category VARCHAR(50),
    price_wei VARCHAR(78) NOT NULL,
    deposit_wei VARCHAR(78),
    ipfs_hash VARCHAR(100) NOT NULL,
    is_for_rent BOOLEAN NOT NULL,
    is_active BOOLEAN NOT NULL,
    views BIGINT UNSIGNED DEFAULT 0,
    favorites BIGINT UNSIGNED DEFAULT 0,
    title VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    tags JSON,
    images JSON,
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    blockchain_created_at TIMESTAMP,
    blockchain_updated_at TIMESTAMP,
    INDEX idx_owner (owner_wallet),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_price (price_wei),
    INDEX idx_created (blockchain_created_at),
    FOREIGN KEY (owner_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transaction cache (synced from blockchain)
CREATE TABLE IF NOT EXISTS transactions_cache (
    transaction_id BIGINT UNSIGNED PRIMARY KEY,
    listing_id BIGINT UNSIGNED NOT NULL,
    buyer_wallet VARCHAR(42) NOT NULL,
    seller_wallet VARCHAR(42) NOT NULL,
    tx_type ENUM('SALE', 'RENT') NOT NULL,
    price_wei VARCHAR(78) NOT NULL,
    deposit_wei VARCHAR(78),
    status VARCHAR(50) NOT NULL,
    tx_hash VARCHAR(66),
    blockchain_started_at TIMESTAMP,
    blockchain_completed_at TIMESTAMP,
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_listing (listing_id),
    INDEX idx_buyer (buyer_wallet),
    INDEX idx_seller (seller_wallet),
    INDEX idx_status (status),
    INDEX idx_started (blockchain_started_at),
    FOREIGN KEY (listing_id) REFERENCES listings_cache(listing_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE,
    FOREIGN KEY (seller_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ratings system
CREATE TABLE IF NOT EXISTS ratings (
    rating_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    listing_id BIGINT UNSIGNED NOT NULL,
    reviewer_wallet VARCHAR(42) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings_cache(listing_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE,
    UNIQUE KEY unique_review (listing_id, reviewer_wallet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'transaction', 'message', 'review', 'dispute', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wallet (wallet_address),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at),
    INDEX idx_type (type),
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages between users (encrypted)
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    from_wallet VARCHAR(42) NOT NULL,
    to_wallet VARCHAR(42) NOT NULL,
    transaction_id BIGINT UNSIGNED,
    listing_id BIGINT UNSIGNED,
    encrypted_content TEXT NOT NULL,
    ipfs_hash VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_from (from_wallet),
    INDEX idx_to (to_wallet),
    INDEX idx_transaction (transaction_id),
    INDEX idx_listing (listing_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (from_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE,
    FOREIGN KEY (to_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Search history for analytics
CREATE TABLE IF NOT EXISTS search_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42),
    search_query VARCHAR(255) NOT NULL,
    filters JSON,
    results_count INT UNSIGNED,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wallet (wallet_address),
    INDEX idx_query (search_query),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42),
    action VARCHAR(100) NOT NULL, -- 'view_listing', 'create_listing', 'purchase', 'favorite', etc.
    entity_type VARCHAR(50), -- 'listing', 'transaction', 'user', etc.
    entity_id VARCHAR(100),
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wallet (wallet_address),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reported content
CREATE TABLE IF NOT EXISTS reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_wallet VARCHAR(42) NOT NULL,
    reported_wallet VARCHAR(42),
    entity_type VARCHAR(50) NOT NULL, -- 'listing', 'user', 'review'
    entity_id VARCHAR(100) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    evidence_ipfs_hash VARCHAR(100),
    status ENUM('pending', 'under_review', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by VARCHAR(42),
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reporter (reporter_wallet),
    INDEX idx_reported (reported_wallet),
    INDEX idx_status (status),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (reporter_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API keys for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    permissions JSON NOT NULL,
    rate_limit INT UNSIGNED DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wallet (wallet_address),
    INDEX idx_key (key_hash),
    INDEX idx_active (is_active),
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favorites (redundant with blockchain but faster queries)
CREATE TABLE IF NOT EXISTS favorites (
    wallet_address VARCHAR(42) NOT NULL,
    listing_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wallet_address, listing_id),
    INDEX idx_wallet (wallet_address),
    INDEX idx_listing (listing_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings_cache(listing_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics aggregation tables
CREATE TABLE IF NOT EXISTS daily_stats (
    stat_date DATE PRIMARY KEY,
    total_users BIGINT UNSIGNED DEFAULT 0,
    new_users BIGINT UNSIGNED DEFAULT 0,
    active_listings BIGINT UNSIGNED DEFAULT 0,
    new_listings BIGINT UNSIGNED DEFAULT 0,
    completed_transactions BIGINT UNSIGNED DEFAULT 0,
    total_volume_wei VARCHAR(78) DEFAULT '0',
    platform_fees_wei VARCHAR(78) DEFAULT '0',
    average_transaction_value_wei VARCHAR(78) DEFAULT '0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- IPFS pins tracking
CREATE TABLE IF NOT EXISTS ipfs_pins (
    ipfs_hash VARCHAR(100) PRIMARY KEY,
    pin_id VARCHAR(255),
    content_type VARCHAR(100),
    size_bytes BIGINT UNSIGNED,
    uploader_wallet VARCHAR(42),
    pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    access_count BIGINT UNSIGNED DEFAULT 0,
    INDEX idx_uploader (uploader_wallet),
    INDEX idx_pinned (pinned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Linked wallets for multi-wallet support
CREATE TABLE IF NOT EXISTS linked_wallets (
    wallet_address VARCHAR(42) PRIMARY KEY,
    primary_wallet_address VARCHAR(42) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_primary (primary_wallet_address),
    FOREIGN KEY (primary_wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Link tokens for wallet linking flow
CREATE TABLE IF NOT EXISTS link_tokens (
    token VARCHAR(255) PRIMARY KEY,
    user_wallet VARCHAR(42) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_wallet),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Composite indexes for common query patterns
CREATE INDEX idx_listings_active_category ON listings_cache(is_active, category);
CREATE INDEX idx_listings_active_price ON listings_cache(is_active, price_wei);
CREATE INDEX idx_listings_owner_active ON listings_cache(owner_wallet, is_active);
CREATE INDEX idx_transactions_buyer_status ON transactions_cache(buyer_wallet, status);
CREATE INDEX idx_transactions_seller_status ON transactions_cache(seller_wallet, status);
CREATE INDEX idx_notifications_wallet_read ON notifications(wallet_address, is_read, created_at);
CREATE INDEX idx_messages_conversation ON messages(from_wallet, to_wallet, created_at);

-- Disputes cache (synced from blockchain)
CREATE TABLE IF NOT EXISTS disputes_cache (
    dispute_id BIGINT UNSIGNED PRIMARY KEY,
    transaction_id BIGINT UNSIGNED NOT NULL,
    initiator_wallet VARCHAR(42) NOT NULL,
    defendant_wallet VARCHAR(42) NOT NULL,
    reason TEXT,
    ipfs_hash VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    winner_wallet VARCHAR(42),
    blockchain_created_at TIMESTAMP,
    blockchain_resolved_at TIMESTAMP,
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_transaction (transaction_id),
    INDEX idx_initiator (initiator_wallet),
    INDEX idx_defendant (defendant_wallet),
    INDEX idx_status (status),
    FOREIGN KEY (transaction_id) REFERENCES transactions_cache(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (initiator_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE,
    FOREIGN KEY (defendant_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews cache (synced from blockchain)
CREATE TABLE IF NOT EXISTS reviews_cache (
    review_id BIGINT UNSIGNED PRIMARY KEY,
    transaction_id BIGINT UNSIGNED NOT NULL,
    reviewer_wallet VARCHAR(42) NOT NULL,
    reviewee_wallet VARCHAR(42) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    ipfs_hash VARCHAR(100),
    blockchain_timestamp TIMESTAMP,
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_transaction (transaction_id),
    INDEX idx_reviewer (reviewer_wallet),
    INDEX idx_reviewee (reviewee_wallet),
    INDEX idx_rating (rating),
    FOREIGN KEY (transaction_id) REFERENCES transactions_cache(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_wallet) REFERENCES users(wallet_address) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
