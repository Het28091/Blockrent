const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

/**
 * Validation rules for creating a listing
 */
const createListingValidation = [
  body('blockchainId')
    .isInt({ min: 1 })
    .withMessage('Valid blockchain ID required'),
  body('seller')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Valid Ethereum address required'),
  body('isForRent').isBoolean().withMessage('isForRent must be boolean'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('deposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deposit must be a positive number'),
  body('ipfsHash').notEmpty().withMessage('IPFS hash required'),
  body('metadata').isObject().withMessage('Metadata must be an object'),
  body('metadata.title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be 3-200 characters'),
  body('metadata.description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be 10-5000 characters'),
  body('metadata.category').notEmpty().withMessage('Category required'),
  handleValidationErrors,
];

/**
 * Validation rules for updating a listing
 */
const updateListingValidation = [
  param('listingId').isInt({ min: 1 }).withMessage('Valid listing ID required'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be positive'),
  body('deposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deposit must be positive'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  handleValidationErrors,
];

/**
 * Validation rules for search queries
 */
const searchListingsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be positive'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be positive'),
  handleValidationErrors,
];

/**
 * Validation rules for authentication
 */
const authValidation = {
  nonce: [
    body('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Valid Ethereum address required'),
    handleValidationErrors,
  ],
  verify: [
    body('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Valid Ethereum address required'),
    body('signature').notEmpty().withMessage('Signature required'),
    handleValidationErrors,
  ],
};

/**
 * Validation rules for user profile updates
 */
const updateProfileValidation = [
  param('walletAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Valid Ethereum address required'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      'Username must be 3-30 alphanumeric characters or underscores'
    ),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be 1-50 characters'),
  handleValidationErrors,
];

/**
 * Validation rules for transactions
 */
const transactionValidation = {
  create: [
    body('listingId')
      .isInt({ min: 1 })
      .withMessage('Valid listing ID required'),
    body('transactionHash')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Valid transaction hash required'),
    body('buyer')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Valid buyer address required'),
    body('seller')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Valid seller address required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    handleValidationErrors,
  ],
  updateStatus: [
    param('transactionId')
      .isInt({ min: 1 })
      .withMessage('Valid transaction ID required'),
    body('status')
      .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'disputed'])
      .withMessage('Invalid status'),
    handleValidationErrors,
  ],
};

module.exports = {
  handleValidationErrors,
  createListingValidation,
  updateListingValidation,
  searchListingsValidation,
  authValidation,
  updateProfileValidation,
  transactionValidation,
};
