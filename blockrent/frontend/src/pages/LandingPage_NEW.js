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
  HStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import {
  FiShield,
  FiZap,
  FiGlobe,
  FiLock,
  FiDollarSign,
  FiArrowRight,
  FiStar,
} from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import GradientButton from '../components/GradientButton';
import ModernCard from '../components/ModernCard';
import gradients from '../theme/gradients';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const LandingPage = () => {
  const navigate = useNavigate();
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const sectionBg1 = useColorModeValue('gray.50', 'gray.900');
  const sectionBg2 = useColorModeValue('white', 'gray.800');

  const features = [
    {
      icon: FiShield,
      title: 'Secure Escrow',
      description:
        'Smart contracts hold funds until both parties confirm completion',
      gradient: gradients.primary,
    },
    {
      icon: FiDollarSign,
      title: 'Low Fees',
      description:
        'Only 2.5% platform fee vs 10-15% on traditional marketplaces',
      gradient: gradients.success,
    },
    {
      icon: FiGlobe,
      title: 'Decentralized',
      description: 'No single point of failure, censorship-resistant platform',
      gradient: gradients.secondary,
    },
    {
      icon: FiZap,
      title: 'Fast Transactions',
      description:
        'Polygon network enables quick, low-cost blockchain transactions',
      gradient: gradients.warning,
    },
    {
      icon: FiLock,
      title: 'Transparent',
      description: 'All transactions recorded immutably on the blockchain',
      gradient: gradients.info,
    },
    {
      icon: FiStar,
      title: 'Reputation System',
      description: 'On-chain ratings build trust in the community',
      gradient: gradients.ocean,
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '$50M+', label: 'Trading Volume' },
    { value: '99.9%', label: 'Uptime' },
    { value: '2.5%', label: 'Platform Fee' },
  ];

  return (
    <Box>
      {/* Hero Section with Animated Gradient */}
      <Box
        position="relative"
        overflow="hidden"
        pt={{ base: 20, md: 32 }}
        pb={{ base: 20, md: 40 }}
        bgGradient={gradients.animated.cosmic.background}
        backgroundSize={gradients.animated.cosmic.backgroundSize}
        animation={gradients.animated.cosmic.animation}
      >
        {/* Floating Elements */}
        <MotionBox
          position="absolute"
          top="20%"
          right="10%"
          width="100px"
          height="100px"
          borderRadius="20px"
          bgGradient={gradients.primary}
          opacity={0.2}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <MotionBox
          position="absolute"
          bottom="30%"
          left="5%"
          width="80px"
          height="80px"
          borderRadius="full"
          bgGradient={gradients.success}
          opacity={0.2}
          animate={{
            y: [0, 40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <Container maxW="7xl" position="relative" zIndex={1}>
          <VStack spacing={8} textAlign="center">
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Heading
                fontSize={{ base: '4xl', md: '6xl', lg: '8xl' }}
                fontWeight="black"
                lineHeight="1.1"
                color="white"
                textShadow="0 0 60px rgba(255, 255, 255, 0.3)"
              >
                The Future of
                <br />
                <Text
                  as="span"
                  bgGradient="linear(to-r, #00F5A0, #00D9FF)"
                  bgClip="text"
                >
                  P2P Commerce
                </Text>
              </Heading>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Text
                fontSize={{ base: 'lg', md: 'xl', lg: '2xl' }}
                maxW="3xl"
                color="whiteAlpha.900"
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
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Stack
                direction={{ base: 'column', sm: 'row' }}
                spacing={4}
                mt={6}
              >
                <GradientButton
                  as={RouterLink}
                  to="/marketplace"
                  variant="neon"
                  size="lg"
                  rightIcon={<Icon as={FiArrowRight} />}
                >
                  Explore Marketplace
                </GradientButton>
                <GradientButton
                  as={RouterLink}
                  to="/signup"
                  variant="secondary"
                  size="lg"
                >
                  Get Started Free
                </GradientButton>
              </Stack>
            </MotionBox>

            {/* Stats Grid */}
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              mt={16}
              w="full"
            >
              <Grid
                templateColumns={{
                  base: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)',
                }}
                gap={8}
              >
                {stats.map((stat, index) => (
                  <GridItem key={index}>
                    <ModernCard noHover>
                      <VStack spacing={2}>
                        <Text
                          fontSize={{ base: '3xl', md: '4xl' }}
                          fontWeight="black"
                          bgGradient="linear(to-r, #00F5A0, #00D9FF)"
                          bgClip="text"
                        >
                          {stat.value}
                        </Text>
                        <Text
                          fontSize="sm"
                          color={textColor}
                          textTransform="uppercase"
                          letterSpacing="wider"
                          fontWeight="600"
                        >
                          {stat.label}
                        </Text>
                      </VStack>
                    </ModernCard>
                  </GridItem>
                ))}
              </Grid>
            </MotionBox>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} bg={sectionBg1}>
        <Container maxW="7xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Heading
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="black"
                  bgGradient={gradients.text.cosmic}
                  bgClip="text"
                >
                  Why Choose Blockrent?
                </Heading>
              </MotionBox>
              <Text fontSize="lg" color={textColor} maxW="2xl" fontWeight="500">
                Built on blockchain technology for security, transparency, and
                efficiency
              </Text>
            </VStack>

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
                <MotionFlex
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ModernCard w="full">
                    <VStack align="start" spacing={4}>
                      <Box
                        p={4}
                        borderRadius="xl"
                        bgGradient={feature.gradient}
                        boxShadow="0 8px 24px rgba(0, 0, 0, 0.15)"
                      >
                        <Icon as={feature.icon} boxSize={7} color="white" />
                      </Box>
                      <Heading size="md" fontWeight="bold">
                        {feature.title}
                      </Heading>
                      <Text color={textColor} lineHeight="tall">
                        {feature.description}
                      </Text>
                    </VStack>
                  </ModernCard>
                </MotionFlex>
              ))}
            </Grid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={20} bg={sectionBg2}>
        <Container maxW="5xl">
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Box
              p={{ base: 8, md: 16 }}
              bgGradient={gradients.cosmic}
              borderRadius="3xl"
              position="relative"
              overflow="hidden"
              boxShadow="0 20px 60px rgba(0, 0, 0, 0.3)"
            >
              {/* Floating orbs */}
              <MotionBox
                position="absolute"
                top="-20%"
                right="-10%"
                width="300px"
                height="300px"
                borderRadius="full"
                bg="whiteAlpha.200"
                filter="blur(60px)"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <VStack spacing={6} position="relative" zIndex={1}>
                <Heading
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="black"
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
                >
                  Join thousands of users trading securely on the blockchain
                </Text>
                <HStack spacing={4} mt={4} flexWrap="wrap" justify="center">
                  <GradientButton
                    as={RouterLink}
                    to="/signup"
                    variant="neon"
                    size="lg"
                    rightIcon={<Icon as={FiArrowRight} />}
                  >
                    Create Account
                  </GradientButton>
                  <GradientButton
                    as={RouterLink}
                    to="/marketplace"
                    variant="secondary"
                    size="lg"
                  >
                    Browse Listings
                  </GradientButton>
                </HStack>
              </VStack>
            </Box>
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
