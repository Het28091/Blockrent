require('dotenv').config();
const { ethers } = require('ethers');

const db = require('../database/db');

const ipfsService = require('./ipfsService');

// Import Contract ABI
const BlockrentV2 = require('../abis/BlockrentV2.json');

class BlockchainSyncService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.isRunning = false;
    this.io = null;
    this.listeners = [];
  }

  async start(io) {
    try {
      this.io = io;

      // Connect to blockchain
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (!contractAddress) {
        console.warn(
          '⚠️  No CONTRACT_ADDRESS found - blockchain sync disabled'
        );
        return;
      }

      this.contract = new ethers.Contract(
        contractAddress,
        BlockrentV2.abi,
        this.provider
      );

      console.log('🔗 Connecting to blockchain...');
      const network = await this.provider.getNetwork();
      console.log(
        `✅ Connected to network: ${network.name} (chainId: ${network.chainId})`
      );

      // Set up event listeners
      this.setupEventListeners();

      // Sync historical data
      await this.syncHistoricalData();

      this.isRunning = true;
      console.log('✅ Blockchain sync service started');
    } catch (error) {
      console.error(
        '❌ Failed to start blockchain sync service:',
        error.message
      );
      // Continue running without blockchain sync
    }
  }

  setupEventListeners() {
    // ListingCreated event
    const listingCreatedListener = this.contract.on(
      'ListingCreated',
      async (
        listingId,
        owner,
        category,
        price,
        deposit,
        ipfsHash,
        isForRent,
        event
      ) => {
        try {
          console.log(`📝 New listing created: #${listingId.toString()}`);

          // Fetch metadata from IPFS
          let metadata = {};
          try {
            metadata = await ipfsService.fetchFromIPFS(ipfsHash);
          } catch (error) {
            console.error('Error fetching IPFS metadata:', error);
          }

          // Cache in database
          console.log('💾 Caching listing to database:', {
            listingId: listingId.toNumber(),
            owner: owner.toLowerCase(),
            title: metadata?.data?.title || 'Untitled',
          });

          try {
            await db.listingDB.cacheBlisting({
              listingId: listingId.toNumber(),
              ownerWallet: owner.toLowerCase(),
              isForRent: isForRent,
              priceWei: price.toString(),
              depositWei: deposit.toString(),
              ipfsHash: ipfsHash,
              title: metadata?.data?.title || 'Untitled',
              description: metadata?.data?.description || '',
              category: category || metadata?.data?.category || 'General',
              location: metadata?.data?.location || 'Global',
              tags: metadata?.data?.tags || [],
              images: metadata?.data?.images || [],
              isActive: true,
              views: 0,
              favorites: 0,
              createdAt: Math.floor(Date.now() / 1000),
              updatedAt: Math.floor(Date.now() / 1000),
            });

            console.log('✅ Listing cached successfully');
            
            // Update last synced block
            await db.systemDB.updateSetting('last_synced_block', event.blockNumber.toString());

          } catch (dbError) {
            console.error('❌ Database caching failed:', dbError);
            console.error('Error details:', {
              message: dbError.message,
              code: dbError.code,
              errno: dbError.errno,
              sql: dbError.sql,
            });
            throw dbError; // Re-throw to be caught by outer catch
          }

          // Fetch the cached listing to broadcast
          const listing = await db.listingDB.getListingById(
            listingId.toNumber()
          );
          console.log('📤 Broadcasting listing:', listing);

          // Broadcast to marketplace
          if (listing) {
            this.io.to('marketplace').emit('listingCreated', listing);
          }

          // Log activity
          await db.activityDB.logActivity({
            walletAddress: owner.toLowerCase(),
            action: 'create',
            entityType: 'listing',
            entityId: listingId.toNumber().toString(),
            metadata: {
              listingId: listingId.toNumber(),
              transactionHash: event.transactionHash,
            },
          });
        } catch (error) {
          console.error('Error handling ListingCreated event:', error);
        }
      }
    );
    this.listeners.push(listingCreatedListener);

    // TransactionStarted event
    const transactionStartedListener = this.contract.on(
      'TransactionStarted',
      async (
        transactionId,
        listingId,
        buyer,
        seller,
        amount,
        transactionType,
        event
      ) => {
        try {
          console.log(
            `💰 New transaction created: #${transactionId.toString()}`
          );

          // Cache in database
          await db.query(
            `INSERT INTO transactions_cache 
          (transaction_id, listing_id, buyer_wallet, seller_wallet, price_wei, status, tx_hash, tx_type) 
          VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
          ON DUPLICATE KEY UPDATE status = 'ACTIVE', last_synced = NOW()`,
            [
              transactionId.toNumber(),
              listingId.toNumber(),
              buyer.toLowerCase(),
              seller.toLowerCase(),
              amount.toString(),
              event.transactionHash,
              transactionType === 0 ? 'SALE' : 'RENT',
            ]
          );

          // Update listing status if it's a sale
          if (transactionType === 0) {
            await db.query(
              'UPDATE listings_cache SET is_active = ? WHERE listing_id = ?',
              [false, listingId.toNumber()]
            );
          }
          
          // Update last synced block
          await db.systemDB.updateSetting('last_synced_block', event.blockNumber.toString());

          // Create notifications
          await Promise.all([
            db.notificationDB.createNotification({
              walletAddress: buyer.toLowerCase(),
              type: 'transaction_created',
              title: 'Purchase Initiated',
              message: `Your purchase has been initiated for listing #${listingId.toString()}`,
              data: {
                transactionId: transactionId.toNumber(),
                listingId: listingId.toNumber(),
              }
            }),
            db.notificationDB.createNotification({
              walletAddress: seller.toLowerCase(),
              type: 'new_sale',
              title: 'New Sale',
              message: `New purchase for your listing #${listingId.toString()}`,
              data: {
                transactionId: transactionId.toNumber(),
                listingId: listingId.toNumber(),
              }
            }),
          ]);

          // Broadcast to users
          this.io.to(`user_${buyer.toLowerCase()}`).emit('transactionCreated', {
            transactionId: transactionId.toNumber(),
            listingId: listingId.toNumber(),
          });
          this.io.to(`user_${seller.toLowerCase()}`).emit('newSale', {
            transactionId: transactionId.toNumber(),
            listingId: listingId.toNumber(),
          });
        } catch (error) {
          console.error('Error handling TransactionStarted event:', error);
        }
      }
    );
    this.listeners.push(transactionStartedListener);

    // TransactionConfirmed event
    const transactionConfirmedListener = this.contract.on(
      'TransactionConfirmed',
      async (transactionId, confirmedBy, event) => {
        try {
          console.log(`✅ Transaction confirmed: #${transactionId.toString()}`);

          const tx = await db.query(
            'SELECT * FROM transactions_cache WHERE transaction_id = ?',
            [transactionId.toNumber()]
          );

          if (tx.length > 0) {
            const isBuyer =
              tx[0].buyer_wallet.toLowerCase() === confirmedBy.toLowerCase();

            await db.query(
              `UPDATE transactions_cache 
             SET ${isBuyer ? 'buyer_confirmed' : 'seller_confirmed'} = TRUE, status = 'ACTIVE', last_synced = NOW()
             WHERE transaction_id = ?`,
              [transactionId.toNumber()]
            );
            
            // Update last synced block
            await db.systemDB.updateSetting('last_synced_block', event.blockNumber.toString());

            // Notify other party
            const otherParty = isBuyer ? tx[0].seller_wallet : tx[0].buyer_wallet;
            await db.notificationDB.createNotification({
              walletAddress: otherParty.toLowerCase(),
              type: 'transaction_confirmed',
              title: 'Transaction Confirmed',
              message: `Transaction #${transactionId.toString()} has been confirmed by ${isBuyer ? 'buyer' : 'seller'}`,
              data: { transactionId: transactionId.toNumber() }
            });

            this.io
              .to(`user_${otherParty.toLowerCase()}`)
              .emit('transactionConfirmed', {
                transactionId: transactionId.toNumber(),
                confirmedBy: confirmedBy.toLowerCase(),
              });
          }
        } catch (error) {
          console.error('Error handling TransactionConfirmed event:', error);
        }
      }
    );
    this.listeners.push(transactionConfirmedListener);

    // TransactionCompleted event
    const transactionCompletedListener = this.contract.on(
      'TransactionCompleted',
      async (transactionId, timestamp, event) => {
        try {
          console.log(`📦 Delivery confirmed: #${transactionId.toString()}`);

          await db.query(
            'UPDATE transactions_cache SET status = ?, blockchain_completed_at = FROM_UNIXTIME(?), last_synced = NOW() WHERE transaction_id = ?',
            ['COMPLETED', timestamp.toNumber(), transactionId.toNumber()]
          );
          
          // Update last synced block
          await db.systemDB.updateSetting('last_synced_block', event.blockNumber.toString());

          const tx = await db.query(
            'SELECT * FROM transactions_cache WHERE transaction_id = ?',
            [transactionId.toNumber()]
          );

          if (tx.length > 0) {
            // Notify both parties
            await Promise.all([
              db.notificationDB.createNotification({
                walletAddress: tx[0].buyer_wallet.toLowerCase(),
                type: 'transaction_completed',
                title: 'Transaction Completed',
                message: `Transaction #${transactionId.toString()} has been completed`,
                data: { transactionId: transactionId.toNumber() }
              }),
              db.notificationDB.createNotification({
                walletAddress: tx[0].seller_wallet.toLowerCase(),
                type: 'transaction_completed',
                title: 'Transaction Completed',
                message: `Transaction #${transactionId.toString()} has been completed`,
                data: { transactionId: transactionId.toNumber() }
              }),
            ]);

            this.io
              .to(`user_${tx[0].buyer_wallet.toLowerCase()}`)
              .emit('transactionCompleted', {
                transactionId: transactionId.toNumber(),
              });
            this.io
              .to(`user_${tx[0].seller_wallet.toLowerCase()}`)
              .emit('transactionCompleted', {
                transactionId: transactionId.toNumber(),
              });
          }
        } catch (error) {
          console.error('Error handling DeliveryConfirmed event:', error);
        }
      }
    );
    this.listeners.push(transactionCompletedListener);

    // DisputeCreated event
    const disputeCreatedListener = this.contract.on(
      'DisputeCreated',
      async (disputeId, transactionId, initiator, reason, event) => {
        try {
          console.log(`Dispute created: #${disputeId.toString()}`);

          const tx = await db.query(
            'SELECT * FROM transactions_cache WHERE transaction_id = ?',
            [transactionId.toNumber()]
          );

          if (tx.length > 0) {
            const defendant =
              tx[0].buyer_wallet.toLowerCase() === initiator.toLowerCase()
                ? tx[0].seller_wallet
                : tx[0].buyer_wallet;
            // Cache in database
            await db.query(
              `INSERT INTO disputes_cache 
            (dispute_id, transaction_id, initiator_wallet, defendant_wallet, reason, status, blockchain_created_at) 
            VALUES (?, ?, ?, ?, ?, 'OPEN', FROM_UNIXTIME(?))
            ON DUPLICATE KEY UPDATE status = 'OPEN', last_synced = NOW()`,
              [
                disputeId.toNumber(),
                transactionId.toNumber(),
                initiator.toLowerCase(),
                defendant.toLowerCase(),
                reason,
                event.blockTimestamp, // Use event block timestamp, not event.blockTimestamp directly if undefined in event args (ethers sometimes puts it in event.args or requires getting block)
                // Note: event argument signature has 'event' at the end, but blockTimestamp is usually not in args unless emitted.
                // Assuming it's available or we use Date.now() / 1000
              ]
            );
            
            // To be safe with timestamp:
            const block = await event.getBlock();
            const timestamp = block.timestamp;
             await db.query(
              `UPDATE disputes_cache SET blockchain_created_at = FROM_UNIXTIME(?) WHERE dispute_id = ?`,
              [timestamp, disputeId.toNumber()]
            );

            // Update transaction status
            await db.query(
              'UPDATE transactions_cache SET status = ? WHERE transaction_id = ?',
              ['DISPUTED', transactionId.toNumber()]
            );
            
            // Update last synced block
            await db.systemDB.updateSetting('last_synced_block', event.blockNumber.toString());

            // Notify defendant
            await db.notificationDB.createNotification({
              walletAddress: defendant.toLowerCase(),
              type: 'new_dispute',
              title: 'Dispute Opened',
              message: `A dispute has been opened for transaction #${transactionId.toString()}`,
              data: {
                disputeId: disputeId.toNumber(),
                transactionId: transactionId.toNumber(),
              }
            });

            this.io.to(`user_${defendant.toLowerCase()}`).emit('newDispute', {
              disputeId: disputeId.toNumber(),
              transactionId: transactionId.toNumber(),
            });
          }
        } catch (error) {
          console.error('Error handling DisputeCreated event:', error);
        }
      }
    );
    this.listeners.push(disputeCreatedListener);

    // DisputeResolved event
    const disputeResolvedListener = this.contract.on(
      'DisputeResolved',
      async (disputeId, winner, timestamp, event) => {
        try {
          console.log(`Dispute resolved: #${disputeId.toString()}`);

          // Update dispute in database
          await db.query(
            `UPDATE disputes_cache 
           SET status = 'RESOLVED', winner_wallet = ?, blockchain_resolved_at = FROM_UNIXTIME(?), last_synced = NOW()
           WHERE dispute_id = ?`,
            [winner.toLowerCase(), timestamp.toNumber(), disputeId.toNumber()]
          );
          
          // Update last synced block
          await db.systemDB.updateSetting('last_synced_block', event.blockNumber.toString());

          const dispute = await db.query(
            'SELECT * FROM disputes_cache WHERE dispute_id = ?',
            [disputeId.toNumber()]
          );

          if (dispute.length > 0) {
            const loser =
              dispute[0].initiator_wallet.toLowerCase() === winner.toLowerCase()
                ? dispute[0].defendant_wallet
                : dispute[0].initiator_wallet;
            // Notify both parties
            await db.notificationDB.createNotification({
              walletAddress: winner.toLowerCase(),
              type: 'dispute_resolved',
              title: 'Dispute Won',
              message: `You have won the dispute for transaction #${dispute[0].transaction_id}`,
              data: {
                disputeId: disputeId.toNumber(),
                transactionId: dispute[0].transaction_id,
              }
            });
            await db.notificationDB.createNotification({
              walletAddress: loser.toLowerCase(),
              type: 'dispute_resolved',
              title: 'Dispute Lost',
              message: `You have lost the dispute for transaction #${dispute[0].transaction_id}`,
              data: {
                disputeId: disputeId.toNumber(),
                transactionId: dispute[0].transaction_id,
              }
            });

            this.io.to(`user_${winner.toLowerCase()}`).emit('disputeResolved', {
              disputeId: disputeId.toNumber(),
              winner: winner.toLowerCase(),
            });
            this.io.to(`user_${loser.toLowerCase()}`).emit('disputeResolved', {
              disputeId: disputeId.toNumber(),
              winner: winner.toLowerCase(),
            });
          }
        } catch (error) {
          console.error('Error handling DisputeResolved event:', error);
        }
      }
    );
    this.listeners.push(disputeResolvedListener);

    // ReviewSubmitted event
    const reviewSubmittedListener = this.contract.on(
      'ReviewSubmitted',
      async (
        reviewId,
        transactionId,
        reviewer,
        reviewee,
        rating,
        ipfsHash,
        event
      ) => {
        try {
          console.log(`⭐ Review submitted: ${rating} stars`);
          
          // Get block timestamp
          const block = await event.getBlock();
          const timestamp = block.timestamp;

          // Cache in database
          await db.query(
            `INSERT INTO reviews_cache 
          (review_id, transaction_id, reviewer_wallet, reviewee_wallet, rating, ipfs_hash, blockchain_timestamp) 
          VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))
          ON DUPLICATE KEY UPDATE rating = ?, ipfs_hash = ?, last_synced = NOW()`,
            [
              reviewId.toNumber(),
              transactionId.toNumber(),
              reviewer.toLowerCase(),
              reviewee.toLowerCase(),
              rating,
              ipfsHash,
              timestamp,
              rating,
              ipfsHash,
            ]
          );
          
          // Update last synced block
          await db.systemDB.updateSetting('last_synced_block', event.blockNumber.toString());

          // Notify reviewee
          await db.notificationDB.createNotification({
            walletAddress: reviewee.toLowerCase(),
            type: 'new_review',
            title: 'New Review',
            message: `You received a ${rating}-star review`,
            data: { transactionId: transactionId.toNumber(), rating }
          });

          this.io.to(`user_${reviewee.toLowerCase()}`).emit('newReview', {
            rating,
            transactionId: transactionId.toNumber(),
          });
        } catch (error) {
          console.error('Error handling ReviewSubmitted event:', error);
        }
      }
    );
    this.listeners.push(reviewSubmittedListener);

    console.log('✅ Event listeners set up');
  }

  async syncHistoricalData() {
    try {
      console.log('🔄 Syncing historical blockchain data...');

      // Get current block
      const currentBlock = await this.provider.getBlockNumber();
      
      // Get last synced block from DB
      const lastSyncedBlockStr = await db.systemDB.getSetting('last_synced_block');
      let startBlock = 0;
      
      if (lastSyncedBlockStr) {
        startBlock = parseInt(lastSyncedBlockStr) + 1;
        console.log(`   Resuming sync from block ${startBlock} (Last synced: ${lastSyncedBlockStr})`);
      } else {
        startBlock = Math.max(0, currentBlock - 10000); // Default to last 10k blocks if never synced
        console.log(`   No sync history found. Starting from block ${startBlock} (Current: ${currentBlock})`);
      }

      if (startBlock > currentBlock) {
        console.log('   ✅ Already up to date');
        return;
      }

      console.log(`   Scanning blocks ${startBlock} to ${currentBlock}...`);

      // Fetch historical events
      const listingFilter = this.contract.filters.ListingCreated();
      const listings = await this.contract.queryFilter(
        listingFilter,
        startBlock,
        currentBlock
      );

      console.log(`   Found ${listings.length} historical listings`);

      for (const event of listings) {
        try {
          const { listingId, owner, category, price, deposit, ipfsHash, isForRent } = event.args;

          // Check if already cached
          const existing = await db.listingDB.getListingById(
            listingId.toNumber()
          );
          if (!existing) {
            let metadata = {};
            try {
              metadata = await ipfsService.fetchFromIPFS(ipfsHash);
            } catch (error) {
              // Skip if IPFS fetch fails
            }

            await db.listingDB.cacheBlisting({
              listingId: listingId.toNumber(),
              ownerWallet: owner.toLowerCase(),
              isForRent: isForRent,
              priceWei: price.toString(),
              depositWei: deposit.toString(),
              ipfsHash: ipfsHash,
              title: metadata?.data?.title || 'Untitled',
              description: metadata?.data?.description || '',
              category: category || metadata?.data?.category || 'General',
              location: metadata?.data?.location || 'Global',
              tags: metadata?.data?.tags || [],
              images: metadata?.data?.images || [],
              isActive: true,
              views: 0,
              favorites: 0,
              createdAt: Math.floor(Date.now() / 1000), // Approximate
              updatedAt: Math.floor(Date.now() / 1000),
            });
          }
        } catch (error) {
          console.error('Error syncing listing:', error);
        }
      }
      
      // Update last synced block
      await db.systemDB.updateSetting('last_synced_block', currentBlock.toString());

      console.log('✅ Historical data sync completed');
    } catch (error) {
      console.error('Error syncing historical data:', error);
    }
  }

  stop() {
    if (this.isRunning) {
      console.log('🛑 Stopping blockchain sync service...');

      // Remove all listeners
      if (this.contract) {
        this.contract.removeAllListeners();
      }

      this.isRunning = false;
      console.log('✅ Blockchain sync service stopped');
    }
  }
}

// Export singleton instance
module.exports = new BlockchainSyncService();
