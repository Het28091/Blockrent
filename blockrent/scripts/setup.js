#!/usr/bin/env node

/**
 * Initial Setup Script
 * Generates secure secrets and creates .env file
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

async function setup() {
  console.log('🚀 Blockrent Initial Setup\n');
  console.log('This script will help you create a secure .env file\n');

  // Check if .env already exists
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await question(
      '.env file already exists. Overwrite? (y/N): '
    );
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\n📝 Configuration:');
  console.log('   (Press Enter to use defaults)\n');

  // Database configuration
  const dbPassword = await question('MySQL root password: ');
  const dbName =
    (await question('Database name (blockrent_db): ')) || 'blockrent_db';

  // IPFS mode
  console.log('\nIPFS Mode:');
  console.log('  1. simulation (no real IPFS, for development)');
  console.log('  2. nft_storage (free, requires API key)');
  console.log('  3. web3_storage (free, requires API key)');
  console.log('  4. local (run your own IPFS node)');
  const ipfsChoice =
    (await question('Choose IPFS mode (1-4, default: 1): ')) || '1';

  const ipfsModes = {
    1: 'simulation',
    2: 'nft_storage',
    3: 'web3_storage',
    4: 'local',
  };
  const ipfsMode = ipfsModes[ipfsChoice] || 'simulation';

  let nftStorageKey = '';
  let web3StorageKey = '';

  if (ipfsMode === 'nft_storage') {
    nftStorageKey = await question(
      'NFT.Storage API key (get from https://nft.storage): '
    );
  } else if (ipfsMode === 'web3_storage') {
    web3StorageKey = await question(
      'Web3.Storage API key (get from https://web3.storage): '
    );
  }

  // Admin wallet
  const adminWallet = await question('\nYour wallet address (admin): ');

  // Generate secrets
  console.log('\n🔐 Generating secure secrets...');
  const jwtSecret = generateSecret(32);
  const sessionSecret = generateSecret(32);
  console.log('✅ Secrets generated\n');

  // Create .env content
  const envContent = `# Blockrent Backend Configuration
# Generated: ${new Date().toISOString()}
# ⚠️  NEVER commit this file to GitHub!

# Server
NODE_ENV=development
PORT=5000

# MySQL Database (FREE)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}

# IPFS Configuration (FREE)
IPFS_MODE=${ipfsMode}
${nftStorageKey ? `NFT_STORAGE_KEY=${nftStorageKey}` : '# NFT_STORAGE_KEY='}
${web3StorageKey ? `WEB3_STORAGE_KEY=${web3StorageKey}` : '# WEB3_STORAGE_KEY='}
LOCAL_IPFS_API=http://127.0.0.1:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs

# Security (Auto-generated)
JWT_SECRET=${jwtSecret}
SESSION_SECRET=${sessionSecret}

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=

# Admin
ADMIN_WALLET=${adminWallet}

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif

# Email (Optional)
SMTP_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@blockrent.com
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created at:', envPath);

  // Verify .gitignore
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    console.log('⚠️  WARNING: .gitignore not found!');
    console.log('   Create it to protect your .env file');
  } else {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
      console.log('⚠️  WARNING: .gitignore does not contain .env');
      console.log('   Add .env to .gitignore immediately!');
    } else {
      console.log('✅ .gitignore is protecting .env files');
    }
  }

  console.log('\n📋 Next Steps:');
  console.log('   1. Install MySQL and create database:');
  console.log('      mysql -u root -p');
  console.log(`      CREATE DATABASE ${dbName};`);
  console.log(`      USE ${dbName};`);
  console.log('      SOURCE backend/database/schema.sql;');
  console.log('\n   2. Deploy smart contract:');
  console.log('      cd contracts');
  console.log('      npx hardhat node');
  console.log('      npx hardhat run scripts/deploy.js --network localhost');
  console.log('\n   3. Update CONTRACT_ADDRESS in .env');
  console.log('\n   4. Start backend:');
  console.log('      cd backend');
  console.log('      npm start');
  console.log('\n🔒 Security Reminder:');
  console.log('   - NEVER commit .env file');
  console.log('   - Run: git status (verify .env is not listed)');
  console.log('   - Run: npm run check-security (before commits)');
  console.log('\n✅ Setup complete!\n');

  rl.close();
}

setup().catch((error) => {
  console.error('Error:', error.message);
  rl.close();
  process.exit(1);
});
