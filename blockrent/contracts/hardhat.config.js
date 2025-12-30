require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
const LOCALHOST_RPC = process.env.LOCALHOST_RPC || 'http://127.0.0.1:8545';

module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: LOCALHOST_RPC,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
