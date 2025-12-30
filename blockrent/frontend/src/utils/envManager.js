/**
 * Environment Manager for Blockrent Frontend
 *
 * Handles environment variable management with automatic fallbacks
 * and provides utilities for contract address and network configuration.
 */

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value if not found
 * @returns {string} - Environment variable value or fallback
 */
export const getEnvVar = (key, fallback = '') => {
  return process.env[key] || fallback;
};

/**
 * Get contract address from environment
 * @returns {string} - Contract address or empty string
 */
export const getContractAddress = () => {
  return getEnvVar('REACT_APP_CONTRACT_ADDRESS', '');
};

/**
 * Get supported network configuration
 * @returns {Object} - Network configuration object
 */
export const getNetworkConfig = () => {
  return {
    localhost: {
      chainId: 31337,
      name: 'Localhost 8545',
      rpcUrl: 'http://localhost:8545',
      symbol: 'ETH',
      decimals: 18,
    },
    mumbai: {
      chainId: 80001,
      name: 'Polygon Mumbai',
      rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
      symbol: 'MATIC',
      decimals: 18,
    },
  };
};

/**
 * Check if contract address is configured
 * @returns {boolean} - True if contract address is set
 */
export const isContractConfigured = () => {
  const address = getContractAddress();
  return address && address.length === 42 && address.startsWith('0x');
};

/**
 * Get environment status for debugging
 * @returns {Object} - Environment status object
 */
export const getEnvironmentStatus = () => {
  return {
    contractAddress: getContractAddress(),
    isContractConfigured: isContractConfigured(),
    nodeEnv: process.env.NODE_ENV,
    hasMetaMask:
      typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
  };
};

/**
 * Validate environment setup
 * @returns {Object} - Validation result with errors and warnings
 */
export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];

  if (!isContractConfigured()) {
    errors.push('REACT_APP_CONTRACT_ADDRESS is not configured');
  }

  if (typeof window !== 'undefined' && !window.ethereum) {
    warnings.push('MetaMask not detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
