#!/usr/bin/env node

/**
 * Verification Script for Blockchain Security Fixes
 * Checks that all critical security patches have been applied
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Security Fixes...\n');

let passedChecks = 0;
let failedChecks = 0;

function checkFile(filePath, searchString, description, shouldExist = true) {
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    const exists = content.includes(searchString);
    
    if (exists === shouldExist) {
      console.log(`✅ ${description}`);
      passedChecks++;
      return true;
    } else {
      console.log(`❌ ${description}`);
      failedChecks++;
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Could not check: ${description} (${error.message})`);
    failedChecks++;
    return false;
  }
}

console.log('📋 Smart Contract Fixes:\n');

checkFile(
  'contracts/contracts/BlockrentV2.sol',
  'transaction.escrowAmount = 0',
  'Escrow amount reset after transaction completion'
);

checkFile(
  'contracts/contracts/BlockrentV2.sol',
  'require(escrowAmount > 0, "No funds in escrow")',
  'Escrow amount validation before transfers'
);

checkFile(
  'contracts/contracts/BlockrentV2.sol',
  'require(newWinnerScore >= userProfiles[_winner].reputationScore, "Reputation overflow")',
  'Reputation overflow protection'
);

checkFile(
  'contracts/contracts/BlockrentV2.sol',
  'CRITICAL: Update ALL state BEFORE external calls',
  'Checks-Effects-Interactions pattern documented'
);

console.log('\n📋 Backend Security Fixes:\n');

checkFile(
  'backend/database/db.js',
  'const allowedSortColumns',
  'SQL injection prevention - sort column whitelist'
);

checkFile(
  'backend/database/db.js',
  'const allowedSortOrders',
  'SQL injection prevention - sort order whitelist'
);

checkFile(
  'backend/database/schema.sql',
  'CREATE TABLE IF NOT EXISTS used_nonces',
  'Nonce replay attack prevention table'
);

checkFile(
  'backend/services/authService.js',
  'await sessionDB.isNonceUsed(nonce)',
  'Nonce validation in authentication'
);

checkFile(
  'backend/services/authService.js',
  'await sessionDB.markNonceAsUsed(nonce',
  'Nonce marking as used after validation'
);

checkFile(
  'backend/server.js',
  'createListingLimiter',
  'Rate limiting for listing creation'
);

checkFile(
  'backend/server.js',
  'transactionLimiter',
  'Rate limiting for transactions'
);

checkFile(
  'backend/server.js',
  'disputeLimiter',
  'Rate limiting for disputes'
);

console.log('\n📋 Database Optimizations:\n');

checkFile(
  'backend/database/schema.sql',
  'CREATE INDEX idx_listings_active_category',
  'Composite index for active listings by category'
);

checkFile(
  'backend/database/schema.sql',
  'CREATE INDEX idx_transactions_buyer_status',
  'Composite index for buyer transactions by status'
);

checkFile(
  'backend/database/schema.sql',
  'CREATE INDEX idx_notifications_wallet_read',
  'Composite index for unread notifications'
);

console.log('\n📋 Frontend Improvements:\n');

checkFile(
  'frontend/src/context/Web3Context.js',
  'localStorage.removeItem',
  'Proper cleanup on wallet disconnect'
);

checkFile(
  'frontend/src/context/Web3Context.js',
  'console.log(\'Account changed:\'',
  'Account change event logging'
);

checkFile(
  'frontend/src/components/TransactionConfirmModal.js',
  'Transaction Confirmation Modal',
  'Transaction confirmation component exists'
);

console.log('\n📋 Deployment Fixes:\n');

checkFile(
  'contracts/scripts/deploy.js',
  'BlockrentV2',
  'Deployment script uses correct contract name'
);

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passedChecks} passed, ${failedChecks} failed\n`);

if (failedChecks === 0) {
  console.log('🎉 All security fixes verified successfully!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some fixes are missing. Please review the audit report.\n');
  process.exit(1);
}
