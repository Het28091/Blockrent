import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Grid,
  GridItem,
  Badge,
  Image,
  Icon,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Flex,
  useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import {
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiChevronDown,
  FiHeart,
  FiShoppingCart,
  FiClock,
  FiMapPin,
  FiTrendingUp,
} from 'react-icons/fi';

import DeleteListingModal from '../components/DeleteListingModal';
import GradientButton from '../components/GradientButton';
import ModernCard from '../components/ModernCard';
import ViewDetailsModal from '../components/ViewDetailsModal';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { useModernToast } from '../hooks/useModernToast';
import gradients from '../theme/gradients';

const MotionBox = motion(Box);

const categories = [
  'All',
  'Electronics',
  'Photography',
  'Computing',
  'Gaming',
  'Audio',
  'Drones',
  'Sports',
  'Fashion',
  'Home',
  'Books',
  'Other',
];
const sortOptions = [
  'Latest',
  'Price: Low to High',
  'Price: High to Low',
  'Most Popular',
];

const LoadingCard = () => {
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box
      bg={cardBg}
      backdropFilter="blur(10px)"
      borderRadius="2xl"
      overflow="hidden"
      border="1px solid"
      borderColor={useColorModeValue('gray.200', 'whiteAlpha.200')}
    >
      <Skeleton height="250px" />
      <Box p={6}>
        <SkeletonText mt={2} noOfLines={3} spacing={4} />
      </Box>
    </Box>
  );
};

const ListingCard = ({ listing, onView, onDelete, currentUserAddress }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if current user owns this listing
  const isOwner =
    currentUserAddress &&
    listing.owner &&
    currentUserAddress.toLowerCase() === listing.owner.toLowerCase();

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        bg={cardBg}
        backdropFilter="blur(10px)"
        borderRadius="2xl"
        overflow="hidden"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
        cursor="pointer"
        onClick={() => onView(listing)}
        position="relative"
        _hover={{
          borderColor: 'brand.500',
          boxShadow: '0 20px 40px rgba(0, 82, 204, 0.2)',
          transform: 'translateY(-4px)',
        }}
        transition="all 0.3s ease-in-out"
      >
        {/* Image */}
        <Box position="relative" overflow="hidden" h="250px">
          <Image
            src={
              listing.image ||
              'https://picsum.photos/seed/' + listing.id + '/800/600'
            }
            alt={listing.title}
            w="full"
            h="full"
            objectFit="cover"
            transition="transform 0.3s"
            _hover={{ transform: 'scale(1.1)' }}
          />

          {/* Badges */}
          <HStack position="absolute" top={4} left={4} spacing={2}>
            <Badge
              bg={listing.isForRent ? 'green.500' : 'blue.500'}
              color="white"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="700"
              boxShadow="md"
            >
              {listing.isForRent ? '💼 For Rent' : '🛒 For Sale'}
            </Badge>
            {listing.featured && (
              <Badge
                bgGradient="linear(135deg, brand.500, brand.purple.500)"
                color="white"
                px={3}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight="700"
                boxShadow="md"
              >
                ⭐ Featured
              </Badge>
            )}
          </HStack>

          {/* Favorite Button */}
          <IconButton
            aria-label="Add to favorites"
            icon={
              <Icon as={FiHeart} fill={isFavorite ? 'currentColor' : 'none'} />
            }
            position="absolute"
            top={4}
            right={4}
            size="sm"
            borderRadius="full"
            bg={isFavorite ? 'red.500' : 'whiteAlpha.900'}
            color={isFavorite ? 'white' : 'gray.800'}
            boxShadow="md"
            _hover={{
              bg: isFavorite ? 'red.600' : 'white',
              transform: 'scale(1.15)',
              boxShadow: 'lg',
            }}
            _active={{
              transform: 'scale(0.95)',
            }}
            transition="all 0.2s"
            onClick={(e) => {
              {
                e.stopPropagation();
                setIsFavorite(!isFavorite);
              }
            }}
          />
        </Box>

        {/* Content */}
        <Box p={6}>
          <VStack align="start" spacing={3}>
            <Heading size="md" fontWeight="700" noOfLines={2}>
              {listing.title}
            </Heading>

            <Text color={textColor} fontSize="sm" noOfLines={2}>
              {listing.description}
            </Text>

            {/* Meta Info */}
            <HStack
              spacing={4}
              fontSize="xs"
              color={textColor}
              fontWeight="500"
            >
              <HStack spacing={1}>
                <Icon as={FiMapPin} color="brand.500" />
                <Text>San Francisco</Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiClock} color="brand.500" />
                <Text>2 days ago</Text>
              </HStack>
            </HStack>

            {/* Price and Action */}
            <VStack spacing={3} w="full" pt={2}>
              <Flex justify="space-between" align="center" w="full">
                <Box>
                  <Text
                    fontSize="2xl"
                    fontWeight="900"
                    color={useColorModeValue('brand.600', 'brand.400')}
                  >
                    ${listing.price}
                  </Text>
                  {listing.isForRent && (
                    <Text fontSize="xs" color={textColor}>
                      per month
                    </Text>
                  )}
                </Box>
              </Flex>

              {/* Action Buttons */}
              <HStack spacing={2} w="full">
                <Button
                  flex={1}
                  size="md"
                  colorScheme={listing.isForRent ? 'green' : 'blue'}
                  leftIcon={
                    <Icon as={listing.isForRent ? FiClock : FiShoppingCart} />
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(listing);
                  }}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  {listing.isForRent ? 'Rent' : 'Buy'}
                </Button>
                <Button
                  flex={1}
                  size="md"
                  variant="outline"
                  colorScheme="blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(listing);
                  }}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  Details
                </Button>
                {isOwner && onDelete && (
                  <IconButton
                    aria-label="Delete listing"
                    icon={<Icon as={FaTrash} />}
                    size="md"
                    colorScheme="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(listing);
                    }}
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                    transition="all 0.2s"
                  />
                )}
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </Box>
    </MotionBox>
  );
};

