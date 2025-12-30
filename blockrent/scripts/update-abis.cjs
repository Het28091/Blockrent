const fs = require('fs');
const path = require('path');

const ARTIFACT_PATH = path.join(__dirname, '../contracts/artifacts/contracts/BlockrentV2.sol/BlockrentV2.json');
const BACKEND_DEST = path.join(__dirname, '../backend/abis/BlockrentV2.json');
const FRONTEND_DEST = path.join(__dirname, '../frontend/src/abis/BlockrentV2.json');

function copyABI() {
  try {
    if (!fs.existsSync(ARTIFACT_PATH)) {
      console.error('❌ Artifact not found:', ARTIFACT_PATH);
      console.error('   Please run: npx hardhat compile in the contracts directory first.');
      process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8'));
    // We only need the ABI for the frontend/backend, but keeping the whole file is fine too.
    // For smaller size, we could extract just the abi.
    const minimalArtifact = {
        abi: artifact.abi,
        contractName: artifact.contractName
    };
    
    const content = JSON.stringify(minimalArtifact, null, 2);

    fs.writeFileSync(BACKEND_DEST, content);
    console.log('✅ Copied ABI to Backend:', BACKEND_DEST);

    fs.writeFileSync(FRONTEND_DEST, content);
    console.log('✅ Copied ABI to Frontend:', FRONTEND_DEST);

  } catch (error) {
    console.error('❌ Error updating ABIs:', error);
    process.exit(1);
  }
}

copyABI();