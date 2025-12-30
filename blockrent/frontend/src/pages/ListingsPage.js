import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  Grid,
  GridItem,
  Badge,
  Icon,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  Center,
  SimpleGrid,
  AspectRatio,
  Image,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaShoppingBag,
  FaArrowLeft,
  FaEye,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaWallet,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaPlus,
  FaToggleOn,
  FaToggleOff,
} from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

import DeleteListingModal from '../components/DeleteListingModal';
import EditListingModal from '../components/EditListingModal';
import ViewDetailsModal from '../components/ViewDetailsModal';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import useRealtimeSync from '../hooks/useRealtimeSync';

const ListingsPage = () => {
  const { user, apiRequest } = useAuth();
  const { account } = useWeb3();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [selectedListing, setSelectedListing] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const purpleBg = useColorModeValue('purple.50', 'purple.900');
  const purpleBorder = useColorModeValue('purple.200', 'purple.700');
  const priceBoxBg = useColorModeValue('purple.100', 'purple.800');
  const priceBoxBorder = useColorModeValue('purple.200', 'purple.700');

  // New variables for fixing hook errors
  const statCardBg = useColorModeValue('white', 'gray.800');
  const statCardBorderColor = useColorModeValue('purple.100', 'purple.900');
  const statLabelColor = useColorModeValue('gray.600', 'gray.400');
  const statNumberColor = useColorModeValue('gray.900', 'white');
  const headerTextColor = useColorModeValue('gray.600', 'gray.400');

  const fetchListings = useCallback(async () => {
    const walletAddress = user?.walletAddress || account;
    if (!walletAddress) return;

    setLoading(true);
    try {
      const response = await apiRequest(
        `http://localhost:5000/api/users/${walletAddress}/listings`
      );
      if (response.ok) {
        const data = await response.json();
        // Show ALL listings (both active and inactive)
        const allListings = Array.isArray(data) ? data : [];
        setListings(allListings);
      } else {
        throw new Error('Failed to fetch listings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load your listings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [apiRequest, user?.walletAddress, account, toast]);

  // Real-time sync setup
  const handleMarketplaceUpdate = useCallback(
    (data) => {
      if (
        data.type === 'listing_created' ||
        data.type === 'listing_deleted' ||
        data.type === 'listing_purchased'
      ) {
        // Check if the listing belongs to current user
        const userWallets =
          user?.wallets?.map((w) => w.address.toLowerCase()) || [];
        const isUserListing = userWallets.includes(
          data.data.owner?.toLowerCase()
        );

        if (isUserListing || data.type === 'listing_deleted') {
          // Refresh listings when user's listings change
          fetchListings();
          toast({
            title: 'Your Listings Updated',
            description: `A listing was ${data.type === 'listing_created' ? 'added' : data.type === 'listing_purchased' ? 'purchased' : 'removed'}`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    },
    [user?.wallets, fetchListings, toast]
  );

  const { isConnected } = useRealtimeSync(
    user?.walletAddress || account,
    handleMarketplaceUpdate
  );

  useEffect(() => {
    const walletAddress = user?.walletAddress || account;
    if (walletAddress) {
      fetchListings();
    }
  }, [user?.walletAddress, account, fetchListings]);

  const filteredListings = listings.filter((listing) => {
    if (filter === 'active') {
      return listing.isActive;
    } else if (filter === 'inactive') {
      return !listing.isActive;
    }
    return true; // all
  });

  const activeListings = listings.filter((listing) => listing.isActive);
  const inactiveListings = listings.filter((listing) => !listing.isActive);

  const stats = [
    {
      label: 'Total Listings',
      value: listings.length,
      icon: FaShoppingBag,
      color: 'blue',
    },
    {
      label: 'Active Listings',
      value: activeListings.length,
      icon: FaCheckCircle,
      color: 'green',
    },
    {
      label: 'Inactive Listings',
      value: inactiveListings.length,
      icon: FaClock,
      color: 'orange',
    },
    {
      label: 'Total Value',
      value: `${listings.reduce((sum, l) => sum + parseFloat(l.price || 0), 0).toFixed(2)} MATIC`,
      icon: FaWallet,
      color: 'purple',
    },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (listing) => {
    if (listing.isActive) {
      return (
        <Badge colorScheme="green" size="sm">
          Active
        </Badge>
      );
    } else if (listing.buyer) {
      return (
        <Badge colorScheme="red" size="sm">
          Sold
        </Badge>
      );
    } else {
      return (
        <Badge colorScheme="orange" size="sm">
          Inactive
        </Badge>
      );
    }
  };

  const handleToggleStatus = async (listing) => {
    const newStatus = !listing.isActive;
    try {
      const response = await apiRequest(
        `http://localhost:5000/api/listings/${listing.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: newStatus ? 'active' : 'inactive',
          }),
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Listing ${newStatus ? 'activated' : 'deactivated'} successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Refresh listings to show updated status
        fetchListings();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update listing status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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

      // Remove from local state immediately
      setListings((prevListings) =>
        prevListings.filter(
          (listing) => (listing.id || listing.listing_id) !== listingId
        )
      );

      toast({
        title: 'Deleted',
        description: 'Listing removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsDeleteOpen(false);

      // Refresh from server
      setTimeout(() => fetchListings(), 600);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete listing',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditClick = (listing) => {
    setSelectedListing(listing);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (listing) => {
    setSelectedListing(listing);
    setIsDeleteOpen(true);
  };

  const handleViewClick = (listing) => {
    setSelectedListing(listing);
    setIsViewOpen(true);
  };

  if (!user) {
    return (
      <Box bg={sectionBg} minH="100vh">
        <Container maxW="container.lg" py={20}>
          <Center>
            <Card
              bg={cardBg}
              p={8}
              borderRadius="2xl"
              shadow="xl"
              textAlign="center"
            >
              <CardBody>
                <VStack spacing={6}>
                  <Icon
                    as={FaExclamationTriangle}
                    boxSize={16}
                    color="orange.400"
                  />
                  <VStack spacing={3}>
                    <Heading size="lg" color="gray.700">
                      Authentication Required
                    </Heading>
                    <Text color="gray.600">
                      Please sign in to view your listings
                    </Text>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={sectionBg} minH="100vh" pt={24} pb={12}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} align="start">
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={2}>
                <HStack spacing={4}>
                  <Button
                    as={RouterLink}
                    to="/dashboard"
                    variant="outline"
                    size="sm"
                    leftIcon={<Icon as={FaArrowLeft} />}
                    borderRadius="xl"
                  >
                    Back to Dashboard
                  </Button>
                  <Heading
                    size="2xl"
                    bgGradient="linear(135deg, #7000FF, #A666FF)"
                    bgClip="text"
                    fontWeight="900"
                  >
                    My Listings
                  </Heading>
                </HStack>
                <Text fontSize="lg" color={headerTextColor} fontWeight="500">
                  Manage and track all your marketplace listings
                </Text>
              </VStack>
              <HStack spacing={4}>
                <Button
                  as={RouterLink}
                  to="/create"
                  colorScheme="purple"
                  leftIcon={<Icon as={FaPlus} />}
                  borderRadius="xl"
                  bgGradient="linear(135deg, #7000FF, #A666FF)"
                  _hover={{
                    bgGradient: 'linear(135deg, #8000FF, #B777FF)',
                    transform: 'translateY(-1px)',
                    shadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  Create New Listing
                </Button>
                <Badge
                  colorScheme={isConnected ? 'green' : 'red'}
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  <HStack spacing={1}>
                    <Box
                      w={2}
                      h={2}
                      bg={isConnected ? 'green.500' : 'red.500'}
                      borderRadius="full"
                      animation={isConnected ? 'pulse 2s infinite' : 'none'}
                    />
                    <Text fontSize="xs">
                      {isConnected ? 'Live Sync' : 'Offline'}
                    </Text>
                  </HStack>
                </Badge>
              </HStack>
            </HStack>
          </VStack>

          {/* Stats Grid */}
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
            {stats.map((stat, index) => (
              <GridItem key={index}>
                <Card
                  bg={statCardBg}
                  p={6}
                  borderRadius="2xl"
                  shadow="lg"
                  border="1px solid"
                  borderColor={statCardBorderColor}
                  _hover={{
                    transform: 'translateY(-4px)',
                    shadow: '2xl',
                    borderColor: 'purple.400',
                  }}
                  transition="all 0.3s"
                >
                  <CardBody p={0}>
                    <Stat>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={2}>
                          <StatLabel
                            color={statLabelColor}
                            fontSize="sm"
                            fontWeight="600"
                          >
                            {stat.label}
                          </StatLabel>
                          <StatNumber
                            color={statNumberColor}
                            fontSize="3xl"
                            fontWeight="900"
                            bgGradient="linear(135deg, #7000FF, #A666FF)"
                            bgClip="text"
                          >
                            {stat.value}
                          </StatNumber>
                        </VStack>
                        <Box
                          w="14"
                          h="14"
                          borderRadius="xl"
                          bgGradient={`linear(135deg, ${stat.color}.400, ${stat.color}.600)`}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow={`0 8px 16px ${stat.color === 'purple' ? 'rgba(112, 0, 255, 0.3)' : `rgba(0, 0, 0, 0.2)`}`}
                        >
                          <Icon as={stat.icon} boxSize={7} color="white" />
                        </Box>
                      </HStack>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>

          {/* Filter Tabs */}
          <Card bg={cardBg} p={6} borderRadius="xl" shadow="md">
            <CardBody>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Heading size="lg" color="gray.800">
                    Listing History
                  </Heading>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      variant={filter === 'all' ? 'solid' : 'outline'}
                      colorScheme="purple"
                      onClick={() => setFilter('all')}
                      borderRadius="xl"
                    >
                      All ({listings.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'active' ? 'solid' : 'outline'}
                      colorScheme="green"
                      onClick={() => setFilter('active')}
                      borderRadius="xl"
                    >
                      Active ({activeListings.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'inactive' ? 'solid' : 'outline'}
                      colorScheme="orange"
                      onClick={() => setFilter('inactive')}
                      borderRadius="xl"
                    >
                      Inactive ({inactiveListings.length})
                    </Button>
                  </HStack>
                </HStack>

                {loading ? (
                  <Center py={20}>
                    <VStack spacing={6}>
                      <Spinner size="xl" color="blue.500" thickness="4px" />
                      <Text fontSize="lg" color="gray.600">
                        Loading your listings...
                      </Text>
                    </VStack>
                  </Center>
                ) : filteredListings.length === 0 ? (
                  <Center py={20}>
                    <Card
                      bg={cardBg}
                      p={12}
                      borderRadius="2xl"
                      shadow="xl"
                      textAlign="center"
                      maxW="500px"
                    >
                      <CardBody>
                        <VStack spacing={6}>
                          <Icon
                            as={FaShoppingBag}
                            boxSize={16}
                            color="gray.400"
                          />
                          <VStack spacing={3}>
                            <Heading size="lg" color="gray.700">
                              {filter === 'all'
                                ? 'No listings yet'
                                : filter === 'active'
                                  ? 'No active listings'
                                  : 'No inactive listings'}
                            </Heading>
                            <Text color="gray.600">
                              {filter === 'all'
                                ? 'Create your first listing to start selling on Blockrent'
                                : filter === 'active'
                                  ? 'Your active listings will appear here'
                                  : 'Your inactive or sold listings will appear here'}
                            </Text>
                          </VStack>
                          {filter === 'all' && (
                            <Button
                              as={RouterLink}
                              to="/create"
                              colorScheme="purple"
                              leftIcon={<Icon as={FaPlus} />}
                              borderRadius="xl"
                              bgGradient="linear(135deg, #7000FF, #A666FF)"
                              _hover={{
                                bgGradient: 'linear(135deg, #8000FF, #B777FF)',
                              }}
                            >
                              Create Your First Listing
                            </Button>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {filteredListings.map((listing) => (
                      <Card
                        key={`listing-${listing.id || listing.listing_id}`}
                        bg={purpleBg}
                        borderRadius="2xl"
                        shadow="lg"
                        border="1px"
                        borderColor={purpleBorder}
                        overflow="hidden"
                        _hover={{
                          shadow: '2xl',
                          transform: 'translateY(-4px)',
                          transition: 'all 0.3s ease',
                        }}
                        transition="all 0.3s ease"
                      >
                        <CardBody p={0}>
                          {/* Image Section */}
                          <AspectRatio ratio={16 / 9} w="full">
                            <Box bg="gray.100" position="relative">
                              {listing.image ? (
                                <Image
                                  src={listing.image}
                                  alt={listing.title}
                                  objectFit="cover"
                                  w="full"
                                  h="full"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Center h="full">
                                  <Icon
                                    as={FaShoppingBag}
                                    boxSize={12}
                                    color="gray.400"
                                  />
                                </Center>
                              )}
                              <Badge
                                position="absolute"
                                top={3}
                                right={3}
                                colorScheme={
                                  listing.isForRent ? 'green' : 'blue'
                                }
                                borderRadius="full"
                                px={3}
                                py={1}
                                fontSize="sm"
                                fontWeight="semibold"
                              >
                                {listing.isForRent ? 'For Rent' : 'For Sale'}
                              </Badge>
                            </Box>
                          </AspectRatio>

                          {/* Content Section */}
                          <VStack align="stretch" spacing={4} p={6}>
                            <VStack align="start" spacing={2} w="full">
                              <HStack justify="space-between" w="full">
                                <Text
                                  fontSize="sm"
                                  color="gray.500"
                                  fontWeight="medium"
                                >
                                  #{listing.id}
                                </Text>
                                {getStatusBadge(listing)}
                              </HStack>

                              <Heading size="md" noOfLines={2} color="gray.800">
                                {listing.title}
                              </Heading>

                              <Text
                                color="gray.600"
                                noOfLines={3}
                                fontSize="sm"
                                lineHeight="short"
                              >
                                {listing.description}
                              </Text>
                            </VStack>

                            {/* Price Section */}
                            <Box
                              bg={priceBoxBg}
                              p={4}
                              borderRadius="xl"
                              border="1px"
                              borderColor={priceBoxBorder}
                            >
                              <VStack spacing={1}>
                                <Text
                                  fontWeight="bold"
                                  fontSize="xl"
                                  color="purple.600"
                                >
                                  {listing.isForRent
                                    ? `${listing.price} MATIC / period`
                                    : `${listing.price} MATIC`}
                                </Text>
                                {listing.isForRent && listing.deposit && (
                                  <Text fontSize="sm" color="purple.500">
                                    + {listing.deposit} MATIC deposit
                                  </Text>
                                )}
                              </VStack>
                            </Box>

                            {/* Listing Info */}
                            <VStack spacing={2} w="full">
                              <HStack
                                justify="space-between"
                                w="full"
                                fontSize="sm"
                              >
                                <HStack spacing={1}>
                                  <Icon as={FaCalendarAlt} color="gray.500" />
                                  <Text color="gray.600">Created:</Text>
                                </HStack>
                                <Text color="gray.800" fontWeight="medium">
                                  {formatDate(listing.createdAt || listing.id)}
                                </Text>
                              </HStack>

                              {listing.buyer && (
                                <HStack
                                  justify="space-between"
                                  w="full"
                                  fontSize="sm"
                                >
                                  <HStack spacing={1}>
                                    <Icon as={FaWallet} color="gray.500" />
                                    <Text color="gray.600">Sold to:</Text>
                                  </HStack>
                                  <Text
                                    color="gray.800"
                                    fontWeight="medium"
                                    fontFamily="mono"
                                  >
                                    {listing.buyer.slice(0, 6)}...
                                    {listing.buyer.slice(-4)}
                                  </Text>
                                </HStack>
                              )}
                            </VStack>

                            {/* Action Buttons */}
                            <VStack spacing={3} w="full">
                              <Button
                                colorScheme="purple"
                                size="md"
                                w="full"
                                leftIcon={<Icon as={FaEye} />}
                                borderRadius="xl"
                                bgGradient="linear(135deg, #7000FF, #A666FF)"
                                _hover={{
                                  bgGradient:
                                    'linear(135deg, #8000FF, #B777FF)',
                                  transform: 'translateY(-1px)',
                                  shadow: 'lg',
                                }}
                                transition="all 0.2s"
                                onClick={() => handleViewClick(listing)}
                              >
                                View Details
                              </Button>

                              {/* Toggle Active/Inactive Button */}
                              <Button
                                colorScheme={
                                  listing.isActive ? 'orange' : 'green'
                                }
                                size="md"
                                w="full"
                                leftIcon={
                                  <Icon
                                    as={
                                      listing.isActive
                                        ? FaToggleOff
                                        : FaToggleOn
                                    }
                                  />
                                }
                                borderRadius="xl"
                                variant="outline"
                                _hover={{
                                  transform: 'translateY(-1px)',
                                  shadow: 'md',
                                  bg: listing.isActive
                                    ? 'orange.50'
                                    : 'green.50',
                                }}
                                transition="all 0.2s"
                                onClick={() => handleToggleStatus(listing)}
                              >
                                {listing.isActive ? 'Deactivate' : 'Activate'}
                              </Button>

                              {/* Edit and Delete Buttons */}
                              <HStack spacing={2} w="full">
                                <Button
                                  colorScheme="green"
                                  size="md"
                                  flex={1}
                                  leftIcon={<Icon as={FaEdit} />}
                                  borderRadius="xl"
                                  isDisabled={!listing.isActive}
                                  _hover={{
                                    transform: 'translateY(-1px)',
                                    shadow: 'md',
                                  }}
                                  transition="all 0.2s"
                                  onClick={() => handleEditClick(listing)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  colorScheme="red"
                                  size="md"
                                  flex={1}
                                  leftIcon={<Icon as={FaTrash} />}
                                  borderRadius="xl"
                                  _hover={{
                                    transform: 'translateY(-1px)',
                                    shadow: 'md',
                                  }}
                                  transition="all 0.2s"
                                  onClick={() => handleDeleteClick(listing)}
                                >
                                  Delete
                                </Button>
                              </HStack>
                            </VStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Modals */}
      <EditListingModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        listing={selectedListing}
        onEditSuccess={() => {
          setIsEditOpen(false);
          fetchListings();
        }}
      />
      <DeleteListingModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        listing={selectedListing}
        onDeleteSuccess={handleDeleteListing}
      />
      <ViewDetailsModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        listingId={selectedListing?.id}
        listing={selectedListing}
        onTransactionSuccess={() => {
          setIsViewOpen(false);
          fetchListings();
        }}
      />
    </Box>
  );
};

export default ListingsPage;
