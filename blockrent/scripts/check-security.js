#!/usr/bin/env node

/**
 * Security Check Script
 * Run before every git commit to ensure no sensitive data is included
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Running security checks...\n');

let hasErrors = false;

// Check 1: Verify .env files are not staged
console.log('1️⃣  Checking for .env files...');
try {
  const stagedFiles = execSync('git diff --cached --name-only', {
    encoding: 'utf8',
  });
  const envFiles = stagedFiles
    .split('\n')
    .filter((file) => file.includes('.env') && !file.includes('.env.example'));

  if (envFiles.length > 0) {
    console.error('❌ ERROR: .env files are staged for commit:');
    envFiles.forEach((file) => console.error(`   - ${file}`));
    console.error('\n   Run: git rm --cached <file>');
    hasErrors = true;
  } else {
    console.log('✅ No .env files staged\n');
  }
} catch (error) {
  console.log('⚠️  Could not check staged files (not a git repo?)\n');
}

// Check 2: Search for common secret patterns in staged changes
console.log('2️⃣  Scanning for hardcoded secrets...');
try {
  const diff = execSync('git diff --cached', { encoding: 'utf8' });

  const secretPatterns = [
    { pattern: /password\s*=\s*["'][^"']{8,}["']/gi, name: 'passwords' },
    { pattern: /secret\s*=\s*["'][^"']{16,}["']/gi, name: 'secrets' },
    { pattern: /api[_-]?key\s*=\s*["'][^"']{16,}["']/gi, name: 'API keys' },
    {
      pattern: /private[_-]?key\s*=\s*["']0x[0-9a-f]{64}["']/gi,
      name: 'private keys',
    },
    { pattern: /sk_live_[a-zA-Z0-9]{24,}/g, name: 'Stripe keys' },
    { pattern: /pk_live_[a-zA-Z0-9]{24,}/g, name: 'Stripe keys' },
  ];

  let foundSecrets = false;
  secretPatterns.forEach(({ pattern, name }) => {
    const matches = diff.match(pattern);
    if (matches && matches.length > 0) {
      if (!foundSecrets) {
        console.error('❌ ERROR: Potential secrets found in staged changes:');
        foundSecrets = true;
        hasErrors = true;
      }
      console.error(`   - ${name}: ${matches.length} occurrence(s)`);
    }
  });

  if (!foundSecrets) {
    console.log('✅ No hardcoded secrets detected\n');
  } else {
    console.error('\n   ⚠️  Move all secrets to .env files!\n');
  }
} catch (error) {
  console.log('⚠️  Could not scan diff\n');
}

// Check 3: Verify .gitignore exists and contains .env
console.log('3️⃣  Verifying .gitignore...');
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env')) {
    console.log('✅ .gitignore properly configured\n');
  } else {
    console.error('❌ ERROR: .gitignore missing .env entries');
    hasErrors = true;
  }
} else {
  console.error('❌ ERROR: .gitignore file not found');
  hasErrors = true;
}

// Check 4: Verify required .env.example exists
console.log('4️⃣  Checking .env.example...');
const envExamplePath = path.join(process.cwd(), 'backend', '.env.example');
if (fs.existsSync(envExamplePath)) {
  console.log('✅ .env.example exists\n');
} else {
  console.warn('⚠️  WARNING: backend/.env.example not found\n');
}

// Check 5: Look for common sensitive files
console.log('5️⃣  Checking for sensitive files...');
const sensitiveFiles = [
  'users.json',
  'listings.json',
  'purchases.json',
  'private-keys.txt',
  'secrets.txt',
  'database.json',
];

let foundSensitiveFiles = false;
try {
  const stagedFiles = execSync('git diff --cached --name-only', {
    encoding: 'utf8',
  });
  sensitiveFiles.forEach((file) => {
    if (stagedFiles.includes(file)) {
      if (!foundSensitiveFiles) {
        console.error('❌ ERROR: Sensitive files staged:');
        foundSensitiveFiles = true;
        hasErrors = true;
      }
      console.error(`   - ${file}`);
    }
  });
} catch (error) {
  // Ignore
}

if (!foundSensitiveFiles) {
  console.log('✅ No sensitive files staged\n');
} else {
  console.error('\n   Run: git rm --cached <file>\n');
}

// Final result
console.log('═'.repeat(50));
if (hasErrors) {
  console.error('❌ SECURITY CHECK FAILED');
  console.error('   Fix the issues above before committing!\n');
  process.exit(1);
} else {
  console.log('✅ ALL SECURITY CHECKS PASSED');
  console.log('   Safe to commit!\n');
  process.exit(0);
}
