const express = require('express');

const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../services/authService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('NotificationRoutes');

// Get user's notifications
router.get('/', authMiddleware, async (req, res) => {
  const walletAddress = req.walletAddress.toLowerCase();
  try {
    const { unreadOnly, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM notifications WHERE wallet_address = ?';
    const params = [walletAddress];

    if (unreadOnly === 'true') {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const notifications = await db.query(query, params);

    // Get unread count
    const unreadCount = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE wallet_address = ? AND is_read = FALSE',
      [walletAddress]
    );

    res.json({
      notifications,
      unreadCount: unreadCount[0].count,
      total: notifications.length,
    });
  } catch (error) {
    logger.error('Error fetching notifications', {
      error: error.message,
      walletAddress,
    });
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authMiddleware, async (req, res) => {
  const notificationId = parseInt(req.params.notificationId);
  const walletAddress = req.walletAddress.toLowerCase();
  try {
    // Verify notification belongs to user
    const notification = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND wallet_address = ?',
      [notificationId, walletAddress]
    );

    if (!notification || notification.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await db.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?',
      [notificationId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Error marking notification as read', {
      error: error.message,
      notificationId: req.params.notificationId,
    });
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  const walletAddress = req.walletAddress.toLowerCase();
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE wallet_address = ? AND is_read = FALSE',
      [walletAddress]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all notifications as read', {
      error: error.message,
      walletAddress,
    });
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:notificationId', authMiddleware, async (req, res) => {
  const notificationId = parseInt(req.params.notificationId);
  const walletAddress = req.walletAddress.toLowerCase();
  try {
    // Verify notification belongs to user
    const notification = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND wallet_address = ?',
      [notificationId, walletAddress]
    );

    if (!notification || notification.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await db.query('DELETE FROM notifications WHERE id = ?', [notificationId]);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    logger.error('Error deleting notification', {
      error: error.message,
      notificationId,
    });
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.walletAddress.toLowerCase();

    const user = await db.userDB.findByWallet(walletAddress);

    if (!user || !user.notification_preferences) {
      // Return default preferences
      return res.json({
        email: true,
        push: true,
        transactionUpdates: true,
        newMessages: true,
        priceAlerts: true,
        marketingEmails: false,
      });
    }

    res.json(user.notification_preferences);
  } catch (error) {
    logger.error('Error fetching notification preferences', {
      error: error.message,
    });
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update notification preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const walletAddress = req.walletAddress.toLowerCase();
    const preferences = req.body;

    await db.query(
      'UPDATE users SET notification_preferences = ? WHERE wallet_address = ?',
      [JSON.stringify(preferences), walletAddress]
    );

    res.json({
      message: 'Notification preferences updated',
      preferences,
    });
  } catch (error) {
    logger.error('Error updating notification preferences', {
      error: error.message,
    });
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
