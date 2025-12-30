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
  FiMail,
  FiArrowRight,
  FiUserPlus,
  FiCheckCircle,
} from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const MotionBox = motion(Box);

const SignUpPage = () => {
  const { isAuthenticated, login } = useAuth();
  const { account, isConnected, connectWallet } = useWeb3();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Connect Wallet, 2: Create Profile
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
        description: 'Please sign the message to create your account',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Don't advance to step 2 here - let useEffect handle it when isConnected becomes true
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(error.message || 'Failed to connect wallet');
      setStep(1); // Reset to step 1 on error
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

      // Sign in with wallet - this will create account if it doesn't exist
      await login(account);

      toast({
        title: 'Account created!',
        description: 'Welcome to Blockrent',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');

      // If wallet connection issue, reset to step 1
      if (
        error.message?.includes('wallet') ||
        error.message?.includes('MetaMask')
      ) {
        setStep(1);
      }

      toast({
        title: 'Registration Failed',
        description: error.message || 'Registration failed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      icon: FaWallet,
      title: 'Connect Wallet',
      description: 'Link your MetaMask wallet',
    },
    {
      icon: FiCheckCircle,
      title: 'Sign Message',
      description: 'Authenticate securely',
    },
    {
      icon: FiUserPlus,
      title: 'Start Trading',
      description: 'Begin your journey',
    },
  ];

  return (
    <Box minH="100vh" display="flex">
      {/* Left Side - Branding */}
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
          left="-20%"
          width="600px"
          height="600px"
          borderRadius="full"
          bg="whiteAlpha.200"
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

        <VStack spacing={12} p={12} position="relative" zIndex={1}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading
              fontSize="5xl"
              color="white"
              textAlign="center"
              fontWeight="900"
            >
              Join 10,000+ Users
            </Heading>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Text
              fontSize="xl"
              color="whiteAlpha.900"
              textAlign="center"
              maxW="md"
            >
              Experience the future of commerce with blockchain-powered
              transactions
            </Text>
          </MotionBox>

          <VStack spacing={6} align="stretch" w="full" maxW="md" mt={8}>
            {steps.map((step, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              >
                <HStack
                  spacing={4}
                  p={4}
                  borderRadius="xl"
                  bg="whiteAlpha.200"
                  backdropFilter="blur(10px)"
                >
                  <Box p={3} borderRadius="lg" bg="whiteAlpha.300">
                    <Icon as={step.icon} boxSize={6} color="white" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontSize="lg" fontWeight="700">
                      {step.title}
                    </Text>
                    <Text color="whiteAlpha.800" fontSize="sm">
                      {step.description}
                    </Text>
                  </VStack>
                </HStack>
              </MotionBox>
            ))}
          </VStack>
        </VStack>
      </Box>

      {/* Right Side - Form */}
      <Flex flex={1} align="center" justify="center" p={8}>
        <Container maxW="md">
          <MotionBox
            initial={{ opacity: 0, x: 20 }}
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
                  Create account
                </Heading>
                <Text fontSize="lg" color={textColor}>
                  Start your decentralized trading journey
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
                <VStack spacing={5}>
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
                          Connect your MetaMask wallet to create your account.
                          No passwords needed - just sign with your wallet!
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
                        mt={2}
                      >
                        Connect MetaMask
                      </Button>
                    </VStack>
                  )}

                  {/* Step 2: Create Account */}
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
                        <Icon
                          as={FiCheckCircle}
                          boxSize={10}
                          color="green.600"
                        />
                      </Box>
                      <VStack spacing={3}>
                        <Heading size="md" textAlign="center">
                          Create Your Account
                        </Heading>
                        <Text
                          fontSize="sm"
                          color={textColor}
                          textAlign="center"
                        >
                          Wallet connected! Click below to sign a message and
                          create your account.
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
                        loadingText="Creating account..."
                        rightIcon={<Icon as={FiArrowRight} />}
                        mt={2}
                      >
                        Sign & Create Account
                      </Button>
                    </VStack>
                  )}

                  <Divider />

                  <HStack justify="center" spacing={2}>
                    <Text fontSize="sm" color={textColor}>
                      Already have an account?
                    </Text>
                    <Button
                      as={RouterLink}
                      to="/signin"
                      variant="link"
                      size="sm"
                      color="brand.500"
                    >
                      Sign In
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </MotionBox>
        </Container>
      </Flex>
    </Box>
  );
};

export default SignUpPage;
