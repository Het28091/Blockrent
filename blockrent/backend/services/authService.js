const crypto = require('crypto');

const { ethers } = require('ethers');

const {
  sessionDB,
  userDB,
  linkedWalletsDB,
  linkTokensDB,
} = require('../database/db');

/**
 * Wallet Authentication Service
 * Handles wallet signature verification and session management
 */

/**
 * Generate a nonce for wallet signature
 */
function generateNonce() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create authentication message for wallet signing
 */
function createAuthMessage(walletAddress, nonce) {
  const timestamp = new Date().toISOString();
  return `Welcome to Blockrent!

Sign this message to authenticate your wallet.

Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;
}

/**
 * Verify wallet signature
 */
async function verifySignature(message, signature, expectedAddress) {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    console.log('Signature Verification Debug:');
    console.log('Expected:', expectedAddress);
    console.log('Recovered:', recoveredAddress);
    console.log(
      'Match:',
      recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
    );

    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error.message);
    return false;
  }
}

/**
 * Create a new authentication session
 */
async function createSession(
  walletAddress,
  signature,
  message,
  nonce,
  ipAddress,
  userAgent
) {
  try {
    const normalizedWallet = walletAddress.toLowerCase();

    // CRITICAL: Check if nonce has already been used (prevent replay attacks)
    const nonceUsed = await sessionDB.isNonceUsed(nonce);
    if (nonceUsed) {
      throw new Error(
        'Nonce already used. Please request a new authentication message.'
      );
    }

    // Verify signature first
    const isValid = await verifySignature(message, signature, normalizedWallet);
    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // Mark nonce as used IMMEDIATELY after signature verification
    await sessionDB.markNonceAsUsed(nonce, normalizedWallet);

    // Check if this is a linked wallet
    let effectiveUserWallet = normalizedWallet;
    const primaryWallet =
      await linkedWalletsDB.getPrimaryWallet(normalizedWallet);

    if (primaryWallet) {
      console.log(
        `Login via linked wallet: ${normalizedWallet} -> ${primaryWallet}`
      );
      effectiveUserWallet = primaryWallet;
    }

    // Generate session ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Session expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create or update user FIRST to satisfy foreign key constraint
    // If it's a linked wallet, the primary user MUST exist already (enforced by FK in linked_wallets)
    // If it's a primary wallet, we upsert it
    if (!primaryWallet) {
      await userDB.upsertUser(effectiveUserWallet);
    }

    // Create session in database
    // Note: We store effectiveUserWallet as the session owner so they get logged in as that user
    await sessionDB.createSession({
      sessionId,
      walletAddress: effectiveUserWallet,
      signature,
      message,
      nonce,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // Update last login
    await userDB.updateLastLogin(effectiveUserWallet);

    return {
      success: true,
      sessionId,
      expiresAt,
      walletAddress: effectiveUserWallet,
      loginWallet: normalizedWallet, // Return which wallet was actually used
    };
  } catch (error) {
    console.error('Session creation error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Link a new wallet to the current user
 */
async function linkWallet(
  primaryWalletAddress,
  newWalletAddress,
  signature,
  message,
  nonce
) {
  try {
    const normalizedPrimary = primaryWalletAddress.toLowerCase();
    const normalizedNew = newWalletAddress.toLowerCase();

    // Verify signature of the NEW wallet
    const isValid = await verifySignature(message, signature, normalizedNew);
    if (!isValid) {
      throw new Error('Invalid signature from new wallet');
    }

    // Check if new wallet is already linked or is a primary user
    const existingUser = await userDB.getUserByWallet(normalizedNew);
    if (existingUser) {
      throw new Error('This wallet is already registered as a primary account');
    }

    const existingLink = await linkedWalletsDB.getPrimaryWallet(normalizedNew);
    if (existingLink) {
      throw new Error('This wallet is already linked to an account');
    }

    // Link the wallet
    await linkedWalletsDB.linkWallet(normalizedNew, normalizedPrimary);

    return { success: true };
  } catch (error) {
    console.error('Link wallet error:', error.message);
    throw error;
  }
}

/**
 * Generate a token for linking a new wallet
 */
async function generateLinkToken(userWallet) {
  const token = crypto.randomBytes(32).toString('hex');
  await linkTokensDB.createToken(token, userWallet);
  return token;
}

/**
 * Confirm wallet linking with token
 */
async function confirmLinkWallet(
  token,
  newWalletAddress,
  signature,
  message,
  nonce
) {
  try {
    // Verify token
    const tokenData = await linkTokensDB.getToken(token);
    if (!tokenData) {
      throw new Error('Invalid or expired link token');
    }

    const primaryWallet = tokenData.user_wallet;

    // Link wallet using existing logic
    await linkWallet(
      primaryWallet,
      newWalletAddress,
      signature,
      message,
      nonce
    );

    // Delete token
    await linkTokensDB.deleteToken(token);

    return { success: true, primaryWallet };
  } catch (error) {
    console.error('Confirm link error:', error.message);
    throw error;
  }
}

/**
 * Validate session
 */
async function validateSession(sessionId) {
  try {
    const session = await sessionDB.getSession(sessionId);

    if (!session) {
      return {
        valid: false,
        error: 'Session not found or expired',
      };
    }

    return {
      valid: true,
      walletAddress: session.wallet_address,
      session,
    };
  } catch (error) {
    console.error('Session validation error:', error.message);
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Destroy session (logout)
 */
async function destroySession(sessionId) {
  try {
    await sessionDB.deleteSession(sessionId);
    return {
      success: true,
      message: 'Session terminated successfully',
    };
  } catch (error) {
    console.error('Session destruction error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Destroy all sessions for a wallet (logout from all devices)
 */
async function destroyAllSessions(walletAddress) {
  try {
    const sessions = await sessionDB.getWalletSessions(
      walletAddress.toLowerCase()
    );

    for (const session of sessions) {
      await sessionDB.deleteSession(session.session_id);
    }

    return {
      success: true,
      message: `Terminated ${sessions.length} session(s)`,
      count: sessions.length,
    };
  } catch (error) {
    console.error('All sessions destruction error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clean expired sessions (run periodically)
 */
async function cleanExpiredSessions() {
  try {
    const result = await sessionDB.cleanExpiredSessions();
    console.log(`🧹 Cleaned ${result.affectedRows || 0} expired sessions`);
    return result;
  } catch (error) {
    console.error('Session cleanup error:', error.message);
    return null;
  }
}

/**
 * Authentication middleware for Express
 */
function authMiddleware(req, res, next) {
  const sessionId =
    req.headers['x-session-id'] ||
    req.headers['authorization']?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid session ID',
    });
  }

  validateSession(sessionId)
    .then((result) => {
      if (!result.valid) {
        return res.status(401).json({
          error: 'Invalid or expired session',
          message: result.error,
        });
      }

      // Attach wallet address to request
      req.walletAddress = result.walletAddress;
      req.session = result.session;
      next();
    })
    .catch((error) => {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Authentication error',
        message: error.message,
      });
    });
}

/**
 * Optional authentication middleware (doesn't block if not authenticated)
 */
function optionalAuthMiddleware(req, res, next) {
  const sessionId =
    req.headers['x-session-id'] ||
    req.headers['authorization']?.replace('Bearer ', '');

  if (!sessionId) {
    req.walletAddress = null;
    req.session = null;
    return next();
  }

  validateSession(sessionId)
    .then((result) => {
      if (result.valid) {
        req.walletAddress = result.walletAddress;
        req.session = result.session;
      } else {
        req.walletAddress = null;
        req.session = null;
      }
      next();
    })
    .catch((error) => {
      console.error('Optional auth middleware error:', error);
      req.walletAddress = null;
      req.session = null;
      next();
    });
}

/**
 * Check if address is a valid Ethereum address
 */
function isValidAddress(address) {
  try {
    return ethers.utils.isAddress(address);
  } catch (error) {
    return false;
  }
}

/**
 * Normalize address to checksum format
 */
function normalizeAddress(address) {
  try {
    return ethers.utils.getAddress(address);
  } catch (error) {
    return address.toLowerCase();
  }
}

module.exports = {
  generateNonce,
  createAuthMessage,
  verifySignature,
  createSession,
  validateSession,
  destroySession,
  destroyAllSessions,
  cleanExpiredSessions,
  linkWallet,
  generateLinkToken,
  confirmLinkWallet,
  authMiddleware,
  optionalAuthMiddleware,
  isValidAddress,
  normalizeAddress,
};
