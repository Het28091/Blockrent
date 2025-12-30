const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const db = require('../database/db');
const { transactionValidation } = require('../middleware/validation');
const { authMiddleware } = require('../services/authService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('TransactionRoutes');

// Get transactions for a listing
router.get('/listing/:listingId', async (req, res) => {
  const listingId = parseInt(req.params.listingId);
  try {
    const transactions = await db.query(
      'SELECT * FROM transactions_cache WHERE listing_id = ? ORDER BY created_at DESC',
      [listingId]
    );

    res.json({
      transactions,
      listingId,
    });
  } catch (error) {
    logger.error('Error fetching listing transactions', {
      error: error.message,
      listingId,
    });
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get single transaction by blockchain ID
router.get('/:transactionId', authMiddleware, async (req, res) => {
  try {
    const transactionId = parseInt(req.params.transactionId);

    const transaction = await db.query(
      'SELECT * FROM transactions_cache WHERE blockchain_id = ?',
      [transactionId]
    );

    if (!transaction || transaction.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = transaction[0];

    // Verify user is part of this transaction
    const userWallet = req.walletAddress.toLowerCase();
    if (
      tx.buyer.toLowerCase() !== userWallet &&
      tx.seller.toLowerCase() !== userWallet
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(tx);
  } catch (error) {
    logger.error('Error fetching transaction', {
      error: error.message,
      transactionId: req.params.transactionId,
    });
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Cache transaction from blockchain
router.post(
  '/',
  authMiddleware,
  [
    body('blockchainId').isInt({ min: 0 }),
    body('listingId').isInt({ min: 0 }),
    body('buyer').isEthereumAddress(),
    body('seller').isEthereumAddress(),
    body('price').isFloat({ min: 0 }),
    body('transactionHash').isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        blockchainId,
        listingId,
        buyer,
        seller,
        price,
        deposit,
        isForRent,
        transactionHash,
      } = req.body;

      // Verify user is part of this transaction
      const userWallet = req.walletAddress.toLowerCase();
      if (
        buyer.toLowerCase() !== userWallet &&
        seller.toLowerCase() !== userWallet
      ) {
        return res
          .status(403)
          .json({ error: 'Cannot cache transaction for other users' });
      }

      // Cache transaction
      const result = await db.query(
        `INSERT INTO transactions_cache 
        (blockchain_id, listing_id, buyer, seller, price, deposit, is_for_rent, status, transaction_hash) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [
          blockchainId,
          listingId,
          buyer.toLowerCase(),
          seller.toLowerCase(),
          price,
          deposit || null,
          isForRent || false,
          transactionHash,
        ]
      );

      const transaction = await db.query(
        'SELECT * FROM transactions_cache WHERE id = ?',
        [result.insertId]
      );

      // Create notifications
      await Promise.all([
        db.notificationDB.createNotification(
          buyer.toLowerCase(),
          'transaction_created',
          `Transaction initiated for listing #${listingId}`,
          { transactionId: blockchainId, listingId, role: 'buyer' }
        ),
        db.notificationDB.createNotification(
          seller.toLowerCase(),
          'transaction_created',
          `New purchase for your listing #${listingId}`,
          { transactionId: blockchainId, listingId, role: 'seller' }
        ),
      ]);

      // Log activity
      await Promise.all([
        db.activityDB.logActivity(
          buyer.toLowerCase(),
          'create',
          'transaction_initiated',
          { transactionId: blockchainId, listingId, role: 'buyer' }
        ),
        db.activityDB.logActivity(
          seller.toLowerCase(),
          'create',
          'transaction_received',
          { transactionId: blockchainId, listingId, role: 'seller' }
        ),
      ]);

      // Broadcast to users
      const io = req.app.get('io');
      io.to(`user_${buyer.toLowerCase()}`).emit(
        'transactionCreated',
        transaction[0]
      );
      io.to(`user_${seller.toLowerCase()}`).emit(
        'transactionCreated',
        transaction[0]
      );

      res.status(201).json({
        message: 'Transaction cached successfully',
        transaction: transaction[0],
      });
    } catch (error) {
      logger.error('Error caching transaction', {
        error: error.message,
        blockchainId: req.body.blockchainId,
      });
      res.status(500).json({ error: 'Failed to cache transaction' });
    }
  }
);

// Update transaction status
router.put('/:transactionId/status', authMiddleware, async (req, res) => {
  const transactionId = parseInt(req.params.transactionId);
  try {
    const { status, confirmedBy } = req.body;

    if (
      !['pending', 'confirmed', 'completed', 'disputed', 'cancelled'].includes(
        status
      )
    ) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const transaction = await db.query(
      'SELECT * FROM transactions_cache WHERE blockchain_id = ?',
      [transactionId]
    );

    if (!transaction || transaction.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = transaction[0];
    const userWallet = req.walletAddress.toLowerCase();

    // Verify user is part of this transaction
    if (
      tx.buyer.toLowerCase() !== userWallet &&
      tx.seller.toLowerCase() !== userWallet
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status
    await db.query(
      `UPDATE transactions_cache 
       SET status = ?, 
           buyer_confirmed = CASE WHEN ? = buyer THEN TRUE ELSE buyer_confirmed END,
           seller_confirmed = CASE WHEN ? = seller THEN TRUE ELSE seller_confirmed END,
           updated_at = NOW()
       WHERE blockchain_id = ?`,
      [status, confirmedBy || '', confirmedBy || '', transactionId]
    );

    const updated = await db.query(
      'SELECT * FROM transactions_cache WHERE blockchain_id = ?',
      [transactionId]
    );

    // Create notifications
    const otherParty =
      userWallet === tx.buyer.toLowerCase() ? tx.seller : tx.buyer;
    await db.notificationDB.createNotification(
      otherParty.toLowerCase(),
      'transaction_updated',
      `Transaction #${transactionId} status updated to ${status}`,
      { transactionId, status }
    );

    // Log activity
    await db.activityDB.logActivity(
      userWallet,
      'update',
      'transaction_status_changed',
      { transactionId, newStatus: status }
    );

    // Broadcast update
    const io = req.app.get('io');
    io.to(`user_${tx.buyer.toLowerCase()}`).emit(
      'transactionUpdated',
      updated[0]
    );
    io.to(`user_${tx.seller.toLowerCase()}`).emit(
      'transactionUpdated',
      updated[0]
    );

    res.json({
      message: 'Transaction updated successfully',
      transaction: updated[0],
    });
  } catch (error) {
    logger.error('Error updating transaction', {
      error: error.message,
      transactionId,
    });
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Get transaction statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
  const walletAddress = req.walletAddress.toLowerCase();
  try {
    const stats = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END) as disputed,
        SUM(CASE WHEN buyer = ? THEN price ELSE 0 END) as totalSpent,
        SUM(CASE WHEN seller = ? THEN price ELSE 0 END) as totalEarned
      FROM transactions_cache
      WHERE buyer = ? OR seller = ?`,
      [walletAddress, walletAddress, walletAddress, walletAddress]
    );

    res.json({
      walletAddress,
      stats: stats[0],
    });
  } catch (error) {
    logger.error('Error fetching transaction stats', {
      error: error.message,
      walletAddress,
    });
    res.status(500).json({ error: 'Failed to fetch transaction statistics' });
  }
});

module.exports = router;
