import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Box,
  Divider,
  Image,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  Center,
  Tag,
  TagLabel,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import React, { useState, useEffect } from 'react';
import { FaImage } from 'react-icons/fa';
import { FiShoppingCart, FiClock } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { fetchFromIPFS } from '../utils/ipfsSimulation';

/**
 * ViewDetailsModal Component
 *
 * Displays detailed information about a listing including:
 * - Full listing details from smart contract
 * - IPFS metadata (title, description, images)
 * - Owner information and ratings
 * - Transaction status and interaction options
 * - Purchase/rental functionality
 */
const ViewDetailsModal = ({
  isOpen,
  onClose,
  listingId,
  listing: backendListing,
  onTransactionSuccess,
}) => {
  const { contract, account, isConnected, withRetry } = useWeb3();
  const { apiRequest } = useAuth();
  const [listing, setListing] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const toast = useToast();

  const safeFormatEther = (val) => {
    if (val === null || val === undefined) return '0';
    try {
      // Handle BigNumber objects properly
      if (ethers.BigNumber.isBigNumber(val)) {
        return ethers.utils.formatEther(val);
      }
      // Handle string values
      const asString = typeof val === 'string' ? val : val.toString();
      // If it's already a formatted string (contains decimal), return as is
      if (asString.includes('.')) {
        return asString;
      }
      // Otherwise, treat as wei and format
      return ethers.utils.formatEther(asString);
    } catch (err) {
      return '0';
    }
  };

  // All useColorModeValue hooks must be at the top level
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const modalBg = useColorModeValue('white', 'gray.800');
  const titleColor = useColorModeValue('gray.800', 'white');
  const descBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const descColor = useColorModeValue('gray.600', 'gray.300');
  const priceBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const priceBorder = useColorModeValue('blue.200', 'blue.500');
  const priceLabelColor = useColorModeValue('gray.700', 'gray.200');
  const totalBg = useColorModeValue(
    'linear(to-r, green.50, blue.50)',
    'linear(to-r, green.900, blue.900)'
  );
  const errorColor = useColorModeValue('gray.600', 'gray.400');
  const footerBorder = useColorModeValue('gray.200', 'gray.600');

  // Additional hooks for inline usage
  const priceBoxBg = useColorModeValue(
    'linear(to-br, blue.50, purple.50)',
    'linear(to-br, blue.900, purple.900)'
  );
  const priceBoxBorder = useColorModeValue('blue.200', 'blue.600');
  const decorativeBg = useColorModeValue('blue.100', 'blue.800');
  const priceTextColor = useColorModeValue('gray.600', 'gray.400');
  const dividerColor = useColorModeValue('gray.300', 'gray.600');
  const depositBg = useColorModeValue('orange.50', 'orange.900');
  const totalBoxBg = useColorModeValue(
    'linear(to-r, green.100, emerald.100)',
    'linear(to-r, green.800, emerald.800)'
  );
  const totalBoxBorder = useColorModeValue('green.300', 'green.600');
  const totalLabelColor = useColorModeValue('green.700', 'green.300');
  const totalSubColor = useColorModeValue('green.600', 'green.400');
  const totalAmountColor = useColorModeValue('green.600', 'green.300');
  const footerBg = useColorModeValue('gray.50', 'gray.900');

  // Debug logging
  useEffect(() => {}, [isOpen, listingId, backendListing]);

  /**
   * Fetch listing details - Use backend data first, then try contract
   */
  const fetchListingDetails = async () => {
    if (!listingId) {
      toast({
        title: 'Error',
        description: 'No listing ID provided',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    // If we have backend listing data, use it directly
    if (backendListing) {
      try {
        // Parse images and tags if they're JSON strings
        let parsedImages = [];
        let parsedTags = [];

        if (backendListing.images) {
          parsedImages =
            typeof backendListing.images === 'string'
              ? JSON.parse(backendListing.images)
              : backendListing.images;
        }

        if (backendListing.tags) {
          parsedTags =
            typeof backendListing.tags === 'string'
              ? JSON.parse(backendListing.tags)
              : backendListing.tags;
        }

        // Convert price_wei from string to BigNumber (backend stores as string)
        let priceWei;
        if (backendListing.price_wei) {
          priceWei = ethers.BigNumber.from(backendListing.price_wei);
        } else if (backendListing.price) {
          // If price is already in MATIC (formatted), convert to wei
          priceWei = ethers.utils.parseEther(backendListing.price.toString());
        } else {
          priceWei = ethers.BigNumber.from('0');
        }

        // Convert deposit_wei from string to BigNumber
        let depositWei;
        if (backendListing.deposit_wei) {
          depositWei = ethers.BigNumber.from(backendListing.deposit_wei);
        } else if (backendListing.deposit) {
          depositWei = ethers.utils.parseEther(
            backendListing.deposit.toString()
          );
        } else {
          depositWei = ethers.BigNumber.from('0');
        }

        const listingData = {
          id: listingId,
          owner: backendListing.owner_wallet || backendListing.owner || '',
          isForRent:
            backendListing.is_for_rent !== undefined
              ? backendListing.is_for_rent
              : backendListing.isForRent || false,
          priceWei: priceWei,
          depositWei: depositWei,
          ipfsHash: backendListing.ipfs_hash || backendListing.ipfsHash || '',
          isActive:
            backendListing.is_active !== undefined
              ? backendListing.is_active
              : backendListing.isActive !== undefined
                ? backendListing.isActive
                : true,
          createdAt: backendListing.blockchain_created_at
            ? Math.floor(
                new Date(backendListing.blockchain_created_at).getTime() / 1000
              )
            : Math.floor(Date.now() / 1000),
          updatedAt: backendListing.blockchain_updated_at
            ? Math.floor(
                new Date(backendListing.blockchain_updated_at).getTime() / 1000
              )
            : Math.floor(Date.now() / 1000),
        };

        setListing(listingData);

        // Create metadata from backend data
        const metadataFromBackend = {
          title: backendListing.title || `Item #${listingId}`,
          description: backendListing.description || 'No description available',
          images: parsedImages,
          category: backendListing.category || 'General',
          location: backendListing.location || 'Not specified',
          tags: parsedTags,
        };

        setMetadata(metadataFromBackend);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error using backend data:', error);
        toast({
          title: 'Error',
          description: `Failed to parse listing data: ${error.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }

    // Fallback: Try to fetch from contract
    try {
      if (!contract) {
        throw new Error('Smart contract not available');
      }

      const listingData = await withRetry(() => contract.getListing(listingId));

      // Check if listing exists (id > 0)
      if (listingData.id.toNumber() === 0) {
        throw new Error('Listing not found');
      }

      const formattedListing = {
        id: listingData.id.toNumber(),
        owner: listingData.owner,
        isForRent: listingData.isForRent,
        priceWei: listingData.price, // BigNumber
        depositWei: listingData.deposit, // BigNumber
        ipfsHash: listingData.ipfsHash,
        isActive: listingData.isActive,
        createdAt: listingData.createdAt.toNumber(),
        updatedAt: listingData.updatedAt.toNumber(),
      };

      setListing(formattedListing);

      // Fetch IPFS metadata if hash exists
      if (listingData.ipfsHash && listingData.ipfsHash !== '') {
        setMetadataLoading(true);
        try {
          const ipfsMetadata = await fetchFromIPFS(listingData.ipfsHash);
          setMetadata(ipfsMetadata);
        } catch (error) {
          // IPFS metadata fetch failed
        } finally {
          setMetadataLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching from contract:', error);
      toast({
        title: 'Error',
        description:
          'Failed to load listing from blockchain. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  /**
   * Handle purchase/rental transaction
   */
  const handleTransaction = async () => {
    if (!contract || !listing || !isConnected) return;

    setIsTransacting(true);
    try {
      // Re-fetch listing to ensure it's still active
      const currentListing = await withRetry(() =>
        contract.getListing(listing.id)
      );
      if (!currentListing.isActive) {
        toast({
          title: 'Transaction Failed',
          description: 'This listing is no longer active.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsTransacting(false);
        onClose(); // Close the modal
        return;
      }

      // Ensure we have proper BigNumber values
      let priceWei, depositWei;

      if (listing.priceWei) {
        priceWei = ethers.BigNumber.isBigNumber(listing.priceWei)
          ? listing.priceWei
          : ethers.utils.parseEther(listing.priceWei.toString());
      } else {
        priceWei = ethers.BigNumber.from(0);
      }

      if (listing.isForRent && listing.depositWei) {
        depositWei = ethers.BigNumber.isBigNumber(listing.depositWei)
          ? listing.depositWei
          : ethers.utils.parseEther(listing.depositWei.toString());
      } else {
        depositWei = ethers.BigNumber.from(0);
      }

      const totalWei = priceWei.add(depositWei);

      const tx = await withRetry(() =>
        contract.createTransaction(listing.id, { value: totalWei })
      );

      toast({
        title: 'Transaction Sent',
        description: 'Processing transaction... Please wait for confirmation.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      const receipt = await tx.wait();

      // Find the TransactionStarted event to get the transaction ID
      const event = receipt.events?.find(
        (e) => e.event === 'TransactionStarted'
      );
      const transactionId = event?.args?.transactionId;

      if (!transactionId) {
        throw new Error('Transaction ID not found in receipt events');
      }

      // Cache transaction in backend
      try {
        const transactionPayload = {
          blockchainId: transactionId.toNumber(),
          listingId: listing.id,
          buyer: account,
          seller: listing.owner,
          price: ethers.utils.formatEther(priceWei),
          deposit: listing.isForRent
            ? ethers.utils.formatEther(depositWei)
            : null,
          isForRent: listing.isForRent,
          transactionHash: receipt.transactionHash,
        };

        await apiRequest(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/transactions`,
          {
            method: 'POST',
            body: JSON.stringify(transactionPayload),
          }
        );
      } catch (backendError) {
        // Don't fail the transaction if backend caching fails
        console.error('Failed to cache transaction:', backendError);
      }

      toast({
        title: 'Success',
        description: 'Transaction completed successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onTransactionSuccess) {
        onTransactionSuccess(listing.id);
      }
    } catch (error) {
      let errorMessage = 'Failed to process transaction';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsTransacting(false);
    }
  };

  /**
   * Check if current user can interact with this listing
   */
  const canInteract = () => {
    if (!listing || !account) return false;
    return (
      listing.owner.toLowerCase() !== account.toLowerCase() && listing.isActive
    );
  };

  /**
   * Format timestamp to readable date
   */
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  /**
   * Format address for display
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Fetch listing details when modal opens
  useEffect(() => {
    if (isOpen && listingId) {
      fetchListingDetails();
    }
  }, [isOpen, listingId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent maxW="1000px" borderRadius="2xl" shadow="2xl" bg={modalBg}>
        <ModalHeader pb={4}>
          <HStack spacing={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                Listing Details
              </Text>
              {listing && (
                <Badge
                  colorScheme={listing.isForRent ? 'green' : 'blue'}
                  borderRadius="full"
                  px={4}
                  py={2}
                  fontSize="md"
                  fontWeight="semibold"
                >
                  {listing.isForRent ? 'For Rent' : 'For Sale'}
                </Badge>
              )}
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton
          size="lg"
          borderRadius="full"
          _hover={{ bg: 'red.50', color: 'red.500' }}
        />

        <ModalBody px={8} pb={6}>
          {loading ? (
            <Center py={16}>
              <VStack spacing={6}>
                <Spinner size="xl" color="blue.500" thickness="4px" />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                    Loading listing details...
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Fetching data from blockchain and IPFS
                  </Text>
                </VStack>
              </VStack>
            </Center>
          ) : listing ? (
            <VStack spacing={8} align="stretch">
              {/* Images Section */}
              <Box>
                <Text fontWeight="bold" mb={4} fontSize="lg" color="gray.700">
                  Item Images
                </Text>
                <Grid
                  templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
                  gap={6}
                >
                  {/* Display images from metadata first */}
                  {metadata &&
                    metadata.images &&
                    metadata.images.length > 0 &&
                    metadata.images.map((image, index) => (
                      <GridItem key={`metadata-${index}`}>
                        <Box
                          borderRadius="xl"
                          overflow="hidden"
                          shadow="lg"
                          _hover={{
                            transform: 'scale(1.02)',
                            transition: 'transform 0.2s',
                          }}
                        >
                          <Image
                            src={image}
                            alt={`Listing image ${index + 1}`}
                            boxSize="250px"
                            objectFit="cover"
                            w="full"
                            h="250px"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                            onLoad={() => {}}
                          />
                        </Box>
                      </GridItem>
                    ))}

                  {/* Display image from backend if no metadata images */}
                  {(!metadata ||
                    !metadata.images ||
                    metadata.images.length === 0) &&
                    backendListing &&
                    backendListing.image && (
                      <GridItem key="backend-image">
                        <Box
                          borderRadius="xl"
                          overflow="hidden"
                          shadow="lg"
                          _hover={{
                            transform: 'scale(1.02)',
                            transition: 'transform 0.2s',
                          }}
                        >
                          <Image
                            src={backendListing.image}
                            alt={backendListing.title || 'Item Image'}
                            boxSize="250px"
                            objectFit="cover"
                            w="full"
                            h="250px"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                            onLoad={() => {}}
                          />
                        </Box>
                      </GridItem>
                    )}

                  {/* Show placeholder if no images available */}
                  {(!metadata ||
                    !metadata.images ||
                    metadata.images.length === 0) &&
                    (!backendListing || !backendListing.image) && (
                      <GridItem key="no-image">
                        <Box
                          borderRadius="xl"
                          overflow="hidden"
                          shadow="lg"
                          bg="gray.100"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          h="250px"
                        >
                          <VStack spacing={2}>
                            <Icon as={FaImage} boxSize={12} color="gray.400" />
                            <Text color="gray.500" fontSize="sm">
                              No image available
                            </Text>
                          </VStack>
                        </Box>
                      </GridItem>
                    )}
                </Grid>
              </Box>

              {/* Title and Description */}
              <Box p={6} bg={descBg} borderRadius="xl">
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  mb={3}
                  color={titleColor}
                >
                  {backendListing?.title ||
                    metadata?.title ||
                    `Item #${listing.id}`}
                </Text>
                <Text color={descColor} fontSize="md" lineHeight="tall">
                  {backendListing?.description ||
                    metadata?.description ||
                    'No description available'}
                </Text>
              </Box>

              {/* Pricing Information - Enhanced */}
              <Box
                p={8}
                bgGradient={priceBoxBg}
                borderRadius="2xl"
                border="3px solid"
                borderColor={priceBoxBorder}
                boxShadow="2xl"
                position="relative"
                overflow="hidden"
              >
                {/* Decorative background */}
                <Box
                  position="absolute"
                  top="-50%"
                  right="-10%"
                  width="200px"
                  height="200px"
                  borderRadius="full"
                  bg={decorativeBg}
                  opacity={0.3}
                  filter="blur(40px)"
                />

                <VStack spacing={5} align="stretch" position="relative">
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color={priceTextColor}
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        {listing.isForRent
                          ? '💰 Rental Price'
                          : '💵 Sale Price'}
                      </Text>
                      <Text
                        fontSize="4xl"
                        fontWeight="black"
                        bgGradient="linear(to-r, blue.400, purple.500)"
                        bgClip="text"
                      >
                        {parseFloat(safeFormatEther(listing?.priceWei)).toFixed(
                          4
                        )}{' '}
                        MATIC
                      </Text>
                    </VStack>
                  </HStack>

                  {listing?.isForRent &&
                    listing?.depositWei &&
                    listing.depositWei.gt(0) && (
                      <>
                        <Divider borderColor={dividerColor} />
                        <HStack
                          justify="space-between"
                          p={3}
                          bg={depositBg}
                          borderRadius="lg"
                        >
                          <Text fontWeight="semibold" fontSize="md">
                            🔒 Security Deposit
                          </Text>
                          <Text
                            fontSize="xl"
                            fontWeight="bold"
                            color="orange.500"
                          >
                            {parseFloat(
                              safeFormatEther(listing?.depositWei)
                            ).toFixed(4)}{' '}
                            MATIC
                          </Text>
                        </HStack>
                      </>
                    )}

                  <Divider borderColor={dividerColor} borderWidth="2px" />

                  <Box
                    p={5}
                    bgGradient={totalBoxBg}
                    borderRadius="xl"
                    border="2px solid"
                    borderColor={totalBoxBorder}
                    boxShadow="lg"
                  >
                    <HStack justify="space-between" align="center">
                      <VStack align="start" spacing={0}>
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          color={totalLabelColor}
                          textTransform="uppercase"
                        >
                          ✅ Total Amount
                        </Text>
                        <Text fontSize="xs" color={totalSubColor}>
                          {listing?.isForRent
                            ? 'Price + Deposit'
                            : 'Final Price'}
                        </Text>
                      </VStack>
                      <Text
                        fontSize="3xl"
                        fontWeight="black"
                        color={totalAmountColor}
                      >
                        {listing?.isForRent
                          ? (
                              parseFloat(safeFormatEther(listing?.priceWei)) +
                              parseFloat(safeFormatEther(listing?.depositWei))
                            ).toFixed(4)
                          : parseFloat(
                              safeFormatEther(listing?.priceWei)
                            ).toFixed(4)}{' '}
                        MATIC
                      </Text>
                    </HStack>
                  </Box>
                </VStack>
              </Box>

              {/* Listing Information */}
              <Grid
                templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                gap={4}
              >
                <GridItem>
                  <Text fontWeight="bold" mb={1}>
                    Owner
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {formatAddress(listing.owner)}
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontWeight="bold" mb={1}>
                    Created
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {formatDate(listing.createdAt)}
                  </Text>
                </GridItem>

                <GridItem>
                  <Text fontWeight="bold" mb={1}>
                    Status
                  </Text>
                  <Tag colorScheme={listing.isActive ? 'green' : 'red'}>
                    <TagLabel>
                      {listing.isActive ? 'Active' : 'Inactive'}
                    </TagLabel>
                  </Tag>
                </GridItem>

                <GridItem>
                  <Text fontWeight="bold" mb={1}>
                    Type
                  </Text>
                  <Tag colorScheme={listing.isForRent ? 'green' : 'blue'}>
                    <TagLabel>{listing.isForRent ? 'Rental' : 'Sale'}</TagLabel>
                  </Tag>
                </GridItem>
              </Grid>

              {/* Tags */}
              {metadata && metadata.tags && metadata.tags.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Tags
                  </Text>
                  <HStack spacing={2} wrap="wrap">
                    {metadata.tags.map((tag, index) => (
                      <Tag key={index} size="sm" colorScheme="gray">
                        <TagLabel>{tag}</TagLabel>
                      </Tag>
                    ))}
                  </HStack>
                </Box>
              )}

              {/* IPFS Metadata Loading */}
              {metadataLoading && (
                <Center py={4}>
                  <VStack spacing={2}>
                    <Spinner size="sm" />
                    <Text fontSize="sm" color="gray.500">
                      Loading additional details...
                    </Text>
                  </VStack>
                </Center>
              )}
            </VStack>
          ) : (
            <Alert status="error" borderRadius="xl" p={6}>
              <AlertIcon boxSize={6} />
              <VStack align="start" spacing={2} ml={2}>
                <Text fontWeight="bold" fontSize="lg">
                  Failed to load listing details
                </Text>
                <Text fontSize="sm" color={errorColor}>
                  The listing may not exist or there was an error loading it.
                  Please try refreshing the page or contact support if the
                  problem persists.
                </Text>
              </VStack>
            </Alert>
          )}
        </ModalBody>

        <ModalFooter
          borderTop="2px"
          borderColor={footerBorder}
          pt={6}
          bg={footerBg}
        >
          <HStack spacing={3} w="full" justify="space-between">
            <Button variant="outline" onClick={onClose} size="lg" px={8}>
              Close
            </Button>
            {canInteract() && (
              <Button
                colorScheme={listing?.isForRent ? 'green' : 'blue'}
                onClick={handleTransaction}
                isLoading={isTransacting}
                loadingText="Processing Transaction..."
                size="lg"
                px={12}
                fontSize="lg"
                fontWeight="bold"
                leftIcon={
                  <Icon
                    as={listing?.isForRent ? FiClock : FiShoppingCart}
                    boxSize={5}
                  />
                }
                bgGradient={
                  listing?.isForRent
                    ? 'linear(to-r, green.400, green.600)'
                    : 'linear(to-r, blue.400, blue.600)'
                }
                _hover={{
                  bgGradient: listing?.isForRent
                    ? 'linear(to-r, green.500, green.700)'
                    : 'linear(to-r, blue.500, blue.700)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                }}
                _active={{
                  transform: 'translateY(0)',
                }}
                transition="all 0.2s"
                boxShadow="0 4px 15px rgba(0, 0, 0, 0.2)"
              >
                {listing?.isForRent
                  ? 'Rent This Item Now'
                  : 'Buy This Item Now'}
              </Button>
            )}
            {!canInteract() && listing && (
              <Text color="gray.500" fontSize="sm" fontStyle="italic">
                {listing.owner.toLowerCase() === account?.toLowerCase()
                  ? 'You own this listing'
                  : !account
                    ? 'Connect wallet to purchase'
                    : 'This listing is not available'}
              </Text>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ViewDetailsModal;
