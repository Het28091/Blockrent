const express = require('express');

const router = express.Router();
const { userDB, favoritesDB, activityDB } = require('../database/db');
const { authValidation } = require('../middleware/validation');
const authService = require('../services/authService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('AuthRoutes');

/**
 * Authentication Routes - Wallet-first authentication
 */

/**
 * @route   POST /api/auth/nonce
 * @desc    Get a nonce for wallet signature
 * @access  Public
 */
router.post('/nonce', authValidation.nonce, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    const nonce = authService.generateNonce();
    const message = authService.createAuthMessage(walletAddress, nonce);

    logger.info('Nonce generated', { walletAddress });

    res.json({
      success: true,
      nonce,
      message,
      walletAddress: authService.normalizeAddress(walletAddress),
    });
  } catch (error) {
    logger.error('Nonce generation error', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate nonce',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/verify
 * @desc    Verify signature and create session
 * @access  Public
/**
 * @route   POST /api/auth/verify
 * @desc    Verify signature and create session
 * @access  Public
 */
router.post('/verify', authValidation.verify, async (req, res) => {
  const { walletAddress, signature, message, nonce } = req.body;
  try {
    const ipAddress =
      req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.createSession(
      walletAddress,
      signature,
      message,
      nonce,
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: result.error,
      });
    }

    // Log authentication activity
    await activityDB.logActivity({
      walletAddress: result.walletAddress,
      action: 'login',
      entityType: 'auth',
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      sessionId: result.sessionId,
      walletAddress: result.walletAddress,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    logger.error('Verification error', { error: error.message, walletAddress });
    res.status(500).json({
      error: 'Verification failed',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Destroy session
 * @access  Private
 */
router.post('/logout', authService.authMiddleware, async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];

    const result = await authService.destroySession(sessionId);

    if (!result.success) {
      return res.status(500).json({
        error: 'Logout failed',
        message: result.error,
      });
    }

    // Log logout activity
    await activityDB.logActivity({
      walletAddress: req.walletAddress,
      action: 'logout',
      entityType: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error', {
      error: error.message,
      walletAddress: req.walletAddress,
    });
    res.status(500).json({
      error: 'Logout failed',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Destroy all sessions for user
 * @access  Private
 */
router.post('/logout-all', authService.authMiddleware, async (req, res) => {
  try {
    const result = await authService.destroyAllSessions(req.walletAddress);

    if (!result.success) {
      return res.status(500).json({
        error: 'Logout failed',
        message: result.error,
      });
    }

    res.json({
      success: true,
      message: result.message,
      count: result.count,
    });
  } catch (error) {
    logger.error('Logout all error', {
      error: error.message,
      walletAddress: req.walletAddress,
    });
    res.status(500).json({
      error: 'Logout failed',
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/auth/session
 * @desc    Validate current session
 * @access  Private
 */
router.get('/session', authService.authMiddleware, async (req, res) => {
  try {
    const user = await userDB.getUserByWallet(req.walletAddress);

    res.json({
      success: true,
      walletAddress: req.walletAddress,
      user: user || null,
      session: {
        expiresAt: req.session.expires_at,
        createdAt: req.session.created_at,
      },
    });
  } catch (error) {
    logger.error('Session check error', { error: error.message });
    res.status(500).json({
      error: 'Session validation failed',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/link-wallet
 * @desc    Link a new wallet to the current account
 * @access  Private
 */
router.post('/link-wallet', authService.authMiddleware, async (req, res) => {
  try {
    const { newWalletAddress, signature, message, nonce } = req.body;

    if (!newWalletAddress || !signature || !message || !nonce) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (!authService.isValidAddress(newWalletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address',
      });
    }

    // The user must be logged in (req.walletAddress is their primary account)
    const primaryWallet = req.walletAddress;

    await authService.linkWallet(
      primaryWallet,
      newWalletAddress,
      signature,
      message,
      nonce
    );

    // Log activity
    await activityDB.logActivity({
      walletAddress: primaryWallet,
      action: 'link_wallet',
      entityType: 'wallet',
      entityId: newWalletAddress,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Wallet linked successfully',
    });
  } catch (error) {
    logger.error('Link wallet error', {
      error: error.message,
      primaryWallet: req.walletAddress,
    });
    res.status(400).json({
      error: 'Failed to link wallet',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/link-token
 * @desc    Generate a token to link a new wallet
 * @access  Private
 */
router.post('/link-token', authService.authMiddleware, async (req, res) => {
  try {
    const token = await authService.generateLinkToken(req.walletAddress);
    res.json({ success: true, token });
  } catch (error) {
    logger.error('Generate link token error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

/**
 * @route   POST /api/auth/confirm-link
 * @desc    Confirm linking a new wallet using a token
 * @access  Public (signed by new wallet)
 */
router.post('/confirm-link', async (req, res) => {
  try {
    const { token, newWalletAddress, signature, message, nonce } = req.body;

    if (!token || !newWalletAddress || !signature || !message || !nonce) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await authService.confirmLinkWallet(
      token,
      newWalletAddress,
      signature,
      message,
      nonce
    );

    // Log activity
    await activityDB.logActivity({
      walletAddress: result.primaryWallet,
      action: 'link_wallet',
      entityType: 'wallet',
      entityId: newWalletAddress,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Wallet linked successfully' });
  } catch (error) {
    logger.error('Confirm link error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
