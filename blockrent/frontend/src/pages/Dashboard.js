import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Grid,
  GridItem,
  Badge,
  Icon,
  useColorModeValue,
  Avatar,
  Flex,
  Progress,
  Skeleton,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiEye,
  FiHeart,
  FiUsers,
  FiArrowUp,
  FiArrowDown,
  FiClock,
  FiPackage,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

import GradientButton from '../components/GradientButton';
import ModernCard from '../components/ModernCard';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import gradients from '../theme/gradients';

const MotionBox = motion(Box);

const StatCard = ({ title, value, change, icon, gradient, isPositive }) => {
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ModernCard>
        <HStack justify="space-between" mb={4}>
          <Box
            p={3}
            borderRadius="xl"
            bgGradient={gradient}
            boxShadow="0 8px 24px rgba(0, 0, 0, 0.15)"
          >
            <Icon as={icon} boxSize={7} color="white" />
          </Box>
          {change && (
            <HStack
              spacing={1}
              fontSize="sm"
              fontWeight="700"
              color={isPositive ? 'green.500' : 'red.500'}
              bg={isPositive ? 'green.50' : 'red.50'}
              px={3}
              py={1}
              borderRadius="full"
            >
              <Icon as={isPositive ? FiArrowUp : FiArrowDown} />
              <Text>{change}%</Text>
            </HStack>
          )}
        </HStack>
        <VStack align="start" spacing={2}>
          <Text
            fontSize="sm"
            color={textColor}
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {title}
          </Text>
          <Text
            fontSize="4xl"
            fontWeight="900"
            bgGradient={gradients.text.cosmic}
            bgClip="text"
            lineHeight="1"
          >
            {value}
          </Text>
        </VStack>
      </ModernCard>
    </MotionBox>
  );
};

const ActivityItem = ({ title, description, time, icon, gradient }) => {
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <HStack
      spacing={4}
      p={4}
      borderRadius="xl"
      transition="all 0.2s"
      cursor="pointer"
      _hover={{
        bg: useColorModeValue('gray.50', 'whiteAlpha.50'),
        transform: 'translateX(4px)',
      }}
    >
      <Box p={2} borderRadius="lg" bgGradient={gradient} boxShadow="md">
        <Icon as={icon} boxSize={4} color="white" />
      </Box>
      <Box flex={1}>
        <Text fontWeight="600" fontSize="sm">
          {title}
        </Text>
        <Text fontSize="xs" color={textColor}>
          {description}
        </Text>
      </Box>
      <Text fontSize="xs" color={textColor}>
        {time}
      </Text>
    </HStack>
  );
};

