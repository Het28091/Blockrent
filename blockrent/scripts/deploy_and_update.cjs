const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const contractsDir = path.join(rootDir, 'contracts');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

console.log('📜 Deploying smart contract...');

try {
  // Deploy contract
  const output = execSync('npx hardhat run scripts/deploy.js --network localhost', {
    cwd: contractsDir,
    encoding: 'utf8'
  });

  console.log(output);

  // Extract address
  const match = output.match(/Contract Address: (0x[a-fA-F0-9]{40})/);
  if (!match) {
    throw new Error('Could not find contract address in output');
  }

  const contractAddress = match[1];
  console.log(`✅ Contract deployed at: ${contractAddress}`);

  // Update Backend .env
  const backendEnvPath = path.join(backendDir, '.env');
  if (fs.existsSync(backendEnvPath)) {
    let content = fs.readFileSync(backendEnvPath, 'utf8');
    content = content.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${contractAddress}`);
    fs.writeFileSync(backendEnvPath, content);
    console.log('✅ Backend .env updated');
  } else {
      console.warn('⚠️ Backend .env not found');
  }

  // Update Frontend .env
  const frontendEnvPath = path.join(frontendDir, '.env');
  if (fs.existsSync(frontendEnvPath)) {
    let content = fs.readFileSync(frontendEnvPath, 'utf8');
    content = content.replace(/REACT_APP_CONTRACT_ADDRESS=.*/g, `REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);
    fs.writeFileSync(frontendEnvPath, content);
    console.log('✅ Frontend .env updated');
  } else {
      console.warn('⚠️ Frontend .env not found');
  }

  // Update ABIs
  console.log('🔄 Syncing ABIs...');
  execSync('node scripts/update-abis.cjs', {
    cwd: rootDir,
    stdio: 'inherit'
  });

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
