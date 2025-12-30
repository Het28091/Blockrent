require('dotenv').config();
const http = require('http');

const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const socketIo = require('socket.io');

// Import utilities
const { createLogger } = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./utils/errors');

// Import services
const db = require('./database/db');
const logger = createLogger('Server');

// Import routes
const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const notificationRoutes = require('./routes/notifications');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');
const authService = require('./services/authService');
const blockchainSync = require('./services/blockchainSync');
const ipfsService = require('./services/ipfsService');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "ws:", "wss:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003'
).split(',');
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased for development
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
});

// Strict rate limiting for expensive operations
const createListingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 listings per hour
  message: {
    error: 'Too many listings created. Please try again later.',
  },
});

const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Max 50 transactions per hour
  message: {
    error: 'Too many transactions. Please try again later.',
  },
});

const disputeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Max 5 disputes per day
  message: {
    error: 'Too many disputes created. Please contact support.',
  },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(require('./utils/logger').Logger.requestLogger('HTTP'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: db.pool ? 'connected' : 'disconnected',
      ipfs: ipfsService ? 'available' : 'unavailable',
      blockchain: process.env.CONTRACT_ADDRESS
        ? 'configured'
        : 'not configured',
    },
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler (must come before error handler)
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler(logger));

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  // Join user-specific room
  socket.on('joinUserRoom', (walletAddress) => {
    if (walletAddress) {
      socket.join(`user_${walletAddress.toLowerCase()}`);
      logger.debug('User joined room', { walletAddress, socketId: socket.id });
    }
  });

  // Join marketplace room
  socket.on('joinMarketplace', () => {
    socket.join('marketplace');
    logger.debug('User joined marketplace', { socketId: socket.id });
  });

  // Leave rooms on disconnect
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Initialize Database and Start Server
async function startServer() {
  try {
    // Initialize database connection
    logger.info('Initializing database connection...');
    await db.initializeDatabase();
    logger.info('Database connected successfully');

    // Start blockchain sync
    logger.info('Starting blockchain sync service...');
    blockchainSync.start(io).catch((error) => {
      logger.warn('Blockchain sync service failed to start', {
        error: error.message,
      });
      logger.info('App will continue without blockchain sync');
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║          Blockrent Backend Server Started                 ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server:      http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database:    ${process.env.DB_NAME || 'blockrent_db'}
🔗 Blockchain:  ${process.env.NETWORK || 'localhost'}
💾 IPFS Mode:   ${process.env.IPFS_MODE || 'simulation'}

API Endpoints:
  ✅ GET  /api/health
  
  Authentication:
  ✅ POST /api/auth/nonce
  ✅ POST /api/auth/verify
  ✅ POST /api/auth/logout
  ✅ GET  /api/auth/session
  
  Users:
  ✅ GET  /api/users/:walletAddress
  ✅ PUT  /api/users/:walletAddress
  ✅ GET  /api/users/:walletAddress/listings
  ✅ GET  /api/users/:walletAddress/transactions
  ✅ GET  /api/users/:walletAddress/favorites
  ✅ POST /api/users/:walletAddress/favorites/:listingId
  
  Listings:
  ✅ GET  /api/listings
  ✅ GET  /api/listings/:listingId
  ✅ POST /api/listings
  ✅ PUT  /api/listings/:listingId
  ✅ POST /api/listings/metadata/upload
  ✅ POST /api/listings/search
  
  Transactions:
  ✅ GET  /api/transactions/:transactionId
  ✅ POST /api/transactions
  ✅ PUT  /api/transactions/:transactionId/status
  ✅ GET  /api/transactions/stats/overview
  
  Notifications:
  ✅ GET  /api/notifications
  ✅ PUT  /api/notifications/:id/read
  ✅ PUT  /api/notifications/read-all
  ✅ DELETE /api/notifications/:id
  
Ready to accept connections! 🎉
`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully...');

  // Stop blockchain sync
  blockchainSync.stop();

  // Close database connections
  if (db.pool) {
    await db.pool.end();
    logger.info('Database connections closed');
  }

  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
