/**
 * IPFS Simulation for Blockrent Frontend
 *
 * Provides mock IPFS functionality for development and testing.
 * In production, this would be replaced with actual IPFS integration.
 */

/**
 * Simulate uploading metadata to IPFS
 * @param {Object} metadata - Metadata object to upload
 * @returns {Promise<string>} - Simulated IPFS hash
 */
export const uploadToIPFS = async (metadata) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generate a mock IPFS hash based on content
  const content = JSON.stringify(metadata);
  const hash = btoa(content)
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 46);
  const ipfsHash = `Qm${hash}`;

  console.log('📤 Simulated IPFS upload:', {
    metadata,
    ipfsHash,
  });

  return ipfsHash;
};

/**
 * Simulate uploading a file to IPFS
 * @param {File} file - File to upload
 * @returns {Promise<string>} - Simulated IPFS URL
 */
export const uploadFileToIPFS = async (file) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // For demo purposes, we'll use placeholder images or convert to data URL
  // In a real app, this would upload to actual IPFS
  if (file.type.startsWith('image/')) {
    // Convert file to data URL for demo purposes
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // Fallback to placeholder
  return 'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Uploaded+Image';
};

/**
 * Simulate fetching metadata from IPFS
 * @param {string} ipfsHash - IPFS hash to fetch
 * @returns {Promise<Object>} - Metadata object
 */
export const fetchFromIPFS = async (ipfsHash) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In production, this would fetch from actual IPFS
  // For now, throw an error to indicate IPFS data is not available
  console.warn('⚠️ IPFS fetch not implemented - hash:', ipfsHash);

  throw new Error(
    'IPFS metadata not available. Please ensure listing data is stored in the database.'
  );
};

/**
 * Create listing metadata object
 * @param {Object} formData - Form data from create listing form
 * @returns {Object} - Formatted metadata object
 */
export const createListingMetadata = (formData) => {
  // Handle image - prioritize processed imageUrl, then file, then URL, then preview
  let images = [];
  if (formData.imageUrl) {
    // Use the processed image URL (from uploadFileToIPFS)
    images = [formData.imageUrl];
  } else if (formData.imageFile) {
    // Create a data URL from the file for simulation
    images = [URL.createObjectURL(formData.imageFile)];
  } else if (formData.imagePreview) {
    images = [formData.imagePreview];
  }

  return {
    title: formData.title,
    description: formData.description,
    images: images,
    category: formData.category || 'General',
    condition: 'Good',
    createdAt: Date.now(),
    tags: formData.isForRent ? ['rental'] : ['sale'],
    type: formData.isForRent ? 'rental' : 'sale',
    price: formData.price,
    deposit: formData.deposit || 0,
  };
};

/**
 * Validate metadata before upload
 * @param {Object} metadata - Metadata to validate
 * @returns {Object} - Validation result
 */
export const validateMetadata = (metadata) => {
  const errors = [];

  if (!metadata.title || metadata.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!metadata.description || metadata.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (metadata.title && metadata.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  if (metadata.description && metadata.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate mock IPFS hash for testing
 * @param {string} content - Content to hash
 * @returns {string} - Mock IPFS hash
 */
export const generateMockHash = (content) => {
  const hash = btoa(content)
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 46);
  return `Qm${hash}`;
};
