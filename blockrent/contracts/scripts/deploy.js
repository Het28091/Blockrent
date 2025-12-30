const { ethers } = require('hardhat');

async function main() {
  console.log('\n🚀 Starting Blockrent Contract Deployment...\n');

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log('📍 Deployment Details:');
    console.log('   Network:', network.name);
    console.log('   Deployer:', deployer.address);
    console.log('   Balance:', ethers.formatEther(balance), 'ETH');
    console.log();

    // Deploy contract
    console.log('⏳ Deploying BlockrentV2 contract...');
    const BlockrentFactory = await ethers.getContractFactory('BlockrentV2');
    const blockrent = await BlockrentFactory.deploy(deployer.address);

    await blockrent.waitForDeployment();
    const contractAddress = await blockrent.getAddress();

    console.log('✅ Deployment successful!');
    console.log();
    console.log('📝 Contract Information:');
    console.log('   Contract Address:', contractAddress);
    console.log('   Fee Recipient:', deployer.address);
    console.log();

    // Verify contract configuration
    const platformFee = await blockrent.platformFee();
    const isPaused = await blockrent.paused();

    console.log('⚙️  Contract Configuration:');
    console.log(
      '   Platform Fee:',
      platformFee.toString(),
      'basis points (',
      platformFee / BigInt(100),
      '%)'
    );
    console.log('   Contract Status:', isPaused ? 'Paused' : 'Active');
    console.log();

    console.log('📋 Next Steps:');
    console.log('   1. Copy the contract address above');
    console.log('   2. Update frontend/.env with:');
    console.log('      REACT_APP_CONTRACT_ADDRESS=' + contractAddress);
    console.log('   3. Restart your frontend application');
    console.log();
    console.log('✨ Deployment Complete!\n');
  } catch (error) {
    console.error('\n❌ Deployment Failed:');
    console.error('   Error:', error.message);

    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error(
        '   💡 Tip: Ensure your deployer account has enough ETH for gas fees'
      );
    } else if (error.code === 'NETWORK_ERROR') {
      console.error(
        '   💡 Tip: Check your network connection and RPC endpoint'
      );
    }

    process.exitCode = 1;
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