const ListingItem = ({ title, price, views, likes, status }) => {
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Flex
      justify="space-between"
      align="center"
      p={4}
      borderRadius="xl"
      border="1px solid"
      borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
      transition="all 0.2s"
      _hover={{
        borderColor: 'brand.500',
        transform: 'translateX(4px)',
      }}
    >
      <VStack align="start" spacing={1} flex={1}>
        <Text fontWeight="600" fontSize="sm">
          {title}
        </Text>
        <HStack spacing={4} fontSize="xs" color={textColor}>
          <HStack>
            <Icon as={FiEye} />
            <Text>{views} views</Text>
          </HStack>
          <HStack>
            <Icon as={FiHeart} />
            <Text>{likes} likes</Text>
          </HStack>
        </HStack>
      </VStack>
      <VStack align="end" spacing={1}>
        <Text
          fontWeight="900"
          color={useColorModeValue('brand.600', 'brand.400')}
        >
          ${price}
        </Text>
        <Badge
          colorScheme={status === 'active' ? 'green' : 'gray'}
          borderRadius="full"
          px={2}
          fontSize="xs"
        >
          {status}
        </Badge>
      </VStack>
    </Flex>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { balance } = useWeb3();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topListings, setTopListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const gradientText = useColorModeValue(
    'linear(135deg, #0052CC, #5C00CC)',
    'linear(135deg, brand.500, brand.purple.500)'
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.walletAddress) return;

      try {
        setLoading(true);
        const API_URL =
          process.env.REACT_APP_API_URL || 'http://localhost:5000';

        // Fetch user stats, listings, and activity
        const [statsRes, listingsRes] = await Promise.all([
          fetch(`${API_URL}/api/users/${user.walletAddress}/stats`).catch(
            () => null
          ),
          fetch(`${API_URL}/api/users/${user.walletAddress}/listings`).catch(
            () => null
          ),
        ]);

        if (statsRes?.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (listingsRes?.ok) {
          const listingsData = await listingsRes.json();
          // Handle both array response and object with listings property
          const listings = Array.isArray(listingsData)
            ? listingsData
            : listingsData.listings || [];

          // Get top 3 active listings sorted by views or created date
          const activeListings = listings
            .filter((l) => l.is_active)
            .slice(0, 3)
            .map((l) => ({
              title: l.title,
              price: (parseFloat(l.price_wei) / 1e18).toFixed(4),
              views: l.views || 0,
              likes: l.favorites || 0,
              status: l.is_active ? 'active' : 'inactive',
            }));
          setTopListings(activeListings);
        }

        // Recent activity will be populated from actual user actions
        setRecentActivity([]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Silent fail with default data
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.walletAddress]);

  const defaultStats = [
    {
      title: 'Total Earnings',
      value: stats?.totalEarnings || '$0',
      change: stats?.earningsChange || '+0',
      isPositive: true,
      icon: FiDollarSign,
      gradient: 'linear(135deg, #10B981, #00BBFF)',
    },
    {
      title: 'Active Listings',
      value: stats?.activeListings || '0',
      change: stats?.listingsChange || '+0',
      isPositive: true,
      icon: FiShoppingBag,
      gradient: 'linear(135deg, #0066FF, #00BBFF)',
    },
    {
      title: 'Total Views',
      value: stats?.totalViews || '0',
      change: stats?.viewsChange || '+0',
      isPositive: true,
      icon: FiEye,
      gradient: 'linear(135deg, #7000FF, #A666FF)',
    },
    {
      title: 'Profile Rating',
      value: user?.reputation ? `${user.reputation.toFixed(1)} ⭐` : 'New User',
      change: null,
      isPositive: true,
      icon: FiTrendingUp,
      gradient: 'linear(135deg, #F59E0B, #EF4444)',
    },
  ];

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
        top="-10%"
        right="-5%"
        width="500px"
        height="500px"
        borderRadius="full"
        bgGradient={gradients.primary}
        opacity={0.08}
        filter="blur(100px)"
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
        bottom="-10%"
        left="-5%"
        width="500px"
        height="500px"
        borderRadius="full"
        bgGradient={gradients.secondary}
        opacity={0.08}
        filter="blur(100px)"
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
            <Flex justify="space-between" align="start" flexWrap="wrap" gap={6}>
              <VStack align="start" spacing={2}>
                <Heading
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="900"
                  color={useColorModeValue('gray.800', 'gray.50')}
                >
                  Welcome back, {user?.displayName || user?.username || 'User'}
                </Heading>
                <Text color={textColor} fontSize="xl" fontWeight="500">
                  Your decentralized marketplace dashboard
                </Text>
              </VStack>
              <HStack spacing={3}>
                <GradientButton
                  as={RouterLink}
                  to="/create"
                  variant="cosmic"
                  size="lg"
                  leftIcon={<Icon as={FiPlus} />}
                >
                  Create Listing
                </GradientButton>
                <GradientButton
                  as={RouterLink}
                  to="/marketplace"
                  variant="secondary"
                  size="lg"
                >
                  Browse
                </GradientButton>
              </HStack>
            </Flex>
          </MotionBox>

          {/* Stats Grid */}
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
            gap={6}
          >
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} height="150px" borderRadius="2xl" />
                ))}
              </>
            ) : (
              defaultStats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))
            )}
          </Grid>

          {/* Main Content Grid */}
          <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
            {/* Left Column */}
            <VStack spacing={8} align="stretch">
              {/* Top Listings */}
              <ModernCard>
                <HStack justify="space-between" mb={6}>
                  <Heading size="md" fontWeight="700">
                    Top Performing Listings
                  </Heading>
                  <Button
                    as={RouterLink}
                    to="/listings"
                    variant="link"
                    size="sm"
                    color="brand.500"
                  >
                    View All
                  </Button>
                </HStack>
                {loading ? (
                  <VStack spacing={4} align="stretch">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} height="100px" borderRadius="xl" />
                    ))}
                  </VStack>
                ) : topListings.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    {topListings.map((listing, index) => (
                      <ListingItem key={index} {...listing} />
                    ))}
                  </VStack>
                ) : (
                  <Box py={8} textAlign="center">
                    <Text color={textColor} fontSize="sm">
                      No listings yet. Create your first listing to get started!
                    </Text>
                    <Button
                      as={RouterLink}
                      to="/create"
                      mt={4}
                      size="sm"
                      leftIcon={<Icon as={FiPlus} />}
                    >
                      Create Listing
                    </Button>
                  </Box>
                )}
              </ModernCard>

              {/* Blockchain Info Card */}
              <ModernCard>
                <VStack align="stretch" spacing={6}>
                  <HStack justify="space-between">
                    <Heading size="md" fontWeight="700">
                      Blockchain Status
                    </Heading>
                    <Badge
                      colorScheme="green"
                      borderRadius="full"
                      px={3}
                      py={1}
                    >
                      Connected
                    </Badge>
                  </HStack>

                  <VStack spacing={4} align="stretch">
                    <HStack
                      justify="space-between"
                      p={4}
                      bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
                      borderRadius="xl"
                    >
                      <VStack align="start" spacing={1}>
                        <Text
                          fontSize="xs"
                          color={textColor}
                          fontWeight="600"
                          textTransform="uppercase"
                        >
                          Network
                        </Text>
                        <Text fontSize="lg" fontWeight="700">
                          Polygon Mumbai
                        </Text>
                      </VStack>
                      <Icon as={FiPackage} boxSize={6} color="brand.500" />
                    </HStack>

                    <HStack
                      justify="space-between"
                      p={4}
                      bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
                      borderRadius="xl"
                    >
                      <VStack align="start" spacing={1}>
                        <Text
                          fontSize="xs"
                          color={textColor}
                          fontWeight="600"
                          textTransform="uppercase"
                        >
                          Wallet Balance
                        </Text>
                        <Text fontSize="lg" fontWeight="700">
                          {parseFloat(balance || '0').toFixed(4)} MATIC
                        </Text>
                      </VStack>
                      <Icon as={FiDollarSign} boxSize={6} color="green.500" />
                    </HStack>

                    <HStack
                      justify="space-between"
                      p={4}
                      bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
                      borderRadius="xl"
                    >
                      <VStack align="start" spacing={1}>
                        <Text
                          fontSize="xs"
                          color={textColor}
                          fontWeight="600"
                          textTransform="uppercase"
                        >
                          Smart Contract
                        </Text>
                        <Text fontSize="lg" fontWeight="700">
                          Active
                        </Text>
                      </VStack>
                      <Icon as={FiTrendingUp} boxSize={6} color="purple.500" />
                    </HStack>

                    <HStack
                      justify="space-between"
                      p={4}
                      bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
                      borderRadius="xl"
                    >
                      <VStack align="start" spacing={1}>
                        <Text
                          fontSize="xs"
                          color={textColor}
                          fontWeight="600"
                          textTransform="uppercase"
                        >
                          Gas Fee
                        </Text>
                        <Text fontSize="lg" fontWeight="700">
                          Low
                        </Text>
                      </VStack>
                      <Icon as={FiClock} boxSize={6} color="blue.500" />
                    </HStack>
                  </VStack>
                </VStack>
              </ModernCard>
            </VStack>

            {/* Right Column - Activity Feed */}
            <ModernCard>
              <VStack align="stretch" spacing={4}>
                <Heading size="md" fontWeight="700">
                  Recent Activity
                </Heading>
                <VStack spacing={2} align="stretch">
                  {recentActivity.map((activity, index) => (
                    <ActivityItem key={index} {...activity} />
                  ))}
                </VStack>
              </VStack>
            </ModernCard>
          </Grid>

          {/* Quick Actions */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Box
              bgGradient={gradients.cosmic}
              borderRadius="3xl"
              p={12}
              position="relative"
              overflow="hidden"
              boxShadow="0 30px 80px rgba(0, 0, 0, 0.3)"
            >
              <MotionBox
                position="absolute"
                top="-20%"
                right="-10%"
                width="400px"
                height="400px"
                borderRadius="full"
                bg="whiteAlpha.200"
                filter="blur(80px)"
                animate={{
                  scale: [1, 1.2, 1],
                  x: [0, 50, 0],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              <VStack spacing={6} position="relative" zIndex={1}>
                <Heading
                  size="2xl"
                  color="white"
                  textAlign="center"
                  fontWeight="900"
                >
                  Start Trading on the Blockchain
                </Heading>
                <Text
                  color="whiteAlpha.900"
                  textAlign="center"
                  fontSize="xl"
                  fontWeight="500"
                >
                  List your assets, browse the marketplace, and trade securely
                  with smart contracts
                </Text>
                <HStack spacing={4} mt={4}>
                  <GradientButton
                    as={RouterLink}
                    to="/create"
                    variant="primary"
                    size="lg"
                    leftIcon={<Icon as={FiPlus} />}
                    bg="white"
                    color="blue.600"
                    _hover={{
                      bg: 'gray.50',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 40px rgba(255, 255, 255, 0.3)',
                    }}
                    bgGradient="none"
                  >
                    New Listing
                  </GradientButton>
                  <GradientButton
                    as={RouterLink}
                    to="/marketplace"
                    variant="secondary"
                    size="lg"
                    bg="whiteAlpha.200"
                    color="white"
                    borderWidth="2px"
                    borderColor="white"
                    _hover={{
                      bg: 'whiteAlpha.300',
                      transform: 'translateY(-4px)',
                    }}
                    bgGradient="none"
                  >
                    Explore Marketplace
                  </GradientButton>
                </HStack>
              </VStack>
            </Box>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

export default Dashboard;
