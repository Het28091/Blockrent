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
  Spinner,
  Center,
  SimpleGrid,
  AspectRatio,
  Image,
  Button,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import {
  FaShoppingBag,
  FaArrowLeft,
  FaEye,
  FaCalendarAlt,
  FaWallet,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

import ViewDetailsModal from '../components/ViewDetailsModal';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import useModernToast from '../hooks/useModernToast';
import useRealtimeSync from '../hooks/useRealtimeSync';

const PurchasesPage = () => {
  const { user, apiRequest, isAuthenticated } = useAuth();
  const { account } = useWeb3();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, current, previous
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const toast = useModernToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');
  const purpleBg = useColorModeValue('purple.50', 'purple.900');
  const purpleBorder = useColorModeValue('purple.200', 'purple.700');
  const priceBoxBg = useColorModeValue('purple.100', 'purple.800');
  const priceBoxBorder = useColorModeValue('purple.200', 'purple.700');

  // New variables for fixing hook errors
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const statCardBg = useColorModeValue('white', 'gray.800');
  const statCardBorderColor = useColorModeValue('purple.100', 'purple.900');
  const statNumberColor = useColorModeValue('gray.900', 'white');

  const fetchPurchases = useCallback(async () => {
    const walletAddress = user?.walletAddress || account;
    if (!walletAddress || !isAuthenticated) return;

    setLoading(true);
    try {
      const response = await apiRequest(
        `http://localhost:5000/api/users/${walletAddress}/purchases`
      );
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      } else {
        throw new Error('Failed to fetch purchases');
      }
    } catch (error) {
      toast.error('Error', 'Failed to load your purchases');
    } finally {
      setLoading(false);
    }
  }, [apiRequest, user?.walletAddress, account, toast, isAuthenticated]);

  // Real-time sync setup
  const handleMarketplaceUpdate = useCallback(
    (data) => {
      if (data.type === 'listing_purchased') {
        // Check if this purchase belongs to current user
        const userWallets =
          user?.wallets?.map((w) => w.address.toLowerCase()) || [];
        const isUserPurchase = userWallets.includes(
          data.data.buyer?.toLowerCase()
        );

        if (isUserPurchase) {
          // Refresh purchases when user makes a new purchase
          fetchPurchases();
          toast.success(
            'New Purchase!',
            'You have successfully purchased an item'
          );
        }
      }
    },
    [user?.wallets, fetchPurchases, toast]
  );

  const { isConnected } = useRealtimeSync(
    user?.walletAddress || account,
    handleMarketplaceUpdate
  );

  useEffect(() => {
    const walletAddress = user?.walletAddress || account;
    if (walletAddress && isAuthenticated) {
      fetchPurchases();
    }
  }, [user?.walletAddress, account, fetchPurchases, isAuthenticated]);

  const filteredPurchases = purchases.filter((purchase) => {
    if (filter === 'current') {
      // For current purchases, we could filter by recent purchases or active rentals
      const purchaseDate = new Date(purchase.purchaseDate);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return purchaseDate > thirtyDaysAgo;
    } else if (filter === 'previous') {
      // For previous purchases, older than 30 days
      const purchaseDate = new Date(purchase.purchaseDate);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return purchaseDate <= thirtyDaysAgo;
    }
    return true; // all
  });

  const currentPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.purchaseDate);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return purchaseDate > thirtyDaysAgo;
  });

  const previousPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.purchaseDate);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return purchaseDate <= thirtyDaysAgo;
  });

  const stats = [
    {
      label: 'Total Purchases',
      value: purchases.length,
      icon: FaShoppingBag,
      color: 'blue',
    },
    {
      label: 'Current Purchases',
      value: currentPurchases.length,
      icon: FaCheckCircle,
      color: 'green',
    },
    {
      label: 'Previous Purchases',
      value: previousPurchases.length,
      icon: FaClock,
      color: 'orange',
    },
    {
      label: 'Total Spent',
      value: `${purchases.reduce((sum, p) => sum + parseFloat(p.price || 0), 0).toFixed(2)} MATIC`,
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

  const handleViewClick = (purchase) => {
    setSelectedPurchase(purchase);
    setIsViewOpen(true);
  };

  const getStatusBadge = (purchase) => {
    const purchaseDate = new Date(purchase.purchaseDate);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (purchaseDate > thirtyDaysAgo) {
      return (
        <Badge colorScheme="green" size="sm">
          Current
        </Badge>
      );
    } else {
      return (
        <Badge colorScheme="orange" size="sm">
          Previous
        </Badge>
      );
    }
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
                      Please sign in to view your purchases
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
                    My Purchases
                  </Heading>
                </HStack>
                <Text fontSize="lg" color={textColor} fontWeight="500">
                  Track all your marketplace purchases
                </Text>
              </VStack>
              <HStack spacing={2}>
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
                            color={textColor}
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
                    Purchase History
                  </Heading>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      variant={filter === 'all' ? 'solid' : 'outline'}
                      colorScheme="purple"
                      onClick={() => setFilter('all')}
                      borderRadius="xl"
                    >
                      All ({purchases.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'current' ? 'solid' : 'outline'}
                      colorScheme="green"
                      onClick={() => setFilter('current')}
                      borderRadius="xl"
                    >
                      Current ({currentPurchases.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'previous' ? 'solid' : 'outline'}
                      colorScheme="orange"
                      onClick={() => setFilter('previous')}
                      borderRadius="xl"
                    >
                      Previous ({previousPurchases.length})
                    </Button>
                  </HStack>
                </HStack>

                {loading ? (
                  <Center py={20}>
                    <VStack spacing={6}>
                      <Spinner size="xl" color="blue.500" thickness="4px" />
                      <Text fontSize="lg" color="gray.600">
                        Loading your purchases...
                      </Text>
                    </VStack>
                  </Center>
                ) : filteredPurchases.length === 0 ? (
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
                                ? 'No purchases yet'
                                : filter === 'current'
                                  ? 'No current purchases'
                                  : 'No previous purchases'}
                            </Heading>
                            <Text color="gray.600">
                              {filter === 'all'
                                ? 'Start shopping to see your purchased items here'
                                : filter === 'current'
                                  ? 'Your recent purchases will appear here'
                                  : 'Your older purchases will appear here'}
                            </Text>
                          </VStack>
                          {filter === 'all' && (
                            <Button
                              as={RouterLink}
                              to="/marketplace"
                              colorScheme="purple"
                              leftIcon={<Icon as={FaShoppingBag} />}
                              borderRadius="xl"
                              bgGradient="linear(135deg, #7000FF, #A666FF)"
                              _hover={{
                                bgGradient: 'linear(135deg, #8000FF, #B777FF)',
                              }}
                            >
                              Browse Marketplace
                            </Button>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </Center>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {filteredPurchases.map((purchase) => (
                      <Card
                        key={purchase.id}
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
                              {purchase.image ? (
                                <Image
                                  src={purchase.image}
                                  alt={purchase.title}
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
                                colorScheme="green"
                                borderRadius="full"
                                px={3}
                                py={1}
                                fontSize="sm"
                                fontWeight="semibold"
                              >
                                Purchased
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
                                  #{purchase.id}
                                </Text>
                                {getStatusBadge(purchase)}
                              </HStack>

                              <Heading size="md" noOfLines={2} color="gray.800">
                                {purchase.title}
                              </Heading>

                              <Text
                                color="gray.600"
                                noOfLines={3}
                                fontSize="sm"
                                lineHeight="short"
                              >
                                {purchase.description}
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
                                  {purchase.isForRent
                                    ? `${purchase.price} MATIC / period`
                                    : `${purchase.price} MATIC`}
                                </Text>
                                {purchase.isForRent && purchase.deposit && (
                                  <Text fontSize="sm" color="purple.500">
                                    + {purchase.deposit} MATIC deposit
                                  </Text>
                                )}
                              </VStack>
                            </Box>

                            {/* Purchase Info */}
                            <VStack spacing={2} w="full">
                              <HStack
                                justify="space-between"
                                w="full"
                                fontSize="sm"
                              >
                                <HStack spacing={1}>
                                  <Icon as={FaCalendarAlt} color="gray.500" />
                                  <Text color="gray.600">Purchased:</Text>
                                </HStack>
                                <Text color="gray.800" fontWeight="medium">
                                  {formatDate(purchase.purchaseDate)}
                                </Text>
                              </HStack>

                              <HStack
                                justify="space-between"
                                w="full"
                                fontSize="sm"
                              >
                                <HStack spacing={1}>
                                  <Icon as={FaWallet} color="gray.500" />
                                  <Text color="gray.600">From:</Text>
                                </HStack>
                                <Text
                                  color="gray.800"
                                  fontWeight="medium"
                                  fontFamily="mono"
                                >
                                  {purchase.owner.slice(0, 6)}...
                                  {purchase.owner.slice(-4)}
                                </Text>
                              </HStack>
                            </VStack>

                            {/* Action Button */}
                            <Button
                              colorScheme="purple"
                              size="md"
                              w="full"
                              leftIcon={<Icon as={FaEye} />}
                              borderRadius="xl"
                              bgGradient="linear(135deg, #7000FF, #A666FF)"
                              _hover={{
                                bgGradient: 'linear(135deg, #8000FF, #B777FF)',
                                transform: 'translateY(-1px)',
                                shadow: 'lg',
                              }}
                              transition="all 0.2s"
                              onClick={() => handleViewClick(purchase)}
                            >
                              View Details
                            </Button>
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

      {/* View Details Modal */}
      <ViewDetailsModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        listingId={selectedPurchase?.id}
        listing={selectedPurchase}
        onTransactionSuccess={() => {
          setIsViewOpen(false);
          fetchPurchases();
        }}
      />
    </Box>
  );
};

export default PurchasesPage;
