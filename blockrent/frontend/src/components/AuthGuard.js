import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Icon,
  useColorModeValue,
  HStack,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { FaWallet, FaLock } from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

/**
 * AuthGuard Component
 *
 * Protects routes that require authentication
 * Shows progressive authentication flow:
 * 1. Sign In/Up (required)
 * 2. Connect Wallet (optional)
 * 3. Access protected content
 */
const AuthGuard = ({
  children,
  requireAuth = false,
  requireWallet = false,
}) => {
  const { isConnected, connectWallet } = useWeb3();
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const cardBg = useColorModeValue('white', 'gray.800');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const loadingTextColor = useColorModeValue('gray.600', 'gray.400');
  const bgOpacity = useColorModeValue(0.1, 0.15);
  const infoTextBrandColor = useColorModeValue('gray.600', 'gray.300');
  const infoBgColor = useColorModeValue('blue.50', 'whiteAlpha.100');
  const metaMaskTextColor = useColorModeValue('gray.500', 'gray.500');

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      navigate('/signin', { replace: true, state: { from: location } });
    }
  }, [requireAuth, isAuthenticated, isLoading, navigate, location]);

  // Show loading spinner while checking authentication
  if (requireAuth && isLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color={loadingTextColor}>Checking authentication...</Text>
        </VStack>
      </Box>
    );
  }

  // If authentication is required but not authenticated
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // If both auth and wallet are required, check both
  if (requireAuth && requireWallet && isAuthenticated && !isConnected) {
    return (
      <Box minH="100vh" position="relative" overflow="hidden">
        {/* Animated Background */}
        <MotionBox
          position="absolute"
          top="-20%"
          right="-10%"
          width="600px"
          height="600px"
          borderRadius="full"
          bgGradient="radial(brand.500, transparent)"
          filter="blur(100px)"
          opacity={bgOpacity}
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

        <Container maxW="container.lg" py={20} position="relative" zIndex={1}>
          <VStack spacing={8} align="center">
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              bg={cardBg}
              backdropFilter="blur(10px)"
              p={8}
              borderRadius="3xl"
              boxShadow="2xl"
              border="2px solid"
              borderColor={borderColor}
              textAlign="center"
              maxW="550px"
              w="full"
            >
              <CardBody>
                <VStack spacing={6}>
                  <Box
                    w="24"
                    h="24"
                    borderRadius="full"
                    bgGradient="linear(135deg, brand.500, brand.purple.500)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="glow"
                  >
                    <Icon as={FaWallet} boxSize={12} color="white" />
                  </Box>

                  <VStack spacing={3}>
                    <Heading
                      size="xl"
                      fontWeight="900"
                      bgGradient="linear(135deg, brand.500, brand.purple.500)"
                      bgClip="text"
                    >
                      Connect Your Wallet
                    </Heading>
                    <Text
                      color={infoTextBrandColor}
                      fontSize="lg"
                      lineHeight="tall"
                    >
                      To access this page, you need to connect your MetaMask
                      wallet. This ensures secure transactions and identity
                      verification on the blockchain.
                    </Text>
                  </VStack>

                  <HStack spacing={4} pt={2}>
                    <Box p={3} bg={infoBgColor} borderRadius="lg">
                      <Text fontSize="sm" fontWeight="600" color="brand.500">
                        🔒 Secure
                      </Text>
                    </Box>
                    <Box p={3} bg={infoBgColor} borderRadius="lg">
                      <Text fontSize="sm" fontWeight="600" color="brand.500">
                        ⚡ Fast
                      </Text>
                    </Box>
                    <Box p={3} bg={infoBgColor} borderRadius="lg">
                      <Text fontSize="sm" fontWeight="600" color="brand.500">
                        🌐 Decentralized
                      </Text>
                    </Box>
                  </HStack>

                  <Button
                    onClick={connectWallet}
                    size="lg"
                    leftIcon={<Icon as={FaWallet} />}
                    rightIcon={<Icon as={FiArrowRight} />}
                    bgGradient="linear(135deg, brand.500, brand.purple.500)"
                    color="white"
                    fontWeight="700"
                    px={8}
                    py={7}
                    fontSize="lg"
                    borderRadius="xl"
                    w="full"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'glow',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.3s"
                  >
                    Connect Wallet
                  </Button>

                  <Text fontSize="xs" color={metaMaskTextColor}>
                    Don&apos;t have MetaMask?{' '}
                    <Text
                      as="a"
                      href="https://metamask.io"
                      target="_blank"
                      color="brand.500"
                      fontWeight="600"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      Install it here
                    </Text>
                  </Text>
                </VStack>
              </CardBody>
            </MotionCard>
          </VStack>
        </Container>
      </Box>
    );
  }

  // If wallet connection is required but not connected (without auth requirement)
  if (requireWallet && !isConnected) {
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
              maxW="500px"
            >
              <CardBody>
                <VStack spacing={6}>
                  <Box
                    w="20"
                    h="20"
                    borderRadius="full"
                    bg="blue.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FaWallet} boxSize={10} color="blue.600" />
                  </Box>
                  <VStack spacing={3}>
                    <Heading size="lg" color="gray.700">
                      Connect Your Wallet
                    </Heading>
                    <Text color="gray.600" textAlign="center">
                      This page requires a wallet connection to continue. Please
                      connect your MetaMask wallet to access this feature.
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={connectWallet}
                    leftIcon={<Icon as={FaWallet} />}
                    rightIcon={<Icon as={FiArrowRight} />}
                    bgGradient="linear(to-r, blue.500, blue.600)"
                    _hover={{
                      bgGradient: 'linear(to-r, blue.600, blue.700)',
                      transform: 'translateY(-2px)',
                      shadow: 'lg',
                    }}
                    transition="all 0.2s"
                    borderRadius="xl"
                    px={8}
                  >
                    Connect Wallet
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </Center>
        </Container>
      </Box>
    );
  }

  // If all requirements are met, render the protected content
  return children;
};

export default AuthGuard;
