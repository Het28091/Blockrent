#!/usr/bin/env node

/**
 * Auto Environment Setup Script for Blockrent
 *
 * This script automatically extracts the first funded account from Hardhat node output
 * and updates the contracts/.env file with PRIVATE_KEY and ACCOUNT_ADDRESS.
 *
 * Usage:
 * 1. Start Hardhat node: npx hardhat node
 * 2. In another terminal: node scripts/auto-env-setup.js
 *
 * The script will:
 * - Extract the first account's private key and address from Hardhat output
 * - Update contracts/.env with the extracted values
 * - Provide fallback for manual .env values if auto-extraction fails
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const CONTRACTS_ENV_PATH = path.join(__dirname, '..', 'contracts', '.env');
const HARDHAT_NODE_COMMAND = 'npx';
const HARDHAT_NODE_ARGS = ['hardhat', 'node'];

/**
 * Extract account data from Hardhat node output
 * @param {string} output - Raw output from Hardhat node
 * @returns {Object|null} - Account data or null if not found
 */
function extractAccountData(output) {
  // Pattern to match Hardhat account output
  const accountPattern =
    /Account #0:\s*([0-9a-fA-F]{40})\s*\(([0-9a-fA-F]{64})\)/;
  const match = output.match(accountPattern);

  if (match) {
    return {
      address: match[1],
      privateKey: match[2], // Already without 0x prefix
    };
  }

  return null;
}

/**
 * Read existing .env file or create empty object
 * @returns {Object} - Environment variables object
 */
function readEnvFile() {
  if (fs.existsSync(CONTRACTS_ENV_PATH)) {
    const content = fs.readFileSync(CONTRACTS_ENV_PATH, 'utf8');
    const env = {};

    content.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });

    return env;
  }

  return {};
}

/**
 * Write environment variables to .env file
 * @param {Object} env - Environment variables object
 */
function writeEnvFile(env) {
  const envContent = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Ensure contracts directory exists
  const contractsDir = path.dirname(CONTRACTS_ENV_PATH);
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(CONTRACTS_ENV_PATH, envContent);
  console.log(`✅ Updated ${CONTRACTS_ENV_PATH}`);
}

/**
 * Start Hardhat node and extract account data
 * @returns {Promise<Object|null>} - Account data or null
 */
function startHardhatNodeAndExtract() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Hardhat node to extract account data...');

    const hardhatProcess = spawn(HARDHAT_NODE_COMMAND, HARDHAT_NODE_ARGS, {
      cwd: path.join(__dirname, '..', 'contracts'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let accountData = null;
    let resolved = false;

    // Collect output
    hardhatProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log(chunk);

      // Try to extract account data from current output
      if (!accountData) {
        accountData = extractAccountData(output);
        if (accountData && !resolved) {
          resolved = true;
          console.log('\n🎯 Account data extracted successfully!');
          console.log(`Address: ${accountData.address}`);
          console.log(
            `Private Key: ${accountData.privateKey.substring(0, 8)}...`
          );

          // Update .env file
          const env = readEnvFile();
          env.PRIVATE_KEY = accountData.privateKey;
          env.ACCOUNT_ADDRESS = accountData.address;
          writeEnvFile(env);

          // Kill the Hardhat process
          hardhatProcess.kill();
          resolve(accountData);
        }
      }
    });

    hardhatProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    hardhatProcess.on('close', (code) => {
      if (!resolved) {
        console.log(
          '❌ Hardhat node closed before account data could be extracted'
        );
        resolve(null);
      }
    });

    hardhatProcess.on('error', (error) => {
      if (!resolved) {
        console.error('❌ Error starting Hardhat node:', error.message);
        reject(error);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved) {
        console.log('⏰ Timeout waiting for account data extraction');
        hardhatProcess.kill();
        resolve(null);
      }
    }, 30000);
  });
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Blockrent Auto Environment Setup');
  console.log('=====================================\n');

  try {
    // Check if .env already exists with valid data
    const existingEnv = readEnvFile();
    if (existingEnv.PRIVATE_KEY && existingEnv.ACCOUNT_ADDRESS) {
      console.log('📁 Found existing .env file with account data:');
      console.log(`Address: ${existingEnv.ACCOUNT_ADDRESS}`);
      console.log(`Private Key: ${existingEnv.PRIVATE_KEY.substring(0, 8)}...`);
      console.log('\n✅ Environment already configured!');
      return;
    }

    // Try to extract from running Hardhat node or start new one
    const accountData = await startHardhatNodeAndExtract();

    if (accountData) {
      console.log('\n🎉 Environment setup completed successfully!');
      console.log(
        'You can now run: npx hardhat run scripts/deploy.js --network localhost'
      );
    } else {
      console.log('\n⚠️  Could not automatically extract account data.');
      console.log('Please manually create contracts/.env with:');
      console.log('PRIVATE_KEY=your_private_key_without_0x_prefix');
      console.log('ACCOUNT_ADDRESS=your_wallet_address');
    }
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  extractAccountData,
  readEnvFile,
  writeEnvFile,
};
