import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  useToast,
  useColorModeValue,
  Icon,
  Alert,
  AlertIcon,
  Divider,
  Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { FaWallet } from 'react-icons/fa';
import {
  FiUser,
  FiLock,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiShield,
  FiZap,
  FiCheck,
} from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const MotionBox = motion(Box);

const SignInPage = () => {
  const { login, isAuthenticated } = useAuth();
  const { account, isConnected, connectWallet } = useWeb3();
  const [step, setStep] = useState(1); // 1: Connect, 2: Sign
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isConnected && account && step === 1) {
      setStep(2);
    } else if ((!isConnected || !account) && step === 2) {
      // If connection lost while on step 2, go back to step 1
      setStep(1);
      setError('Wallet connection lost. Please reconnect.');
    }
  }, [isConnected, account, step]);

  const cardBg = useColorModeValue('white', 'whiteAlpha.100');
  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const handleConnectWallet = async () => {
    setError('');
    setIsLoading(true);

    try {
      const connected = await connectWallet();
      if (!connected) {
        throw new Error('Failed to connect wallet. Please try again.');
      }
      toast({
        title: 'Wallet Connected!',
        description: 'Please sign the message to authenticate',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Let useEffect handle step advancement when isConnected becomes true
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(error.message || 'Failed to connect wallet');
      setStep(1);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isConnected || !account) {
        throw new Error('Please connect your wallet first');
      }

      // Verify wallet is still connected
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      if (accounts.length === 0 || !accounts.includes(account)) {
        throw new Error('Wallet disconnected. Please reconnect your wallet.');
      }

      await login(account);

      toast({
        title: 'Welcome back!',
        description: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');

      // If wallet connection issue, reset to step 1
      if (
        error.message?.includes('wallet') ||
        error.message?.includes('MetaMask')
      ) {
        setStep(1);
      }

      toast({
        title: 'Authentication Failed',
        description: error.message || 'Authentication failed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: FiShield, text: 'Secure blockchain authentication' },
    { icon: FiZap, text: 'Lightning-fast transactions' },
    { icon: FiCheck, text: 'Trusted by 10,000+ users' },
  ];

  return (
    <Box minH="100vh" display="flex">
      {/* Left Side - Form */}
      <Flex flex={1} align="center" justify="center" p={8}>
        <Container maxW="md">
          <MotionBox
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <VStack spacing={8} align="stretch">
              {/* Header */}
              <VStack spacing={2} align="start">
                <Text
                  fontSize="3xl"
                  fontWeight="900"
                  bgGradient={useColorModeValue(
                    'linear(135deg, #0052CC, #5C00CC)',
                    'linear(135deg, brand.500, brand.purple.500)'
                  )}
                  bgClip="text"
                >
                  Blockrent
                </Text>
                <Heading fontSize={{ base: '3xl', md: '4xl' }} fontWeight="900">
                  Welcome back
                </Heading>
                <Text fontSize="lg" color={textColor}>
                  Sign in to continue to your account
                </Text>
              </VStack>

              {/* Form */}
              <Box
                as="form"
                onSubmit={handleSubmit}
                bg={cardBg}
                backdropFilter="blur(10px)"
                p={8}
                borderRadius="2xl"
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.200')}
                boxShadow="xl"
              >
                <VStack spacing={6}>
                  {error && (
                    <Alert status="error" borderRadius="xl">
                      <AlertIcon />
                      <Text fontSize="sm">{error}</Text>
                    </Alert>
                  )}

                  {/* Step 1: Connect Wallet */}
                  {step === 1 && (
                    <VStack spacing={5} w="full">
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
                        <Heading size="md" textAlign="center">
                          Connect Your Wallet
                        </Heading>
                        <Text
                          fontSize="sm"
                          color={textColor}
                          textAlign="center"
                        >
                          Connect your MetaMask wallet to sign in. No passwords
                          needed!
                        </Text>
                      </VStack>
                      <Button
                        onClick={handleConnectWallet}
                        w="full"
                        size="lg"
                        isLoading={isLoading}
                        loadingText="Connecting..."
                        leftIcon={<Icon as={FaWallet} />}
                        rightIcon={<Icon as={FiArrowRight} />}
                      >
                        Connect MetaMask
                      </Button>
                    </VStack>
                  )}

                  {/* Step 2: Sign Message */}
                  {step === 2 && (
                    <VStack spacing={5} w="full">
                      <Box
                        w="20"
                        h="20"
                        borderRadius="full"
                        bg="green.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiCheck} boxSize={10} color="green.600" />
                      </Box>
                      <VStack spacing={3}>
                        <Heading size="md" textAlign="center">
                          Sign In
                        </Heading>
                        <Text
                          fontSize="sm"
                          color={textColor}
                          textAlign="center"
                        >
                          Wallet connected! Click below to sign a message and
                          authenticate.
                        </Text>
                      </VStack>

                      {/* Connected Wallet Info */}
                      <Alert status="success" borderRadius="xl">
                        <AlertIcon />
                        <VStack align="start" spacing={0} flex="1">
                          <Text fontSize="sm" fontWeight="semibold">
                            Wallet Connected
                          </Text>
                          <Text fontSize="xs" fontFamily="mono">
                            {account?.slice(0, 6)}...{account?.slice(-4)}
                          </Text>
                        </VStack>
                      </Alert>

                      <Button
                        type="submit"
                        w="full"
                        size="lg"
                        isLoading={isLoading}
                        loadingText="Signing in..."
                        rightIcon={<Icon as={FiArrowRight} />}
                      >
                        Sign & Authenticate
                      </Button>
                    </VStack>
                  )}

                  <Divider />

                  <HStack justify="center" spacing={2}>
                    <Text fontSize="sm" color={textColor}>
                      Don&apos;t have an account?
                    </Text>
                    <Button
                      as={RouterLink}
                      to="/signup"
                      variant="link"
                      size="sm"
                      color="brand.500"
                    >
                      Sign Up
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </MotionBox>
        </Container>
      </Flex>

      {/* Right Side - Branding */}
      <Box
        flex={1}
        bgGradient={useColorModeValue(
          'linear(135deg, #0052CC, #5C00CC)',
          'linear(135deg, brand.500, brand.purple.500)'
        )}
        display={{ base: 'none', lg: 'flex' }}
        alignItems="center"
        justifyContent="center"
        position="relative"
        overflow="hidden"
      >
        {/* Animated Background */}
        <MotionBox
          position="absolute"
          top="-50%"
          right="-20%"
          width="600px"
          height="600px"
          borderRadius="full"
          bg="whiteAlpha.200"
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

        <VStack spacing={8} p={12} position="relative" zIndex={1}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Heading
              fontSize="5xl"
              color="white"
              textAlign="center"
              fontWeight="900"
            >
              Start Your Journey
            </Heading>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Text
              fontSize="xl"
              color="whiteAlpha.900"
              textAlign="center"
              maxW="md"
            >
              Join the decentralized marketplace revolution. Trade with
              confidence on the blockchain.
            </Text>
          </MotionBox>

          <VStack spacing={4} align="start" mt={8}>
            {features.map((feature, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                <HStack spacing={4}>
                  <Box
                    p={2}
                    borderRadius="lg"
                    bg="whiteAlpha.200"
                    backdropFilter="blur(10px)"
                  >
                    <Icon as={feature.icon} boxSize={5} color="white" />
                  </Box>
                  <Text color="white" fontSize="lg" fontWeight="500">
                    {feature.text}
                  </Text>
                </HStack>
              </MotionBox>
            ))}
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default SignInPage;
