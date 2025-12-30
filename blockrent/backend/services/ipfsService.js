const fs = require('fs');

const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

/**
 * IPFS Service - FREE Implementation
 * Uses public IPFS nodes (no API keys required)
 *
 * Options:
 * 1. NFT.Storage (free, no credit card)
 * 2. Web3.Storage (free, no credit card)
 * 3. Local IPFS node (completely free)
 * 4. Public IPFS gateways for read
 */

const IPFS_MODE = process.env.IPFS_MODE || 'simulation'; // 'simulation', 'nft_storage', 'web3_storage', 'local'
const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY; // Optional: Get free from https://nft.storage
const WEB3_STORAGE_KEY = process.env.WEB3_STORAGE_KEY; // Optional: Get free from https://web3.storage
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY_URL =
  process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
const LOCAL_IPFS_API = process.env.LOCAL_IPFS_API || 'http://127.0.0.1:5001';
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs';

/**
 * Test IPFS connection
 */
async function testIPFSConnection() {
  try {
    if (IPFS_MODE === 'simulation') {
      console.log('✅ IPFS running in SIMULATION mode (no real uploads)');
      return true;
    }

    if (IPFS_MODE === 'nft_storage') {
      if (!NFT_STORAGE_KEY) {
        console.log(
          '⚠️  NFT.Storage key not found, running in simulation mode'
        );
        return false;
      }
      const response = await axios.get('https://api.nft.storage', {
        headers: { Authorization: `Bearer ${NFT_STORAGE_KEY}` },
      });
      console.log('✅ NFT.Storage IPFS connection successful (FREE)');
      return true;
    }

    if (IPFS_MODE === 'web3_storage') {
      if (!WEB3_STORAGE_KEY) {
        console.log(
          '⚠️  Web3.Storage key not found, running in simulation mode'
        );
        return false;
      }
      console.log('✅ Web3.Storage IPFS ready (FREE)');
      return true;
    }

    if (IPFS_MODE === 'local') {
      const response = await axios.post(`${LOCAL_IPFS_API}/api/v0/version`);
      console.log('✅ Local IPFS node connection successful (FREE)');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ IPFS connection failed:', error.message);
    console.log('💡 Falling back to SIMULATION mode');
    return false;
  }
}

/**
 * Pin JSON data to IPFS (FREE - No API keys required for simulation)
 */
async function pinJSONToIPFS(jsonData, metadata = {}) {
  try {
    // SIMULATION MODE - Store in memory (for development without IPFS)
    if (IPFS_MODE === 'simulation' || !IPFS_MODE) {
      const hash =
        'Qm' +
        Buffer.from(JSON.stringify(jsonData))
          .toString('base64')
          .substring(0, 44);
      const simulatedData = {
        hash,
        data: jsonData,
        timestamp: new Date().toISOString(),
      };

      // Store in memory or localStorage for simulation
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`ipfs_${hash}`, JSON.stringify(simulatedData));
      }

      return {
        success: true,
        ipfsHash: hash,
        pinSize: JSON.stringify(jsonData).length,
        timestamp: simulatedData.timestamp,
        url: `${IPFS_GATEWAY_URL}/${hash}`,
        mode: 'simulation',
      };
    }

    // NFT.Storage (FREE - No credit card required)
    if (IPFS_MODE === 'nft_storage' && NFT_STORAGE_KEY) {
      const response = await axios.post(
        'https://api.nft.storage/upload',
        JSON.stringify(jsonData),
        {
          headers: {
            Authorization: `Bearer ${NFT_STORAGE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        ipfsHash: response.data.value.cid,
        pinSize: JSON.stringify(jsonData).length,
        timestamp: new Date().toISOString(),
        url: `${IPFS_GATEWAY_URL}/${response.data.value.cid}`,
        mode: 'nft_storage',
      };
    }

    // Web3.Storage (FREE - No credit card required)
    if (IPFS_MODE === 'web3_storage' && WEB3_STORAGE_KEY) {
      const { Web3Storage, File } = require('web3.storage');
      const client = new Web3Storage({ token: WEB3_STORAGE_KEY });

      const buffer = Buffer.from(JSON.stringify(jsonData));
      const files = [new File([buffer], metadata.name || 'data.json')];
      const cid = await client.put(files);

      return {
        success: true,
        ipfsHash: cid,
        pinSize: buffer.length,
        timestamp: new Date().toISOString(),
        url: `${IPFS_GATEWAY_URL}/${cid}`,
        mode: 'web3_storage',
      };
    }

    // Local IPFS node (Completely FREE)
    if (IPFS_MODE === 'local') {
      const formData = new FormData();
      formData.append('file', Buffer.from(JSON.stringify(jsonData)), {
        filename: metadata.name || 'data.json',
      });

      const response = await axios.post(
        `${LOCAL_IPFS_API}/api/v0/add`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      return {
        success: true,
        ipfsHash: response.data.Hash,
        pinSize: response.data.Size,
        timestamp: new Date().toISOString(),
        url: `${IPFS_GATEWAY_URL}/${response.data.Hash}`,
        mode: 'local',
      };
    }

    throw new Error('No valid IPFS mode configured');
  } catch (error) {
    console.error('Error pinning JSON to IPFS:', error.message);
    // Fallback to simulation
    const hash =
      'Qm' +
      Buffer.from(JSON.stringify(jsonData)).toString('base64').substring(0, 44);
    return {
      success: true,
      ipfsHash: hash,
      pinSize: JSON.stringify(jsonData).length,
      timestamp: new Date().toISOString(),
      url: `${IPFS_GATEWAY_URL}/${hash}`,
      mode: 'simulation_fallback',
      error: error.message,
    };
  }
}

/**
 * Pin file to IPFS
 */
async function pinFileToIPFS(filePath, pinataMetadata = {}) {
  try {
    // SIMULATION MODE
    if (IPFS_MODE === 'simulation' || !IPFS_MODE) {
      const buffer = fs.readFileSync(filePath);
      const hash = 'Qm' + buffer.toString('base64').substring(0, 44);
      return {
        success: true,
        ipfsHash: hash,
        pinSize: buffer.length,
        timestamp: new Date().toISOString(),
        url: `${IPFS_GATEWAY_URL}/${hash}`,
        mode: 'simulation',
      };
    }

    const url = `${PINATA_API_URL}/pinning/pinFileToIPFS`;

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const metadata = JSON.stringify({
      name: pinataMetadata.name || 'blockrent-file',
      keyvalues: pinataMetadata.keyvalues || {},
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(url, formData, {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    });

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp,
      url: `${PINATA_GATEWAY_URL}/${response.data.IpfsHash}`,
    };
  } catch (error) {
    console.error('Error pinning file to IPFS:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Pin buffer/blob to IPFS
 */
async function pinBufferToIPFS(buffer, filename, pinataMetadata = {}) {
  try {
    const url = `${PINATA_API_URL}/pinning/pinFileToIPFS`;

    const formData = new FormData();
    formData.append('file', buffer, { filename });

    const metadata = JSON.stringify({
      name: pinataMetadata.name || filename,
      keyvalues: pinataMetadata.keyvalues || {},
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(url, formData, {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    });

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp,
      url: `${PINATA_GATEWAY_URL}/${response.data.IpfsHash}`,
    };
  } catch (error) {
    console.error('Error pinning buffer to IPFS:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fetch data from IPFS
 */
async function fetchFromIPFS(ipfsHash) {
  try {
    const url = `${PINATA_GATEWAY_URL}/${ipfsHash}`;
    const response = await axios.get(url, {
      timeout: 5000, // 5 seconds timeout
      maxContentLength: 5 * 1024 * 1024, // 5MB max size
      maxBodyLength: 5 * 1024 * 1024 // 5MB max size
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error fetching from IPFS:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Unpin content from IPFS
 */
async function unpinFromIPFS(ipfsHash) {
  try {
    const url = `${PINATA_API_URL}/pinning/unpin/${ipfsHash}`;
    await axios.delete(url, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    });

    return {
      success: true,
      message: 'Content unpinned successfully',
    };
  } catch (error) {
    console.error('Error unpinning from IPFS:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get pinned content list
 */
async function getPinnedList(filters = {}) {
  try {
    const url = `${PINATA_API_URL}/data/pinList`;
    const params = {
      status: filters.status || 'pinned',
      pageLimit: filters.limit || 10,
      pageOffset: filters.offset || 0,
    };

    if (filters.metadata) {
      params.metadata = JSON.stringify(filters.metadata);
    }

    const response = await axios.get(url, {
      params,
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    });

    return {
      success: true,
      count: response.data.count,
      rows: response.data.rows,
    };
  } catch (error) {
    console.error('Error getting pinned list:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update pin metadata
 */
async function updatePinMetadata(ipfsHash, name, keyvalues = {}) {
  try {
    const url = `${PINATA_API_URL}/pinning/hashMetadata`;

    const data = {
      ipfsPinHash: ipfsHash,
      name,
      keyvalues,
    };

    await axios.put(url, data, {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    });

    return {
      success: true,
      message: 'Metadata updated successfully',
    };
  } catch (error) {
    console.error('Error updating pin metadata:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Pin listing metadata
 */
async function pinListingMetadata(listingData) {
  const metadata = {
    title: listingData.title,
    description: listingData.description,
    category: listingData.category,
    location: listingData.location,
    tags: listingData.tags || [],
    images: listingData.images || [],
    specifications: listingData.specifications || {},
    condition: listingData.condition,
    owner: listingData.owner,
    createdAt: new Date().toISOString(),
  };

  return pinJSONToIPFS(metadata, {
    name: `listing-${Date.now()}`,
    keyvalues: {
      type: 'listing',
      category: listingData.category,
      owner: listingData.owner,
    },
  });
}

/**
 * Pin user profile metadata
 */
async function pinUserProfile(profileData) {
  const metadata = {
    displayName: profileData.displayName,
    bio: profileData.bio,
    avatar: profileData.avatar,
    socialLinks: profileData.socialLinks || {},
    preferences: profileData.preferences || {},
    updatedAt: new Date().toISOString(),
  };

  return pinJSONToIPFS(metadata, {
    name: `profile-${profileData.wallet}`,
    keyvalues: {
      type: 'profile',
      wallet: profileData.wallet,
    },
  });
}

/**
 * Pin review/rating metadata
 */
async function pinReviewMetadata(reviewData) {
  const metadata = {
    rating: reviewData.rating,
    reviewText: reviewData.reviewText,
    transactionId: reviewData.transactionId,
    reviewer: reviewData.reviewer,
    reviewee: reviewData.reviewee,
    timestamp: new Date().toISOString(),
  };

  return pinJSONToIPFS(metadata, {
    name: `review-${Date.now()}`,
    keyvalues: {
      type: 'review',
      transactionId: reviewData.transactionId,
      reviewer: reviewData.reviewer,
    },
  });
}

/**
 * Pin dispute evidence
 */
async function pinDisputeEvidence(disputeData) {
  const metadata = {
    reason: disputeData.reason,
    description: disputeData.description,
    evidence: disputeData.evidence || [],
    disputeId: disputeData.disputeId,
    initiator: disputeData.initiator,
    timestamp: new Date().toISOString(),
  };

  return pinJSONToIPFS(metadata, {
    name: `dispute-${disputeData.disputeId}`,
    keyvalues: {
      type: 'dispute',
      disputeId: disputeData.disputeId,
      initiator: disputeData.initiator,
    },
  });
}

/**
 * Get IPFS gateway URL
 */
function getGatewayUrl(ipfsHash) {
  return `${PINATA_GATEWAY_URL}/${ipfsHash}`;
}

/**
 * Validate IPFS hash
 */
function isValidIPFSHash(hash) {
  // CIDv0: Qm followed by 44 characters
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  // CIDv1: b followed by 58+ characters
  const cidv1Regex = /^b[a-z2-7]{58,}$/;

  return cidv0Regex.test(hash) || cidv1Regex.test(hash);
}

module.exports = {
  testIPFSConnection,
  pinJSONToIPFS,
  pinFileToIPFS,
  pinBufferToIPFS,
  fetchFromIPFS,
  unpinFromIPFS,
  getPinnedList,
  updatePinMetadata,
  pinListingMetadata,
  pinUserProfile,
  pinReviewMetadata,
  pinDisputeEvidence,
  getGatewayUrl,
  isValidIPFSHash,
};
