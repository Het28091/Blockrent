import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  VStack,
  Grid,
  GridItem,
  Icon,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import {
  FiShield,
  FiZap,
  FiTrendingUp,
  FiGlobe,
  FiLock,
  FiDollarSign,
  FiArrowRight,
  FiStar,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

import GradientButton from '../components/GradientButton';
import ModernCard from '../components/ModernCard';
import gradients from '../theme/gradients';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const LandingPage = () => {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  // Color mode values
  const bgGradient = useColorModeValue(
    gradients.subtle.blue,
    gradients.dark.background
  );
  const textColor = useColorModeValue('gray.800', 'gray.50');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'rgba(45, 55, 72, 0.95)');

  const features = [
    {
      icon: FiShield,
      title: 'Secure Escrow',
      description:
        'Smart contracts hold funds until both parties confirm completion',
      gradient: 'linear-gradient(135deg, #0066FF 0%, #00BBFF 100%)',
    },
    {
      icon: FiDollarSign,
      title: 'Low Fees',
      description:
        'Only 2.5% platform fee vs 10-15% on traditional marketplaces',
      gradient: 'linear-gradient(135deg, #10B981 0%, #00BBFF 100%)',
    },
    {
      icon: FiGlobe,
      title: 'Decentralized',
      description: 'No single point of failure, censorship-resistant platform',
      gradient: 'linear-gradient(135deg, #7000FF 0%, #A666FF 100%)',
    },
    {
      icon: FiZap,
      title: 'Fast Transactions',
      description:
        'Polygon network enables quick, low-cost blockchain transactions',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    },
    {
      icon: FiLock,
      title: 'Transparent',
      description: 'All transactions recorded immutably on the blockchain',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #7000FF 100%)',
    },
    {
      icon: FiStar,
      title: 'Reputation System',
      description: 'On-chain ratings build trust in the community',
      gradient: 'linear-gradient(135deg, #00BBFF 0%, #0066FF 100%)',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '$50M+', label: 'Trading Volume' },
    { value: '99.9%', label: 'Uptime' },
    { value: '2.5%', label: 'Platform Fee' },
  ];

  return (
    <Box bgGradient={bgGradient} minH="100vh" position="relative">
      {/* Hero Section */}
      <Box
        position="relative"
        overflow="hidden"
        pt={{ base: 32, md: 40 }}
        pb={{ base: 24, md: 32 }}
        minH="100vh"
        display="flex"
        alignItems="center"
      >
        {/* Animated Background Elements */}
        <MotionBox
          position="absolute"
          top="-10%"
          right="-5%"
          width="600px"
          height="600px"
          borderRadius="full"
          bgGradient={gradients.primary}
          opacity={0.1}
          filter="blur(120px)"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <MotionBox
          position="absolute"
          bottom="-10%"
          left="-5%"
          width="600px"
          height="600px"
          borderRadius="full"
          bgGradient={gradients.secondary}
          opacity={0.1}
          filter="blur(120px)"
          animate={{
            scale: [1.3, 1, 1.3],
            rotate: [180, 0, 180],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <MotionBox
          position="absolute"
          top="50%"
          left="50%"
          width="400px"
          height="400px"
          borderRadius="full"
          bgGradient={gradients.success}
          opacity={0.08}
          filter="blur(100px)"
          animate={{
            scale: [1, 1.2, 1],
            x: [-200, 200, -200],
            y: [-100, 100, -100],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <Container maxW="7xl" position="relative" zIndex={1} w="full">
          <VStack spacing={12} textAlign="center" w="full">
            {/* Text Logo */}
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
              w="full"
            >
              <Heading
                fontSize={{ base: '4xl', md: '5xl', lg: '6xl' }}
                fontWeight="900"
                color={textColor}
                textAlign="center"
                letterSpacing="tight"
                mb={3}
              >
                BLOCKRENT
              </Heading>
              <Box
                h="4px"
                w={{ base: '200px', md: '300px' }}
                mx="auto"
                bgGradient={gradients.cosmic}
                borderRadius="full"
                mb={8}
              />
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              w="full"
            >
              <Heading
                fontSize={{ base: '5xl', md: '7xl', lg: '8xl' }}
                fontWeight="900"
                lineHeight="1"
                bgGradient={gradients.text.cosmic}
                bgClip="text"
                mb={6}
              >
                The Future of
                <br />
                P2P Commerce
              </Heading>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              w="full"
            >
              <Text
                fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
                maxW="4xl"
                mx="auto"
                color={secondaryTextColor}
                lineHeight="tall"
                fontWeight="500"
              >
                Buy, sell, and rent high-value assets with confidence on the
                blockchain. Secure escrow, low fees, and complete transparency.
              </Text>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              w="full"
            >
              <Stack
                direction={{ base: 'column', sm: 'row' }}
                spacing={6}
                mt={8}
                justify="center"
              >
                <GradientButton
                  as={RouterLink}
                  to="/marketplace"
                  variant="cosmic"
                  size="lg"
                  rightIcon={<Icon as={FiArrowRight} />}
                  px={12}
                  py={8}
                  fontSize="xl"
                  fontWeight="700"
                >
                  Explore Marketplace
                </GradientButton>
                <GradientButton
                  as={RouterLink}
                  to="/signup"
                  variant="secondary"
                  size="lg"
                  px={12}
                  py={8}
                  fontSize="xl"
                  fontWeight="700"
                >
                  Get Started
                </GradientButton>
              </Stack>
            </MotionBox>

            {/* Stats Grid */}
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              mt={20}
              w="full"
            >
              <ModernCard>
                <Grid
                  templateColumns={{
                    base: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)',
                  }}
                  gap={{ base: 8, md: 12 }}
                >
                  {stats.map((stat, index) => (
                    <GridItem key={index}>
                      <VStack spacing={4}>
                        <Text
                          fontSize={{ base: '4xl', md: '6xl' }}
                          fontWeight="900"
                          bgGradient={gradients.text.cosmic}
                          bgClip="text"
                          lineHeight="1"
                        >
                          {stat.value}
                        </Text>
                        <Text
                          fontSize={{ base: 'xs', md: 'sm' }}
                          color={secondaryTextColor}
                          textTransform="uppercase"
                          letterSpacing="wider"
                          fontWeight="700"
                        >
                          {stat.label}
                        </Text>
                      </VStack>
                    </GridItem>
                  ))}
                </Grid>
              </ModernCard>
            </MotionBox>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} position="relative">
        <Container maxW="7xl">
          <VStack spacing={16}>
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <VStack spacing={4} textAlign="center">
                <Heading
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="900"
                  bgGradient={gradients.text.cosmic}
                  bgClip="text"
                >
                  Why Choose Blockrent?
                </Heading>
                <Text
                  fontSize={{ base: 'lg', md: 'xl' }}
                  color={secondaryTextColor}
                  maxW="2xl"
                  fontWeight="500"
                >
                  Built on blockchain technology for security, transparency, and
                  efficiency
                </Text>
              </VStack>
            </MotionBox>

            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              }}
              gap={8}
              w="full"
            >
              {features.map((feature, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <ModernCard>
                    <VStack align="start" spacing={5} h="full">
                      <Box
                        p={4}
                        borderRadius="xl"
                        bgGradient={feature.gradient}
                        boxShadow="0 8px 24px rgba(0, 0, 0, 0.15)"
                      >
                        <Icon as={feature.icon} boxSize={8} color="white" />
                      </Box>
                      <Heading size="md" fontWeight="700" color={textColor}>
                        {feature.title}
                      </Heading>
                      <Text
                        color={secondaryTextColor}
                        lineHeight="tall"
                        fontWeight="500"
                        fontSize="md"
                      >
                        {feature.description}
                      </Text>
                    </VStack>
                  </ModernCard>
                </MotionBox>
              ))}
            </Grid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={20} position="relative">
        <Container maxW="5xl" position="relative" zIndex={1}>
          <MotionBox
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Box
              p={{ base: 10, md: 20 }}
              bgGradient={gradients.cosmic}
              borderRadius="3xl"
              position="relative"
              overflow="hidden"
              boxShadow="0 30px 80px rgba(0, 0, 0, 0.3)"
            >
              {/* Animated background orbs */}
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
              <MotionBox
                position="absolute"
                bottom="-20%"
                left="-10%"
                width="400px"
                height="400px"
                borderRadius="full"
                bg="whiteAlpha.200"
                filter="blur(80px)"
                animate={{
                  scale: [1.2, 1, 1.2],
                  x: [0, -50, 0],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />

              <VStack spacing={8} position="relative" zIndex={1}>
                <Heading
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="900"
                  color="white"
                  textAlign="center"
                >
                  Ready to Start Trading?
                </Heading>
                <Text
                  fontSize={{ base: 'lg', md: 'xl' }}
                  color="whiteAlpha.900"
                  textAlign="center"
                  maxW="2xl"
                  fontWeight="500"
                >
                  Join thousands of users trading securely on the blockchain.
                  Experience the future of decentralized commerce today.
                </Text>
                <Stack
                  direction={{ base: 'column', sm: 'row' }}
                  spacing={4}
                  mt={6}
                >
                  <GradientButton
                    as={RouterLink}
                    to="/signup"
                    variant="primary"
                    size="lg"
                    px={10}
                    py={7}
                    fontSize="lg"
                    bg="white"
                    color="blue.600"
                    _hover={{
                      bg: 'gray.50',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 40px rgba(255, 255, 255, 0.3)',
                    }}
                    rightIcon={<Icon as={FiArrowRight} />}
                    bgGradient="none"
                  >
                    Create Account
                  </GradientButton>
                  <GradientButton
                    as={RouterLink}
                    to="/marketplace"
                    variant="secondary"
                    size="lg"
                    px={10}
                    py={7}
                    fontSize="lg"
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
                    Browse Listings
                  </GradientButton>
                </Stack>
              </VStack>
            </Box>
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