const Marketplace = () => {
  const { isConnected, account } = useWeb3();
  const { isAuthenticated, user, apiRequest } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Latest');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedListing, setSelectedListing] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const toast = useModernToast();
  const headingGradient = useColorModeValue(
    'linear(135deg, #0052CC, #5C00CC)',
    'linear(135deg, brand.500, brand.purple.500)'
  );

  // Hook values extracted from JSX
  const bgRadial1 = useColorModeValue(0.1, 0.15);
  const bgRadial2 = useColorModeValue(0.08, 0.12);
  const subTextColor = useColorModeValue('gray.600', 'gray.300');
  const filterBg = useColorModeValue('white', 'gray.800');
  const filterBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const filterHoverBorder = useColorModeValue('brand.300', 'brand.500');
  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const inputHoverBg = useColorModeValue('gray.100', 'whiteAlpha.150');
  const inputHoverBorder = useColorModeValue('gray.300', 'whiteAlpha.300');
  const inputFocusBg = useColorModeValue('white', 'whiteAlpha.200');
  const resultsColor = useColorModeValue('gray.600', 'gray.400');
  const noResultsColor = useColorModeValue('gray.600', 'gray.400');

  // New variables for fixing hook errors
  const menuListBg = useColorModeValue('white', 'gray.800');
  const menuListBorderColor = useColorModeValue('purple.200', 'purple.700');
  const menuItemActiveBg = useColorModeValue('purple.50', 'purple.900');
  const menuItemHoverBg = useColorModeValue('purple.100', 'purple.800');
  const menuItemColor = useColorModeValue('gray.800', 'gray.100');
  const menuButtonBorderColor = useColorModeValue('purple.200', 'purple.700');
  const menuButtonColor = useColorModeValue('gray.800', 'gray.100');
  const menuButtonHoverBg = useColorModeValue('purple.50', 'whiteAlpha.100');
  const menuButtonActiveBg = useColorModeValue('purple.100', 'whiteAlpha.200');
  const emptyStateColor = useColorModeValue('gray.600', 'gray.400');
  const emptyStateBorderColor = useColorModeValue('purple.200', 'purple.700');
  const cardBorderColor = useColorModeValue('gray.200', 'whiteAlpha.200');

  const fetchListings = async () => {
    const isManualRefresh = !loading;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Build query string with category filter
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }

      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/listings${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url);
      const data = await response.json();

      // Check if response has error
      if (!response.ok || data.error) {
        console.error('API Error:', data.error || data.message);
        throw new Error(data.message || 'Failed to fetch listings');
      }

      // Handle empty listings
      if (!data.listings || !Array.isArray(data.listings)) {
        console.warn('No listings array in response:', data);
        setListings([]);
        return;
      }

      // Transform data to match component structure if needed
      const formattedListings = data.listings
        .filter((item) => item.is_active !== false) // Only show active listings
        .map((item) => ({
          id: item.listing_id,
          title: item.title,
          description: item.description,
          price: parseFloat(item.price_wei) / 1e18, // Convert Wei to Eth/Matic
          isForRent: Boolean(item.is_for_rent),
          isActive: Boolean(item.is_active),
          category: item.category || 'General',
          image:
            item.images && item.images.length > 0
              ? item.images[0]
              : 'https://placehold.co/400',
          featured: false, // Add logic if needed
          owner: item.owner_wallet,
        }));

      setListings(formattedListings);

      if (isManualRefresh) {
        toast({
          title: 'Refreshed',
          description: `Found ${formattedListings.length} listings`,
          status: 'success',
        });
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load listings',
        status: 'error',
      });
      setListings([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchListings, 30000);
    return () => clearInterval(interval);
  }, [selectedCategory]); // Re-fetch when category changes

  const handleViewDetails = (listing) => {
    setSelectedListing(listing);
    setIsDetailsOpen(true);
  };

  const handleDeleteClick = (listing) => {
    setSelectedListing(listing);
    setIsDeleteOpen(true);
  };

  const handleDeleteListing = async (listingId) => {
    try {
      const response = await apiRequest(
        `http://localhost:5000/api/listings/${listingId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete listing');
      }

      // Remove the listing from local state immediately for instant UI update
      setListings((prevListings) =>
        prevListings.filter((listing) => listing.id !== listingId)
      );

      toast({
        title: 'Deleted',
        description: 'Listing removed successfully',
        status: 'success',
      });

      setIsDeleteOpen(false);

      // Refresh from server to ensure consistency
      setTimeout(() => fetchListings(), 600);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete listing',
        status: 'error',
      });
    }
  };

  const handleTransactionSuccess = (listingId) => {
    // Refresh listings after successful purchase
    fetchListings();
    setIsDetailsOpen(false);
    toast({
      title: 'Purchase Complete',
      description: 'Transaction successful',
      status: 'success',
    });
  };

  const filteredListings = listings
    .filter((listing) => {
      const matchesSearch =
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || listing.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Price: Low to High':
          return a.price - b.price;
        case 'Price: High to Low':
          return b.price - a.price;
        case 'Most Popular':
          return (b.views || 0) - (a.views || 0);
        case 'Latest':
        default:
          return b.id - a.id; // Assuming higher ID = newer
      }
    });

  return (
    <Box
      minH="100vh"
      pt={20}
      bgGradient={useColorModeValue(
        gradients.subtle.blue,
        gradients.dark.background
      )}
      position="relative"
      overflow="hidden"
    >
      {/* Animated Background Elements */}
      <MotionBox
        position="absolute"
        top="-20%"
        right="-10%"
        width="600px"
        height="600px"
        borderRadius="full"
        bgGradient="radial(brand.500, transparent)"
        filter="blur(100px)"
        opacity={bgRadial1}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <MotionBox
        position="absolute"
        bottom="-20%"
        left="-10%"
        width="600px"
        height="600px"
        borderRadius="full"
        bgGradient="radial(brand.purple.500, transparent)"
        filter="blur(100px)"
        opacity={bgRadial2}
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [90, 0, 90],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <Container maxW="7xl" py={12} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={3} align="start">
              <HStack spacing={3}>
                <Box
                  p={3}
                  borderRadius="xl"
                  bgGradient={gradients.cosmic}
                  boxShadow="0 8px 24px rgba(0, 102, 255, 0.3)"
                >
                  <Icon as={FiTrendingUp} boxSize={8} color="white" />
                </Box>
                <Heading
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="900"
                  color={useColorModeValue('gray.800', 'gray.50')}
                >
                  Marketplace
                </Heading>
              </HStack>
              <Text fontSize="xl" color={subTextColor} fontWeight="500">
                Discover and trade assets on the blockchain
              </Text>
            </VStack>
          </MotionBox>

          {/* Filters and Search */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            position="relative"
            zIndex={10}
          >
            <Box
              bg={useColorModeValue(
                'rgba(255, 255, 255, 0.9)',
                'rgba(45, 55, 72, 0.95)'
              )}
              backdropFilter="blur(20px) saturate(180%)"
              WebkitBackdropFilter="blur(20px) saturate(180%)"
              borderRadius="2xl"
              border="1px solid"
              borderColor={useColorModeValue(
                'rgba(255, 255, 255, 0.5)',
                'rgba(255, 255, 255, 0.15)'
              )}
              boxShadow={useColorModeValue(
                '0 8px 32px rgba(31, 38, 135, 0.15)',
                '0 8px 32px rgba(0, 0, 0, 0.5)'
              )}
              p={6}
              position="relative"
            >
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={4}
                align={{ base: 'stretch', md: 'center' }}
              >
                {/* Search */}
                <InputGroup flex={1}>
                  <InputLeftElement pointerEvents="none" h="full">
                    <Icon as={FiSearch} color="purple.500" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg={inputBg}
                    borderWidth="2px"
                    borderColor={useColorModeValue('purple.200', 'purple.700')}
                    fontSize="md"
                    fontWeight="500"
                    size="lg"
                    borderRadius="xl"
                    _hover={{
                      bg: inputHoverBg,
                      borderColor: 'purple.400',
                      boxShadow: '0 0 0 3px rgba(112, 0, 255, 0.1)',
                    }}
                    _focus={{
                      bg: inputFocusBg,
                      borderColor: 'purple.500',
                      boxShadow: '0 0 0 4px rgba(112, 0, 255, 0.2)',
                    }}
                    transition="all 0.3s ease-in-out"
                  />
                </InputGroup>

                {/* Category Filter */}
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<Icon as={FiChevronDown} />}
                    leftIcon={<Icon as={FiFilter} />}
                    minW={{ base: 'full', md: '200px' }}
                    size="lg"
                    borderRadius="xl"
                    bg={inputBg}
                    borderWidth="2px"
                    borderColor={useColorModeValue('purple.200', 'purple.700')}
                    fontWeight="600"
                    color={useColorModeValue('gray.800', 'gray.100')}
                    _hover={{
                      borderColor: 'purple.400',
                      bg: useColorModeValue('purple.50', 'whiteAlpha.100'),
                      boxShadow: '0 0 0 3px rgba(112, 0, 255, 0.1)',
                    }}
                    _active={{
                      borderColor: 'purple.500',
                      bg: useColorModeValue('purple.100', 'whiteAlpha.200'),
                    }}
                  >
                    {selectedCategory}
                  </MenuButton>
                  <MenuList
                    bg={useColorModeValue('white', 'gray.800')}
                    borderColor={useColorModeValue('purple.200', 'purple.700')}
                    borderWidth="2px"
                    boxShadow="2xl"
                    zIndex={1500}
                    maxH="400px"
                    overflowY="auto"
                  >
                    {categories.map((category) => (
                      <MenuItem
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        bg={
                          selectedCategory === category
                            ? menuItemActiveBg
                            : 'transparent'
                        }
                        _hover={{
                          bg: menuItemHoverBg,
                        }}
                        fontWeight={
                          selectedCategory === category ? '600' : '400'
                        }
                        color={menuItemColor}
                      >
                        {category}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>

                {/* Sort */}
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<Icon as={FiChevronDown} />}
                    minW={{ base: 'full', md: '200px' }}
                    size="lg"
                    borderRadius="xl"
                    bg={inputBg}
                    borderWidth="2px"
                    borderColor={menuButtonBorderColor}
                    fontWeight="600"
                    color={menuButtonColor}
                    _hover={{
                      borderColor: 'purple.400',
                      bg: menuButtonHoverBg,
                      boxShadow: '0 0 0 3px rgba(112, 0, 255, 0.1)',
                    }}
                    _active={{
                      borderColor: 'purple.500',
                      bg: menuButtonActiveBg,
                    }}
                  >
                    {sortBy}
                  </MenuButton>
                  <MenuList
                    bg={menuListBg}
                    borderColor={menuListBorderColor}
                    borderWidth="2px"
                    boxShadow="2xl"
                    zIndex={1500}
                    maxH="400px"
                    overflowY="auto"
                  >
                    {sortOptions.map((option) => (
                      <MenuItem
                        key={option}
                        onClick={() => setSortBy(option)}
                        bg={
                          sortBy === option ? menuItemActiveBg : 'transparent'
                        }
                        _hover={{
                          bg: menuItemHoverBg,
                        }}
                        fontWeight={sortBy === option ? '600' : '400'}
                        color={menuItemColor}
                      >
                        {option}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>

                {/* View Toggle */}
                <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                  <IconButton
                    icon={<Icon as={FiGrid} />}
                    aria-label="Grid View"
                    variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                    colorScheme={viewMode === 'grid' ? 'purple' : 'gray'}
                    color={viewMode === 'grid' ? 'white' : emptyStateColor}
                    borderColor={
                      viewMode === 'grid' ? 'purple.400' : emptyStateBorderColor
                    }
                    onClick={() => setViewMode('grid')}
                    borderRadius="xl"
                    size="lg"
                  />
                  <IconButton
                    icon={<Icon as={FiList} />}
                    aria-label="List View"
                    variant={viewMode === 'list' ? 'solid' : 'ghost'}
                    colorScheme={viewMode === 'list' ? 'purple' : 'gray'}
                    color={viewMode === 'list' ? 'white' : emptyStateColor}
                    borderColor={
                      viewMode === 'list' ? 'purple.400' : emptyStateBorderColor
                    }
                    onClick={() => setViewMode('list')}
                    borderRadius="xl"
                    size="lg"
                  />
                </HStack>
              </Flex>
            </Box>
          </MotionBox>

          {/* Results Count */}
          <Flex justify="space-between" align="center">
            <Text color={resultsColor}>
              Showing {filteredListings.length} results
            </Text>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchListings}
              isLoading={refreshing}
              leftIcon={<Icon as={FiSearch} />}
            >
              Refresh
            </Button>
          </Flex>

          {/* Listings Grid */}
          {loading ? (
            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              }}
              gap={8}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <LoadingCard key={i} />
              ))}
            </Grid>
          ) : filteredListings.length > 0 ? (
            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              }}
              gap={8}
            >
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onView={handleViewDetails}
                  onDelete={handleDeleteClick}
                  currentUserAddress={user?.walletAddress || account}
                />
              ))}
            </Grid>
          ) : (
            <Box textAlign="center" py={20}>
              <VStack spacing={6}>
                <Box fontSize="6xl" opacity={0.5} filter="grayscale(1)">
                  🔍
                </Box>
                <VStack spacing={2}>
                  <Heading size="lg" mb={2}>
                    No listings found
                  </Heading>
                  <Text fontSize="lg" color={emptyStateColor} mb={6}>
                    Don&apos;t see what you&apos;re looking for? Try adjusting
                    your search or category.
                  </Text>
                </VStack>
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear Filters
                </Button>
              </VStack>
            </Box>
          )}
        </VStack>
      </Container>

      {/* View Details Modal */}
      <ViewDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        listingId={selectedListing?.id}
        listing={selectedListing}
        onTransactionSuccess={handleTransactionSuccess}
      />

      {/* Delete Listing Modal */}
      <DeleteListingModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        listing={selectedListing}
        onDeleteSuccess={handleDeleteListing}
      />
    </Box>
  );
};

export default Marketplace;
