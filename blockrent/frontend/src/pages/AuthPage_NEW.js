import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Icon,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  useColorModeValue,
  Progress,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import {
  FaWallet,
  FaUser,
  FaEnvelope,
  FaKey,
  FaCheck,
  FaArrowRight,
} from 'react-icons/fa';
import { Navigate } from 'react-router-dom';

import GradientButton from '../components/GradientButton';
import ModernCard from '../components/ModernCard';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import useModernToast from '../hooks/useModernToast';
import gradients from '../theme/gradients';

const MotionBox = motion(Box);

const AuthPage = () => {
  const { account, isConnected, connectWallet, disconnect, provider } =
    useWeb3();
  const { isAuthenticated, login, isLoading, updateProfile } = useAuth();
  const showToast = useModernToast();

  const [currentStep, setCurrentStep] = useState(isConnected ? 2 : 1);
  const [isLinking, setIsLinking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
  });
  const [error, setError] = useState('');

  // Color mode values
  const bgGradient = useColorModeValue(
    gradients.subtle.blue,
    gradients.dark.background
  );
  const textColor = useColorModeValue('gray.800', 'gray.50');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

  // Check for pending link token
  useEffect(() => {
    const pendingToken = localStorage.getItem('pendingLinkToken');
    if (pendingToken) {
      setIsLinking(true);
    }
  }, []);

  // Auto-advance steps
  useEffect(() => {
    if (isConnected && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [isConnected, currentStep]);

  // Redirect if authenticated
  if (isAuthenticated && !isLinking && !isRegistering) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const handleAuth = async () => {
    if (!isConnected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    setError('');
    try {
      if (isLinking) {
        await handleLinkWallet();
      } else {
        const result = await login();
        if (!result.user.username) {
          setIsRegistering(true);
          setCurrentStep(3);
          return;
        }
        showToast({
          status: 'success',
          title: 'Welcome back!',
          description: 'Successfully authenticated',
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.displayName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await updateProfile(formData);
      setIsRegistering(false);
      setCurrentStep(4);
      showToast({
        status: 'success',
        title: 'Profile Created',
        description: 'Welcome to Blockrent!',
      });
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    }
  };

  const handleLinkWallet = async () => {
    const token = localStorage.getItem('pendingLinkToken');
    if (!token) {
      setError('Link token expired or missing');
      setIsLinking(false);
      return;
    }

    try {
      const nonceResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/nonce`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: account }),
        }
      );

      const { nonce, message } = await nonceResponse.json();
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);

      const confirmResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/confirm-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            newWalletAddress: account,
            signature,
            message,
            nonce,
          }),
        }
      );

      if (!confirmResponse.ok) {
        const err = await confirmResponse.json();
        throw new Error(err.message || 'Failed to link wallet');
      }

      showToast({
        status: 'success',
        title: 'Success!',
        description: 'Wallet linked successfully',
      });

      localStorage.removeItem('pendingLinkToken');
      setIsLinking(false);
      await login(account);
    } finally {
      setIsLinking(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Connect Wallet',
      description: 'Connect your MetaMask wallet',
    },
    {
      number: 2,
      title: 'Sign Message',
      description: isLinking ? 'Confirm wallet linking' : 'Verify ownership',
    },
    {
      number: 3,
      title: isRegistering ? 'Create Profile' : 'Welcome!',
      description: isRegistering
        ? 'Set up your account'
        : 'Access your dashboard',
    },
  ];

  return (
    <Box
      bgGradient={bgGradient}
      minH="100vh"
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
        opacity={0.1}
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
        opacity={0.1}
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

      <Container maxW="container.lg" py={12} position="relative" zIndex={1}>
        <VStack spacing={8}>
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={4} textAlign="center">
              <Heading
                size="2xl"
                color={textColor}
                bgGradient={gradients.text.cosmic}
                bgClip="text"
              >
                {isLinking
                  ? 'Link New Wallet'
                  : isRegistering
                    ? 'Create Your Profile'
                    : 'Welcome to Blockrent'}
              </Heading>
              <Text fontSize="lg" color={secondaryTextColor} maxW="500px">
                {isLinking
                  ? 'Connect the wallet you want to link to your account.'
                  : isRegistering
                    ? 'Tell us a bit about yourself to get started.'
                    : 'Connect your wallet to access the decentralized marketplace.'}
              </Text>
            </VStack>
          </MotionBox>

          {/* Progress Steps */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            w="full"
            maxW="600px"
          >
            <ModernCard>
              <VStack spacing={6}>
                <HStack spacing={4} w="full" justify="space-between">
                  {steps.map((step) => (
                    <VStack key={step.number} spacing={2} flex="1">
                      <Box
                        w="12"
                        h="12"
                        borderRadius="full"
                        bgGradient={
                          currentStep > step.number
                            ? gradients.success
                            : currentStep === step.number
                              ? gradients.primary
                              : 'gray.300'
                        }
                        color="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="bold"
                        fontSize="lg"
                        boxShadow={currentStep >= step.number ? 'lg' : 'none'}
                      >
                        {currentStep > step.number ? (
                          <Icon as={FaCheck} boxSize={5} />
                        ) : (
                          step.number
                        )}
                      </Box>
                      <VStack spacing={1} textAlign="center">
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>
                          {step.title}
                        </Text>
                        <Text fontSize="xs" color={secondaryTextColor}>
                          {step.description}
                        </Text>
                      </VStack>
                    </VStack>
                  ))}
                </HStack>
                <Progress
                  value={((currentStep - 1) / (steps.length - 1)) * 100}
                  size="sm"
                  w="full"
                  borderRadius="full"
                  bgGradient={gradients.primary}
                  sx={{
                    '& > div': {
                      bgGradient: gradients.primary,
                    },
                  }}
                />
              </VStack>
            </ModernCard>
          </MotionBox>

          {/* Main Auth Card */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            w="full"
            maxW="500px"
          >
            <ModernCard>
              <VStack spacing={6}>
                {/* Step 1: Connect Wallet */}
                {currentStep === 1 && (
                  <VStack spacing={6}>
                    <Box
                      w="24"
                      h="24"
                      borderRadius="2xl"
                      bgGradient={gradients.primary}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 8px 24px rgba(0, 102, 255, 0.3)"
                    >
                      <Icon as={FaWallet} boxSize={12} color="white" />
                    </Box>
                    <VStack spacing={3}>
                      <Heading size="lg" color={textColor}>
                        Connect Your Wallet
                      </Heading>
                      <Text color={secondaryTextColor} textAlign="center">
                        Connect your wallet to get started. We support MetaMask,
                        Coinbase Wallet, and more.
                      </Text>
                    </VStack>
                    <GradientButton
                      variant="primary"
                      size="lg"
                      onClick={handleConnectWallet}
                      leftIcon={<Icon as={FaWallet} />}
                      rightIcon={<Icon as={FaArrowRight} />}
                      w="full"
                    >
                      Connect Wallet
                    </GradientButton>
                  </VStack>
                )}

                {/* Step 2: Sign Message */}
                {currentStep === 2 && (
                  <VStack spacing={6}>
                    <Box
                      w="24"
                      h="24"
                      borderRadius="2xl"
                      bgGradient={gradients.success}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 8px 24px rgba(16, 185, 129, 0.3)"
                    >
                      <Icon as={FaKey} boxSize={12} color="white" />
                    </Box>
                    <VStack spacing={3}>
                      <Heading size="lg" color={textColor}>
                        Verify Ownership
                      </Heading>
                      <Text color={secondaryTextColor} textAlign="center">
                        Please sign the message in your wallet to verify you own
                        this account.
                      </Text>
                    </VStack>

                    {/* Connected Wallet Info */}
                    <ModernCard variant="solid" noHover w="full">
                      <HStack spacing={4} justify="space-between">
                        <HStack spacing={3}>
                          <Box
                            p={2}
                            bgGradient={gradients.success}
                            borderRadius="lg"
                            color="white"
                          >
                            <Icon as={FaCheck} boxSize={4} />
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color={textColor}
                            >
                              Wallet Connected
                            </Text>
                            <Text
                              fontSize="xs"
                              color={secondaryTextColor}
                              fontFamily="mono"
                            >
                              {account?.slice(0, 6)}...{account?.slice(-4)}
                            </Text>
                          </VStack>
                        </HStack>
                        <GradientButton
                          variant="error"
                          size="sm"
                          onClick={disconnect}
                        >
                          Change
                        </GradientButton>
                      </HStack>
                    </ModernCard>

                    {error && (
                      <Alert status="error" borderRadius="xl">
                        <AlertIcon />
                        <Text fontSize="sm">{error}</Text>
                      </Alert>
                    )}

                    <GradientButton
                      variant="success"
                      size="lg"
                      onClick={handleAuth}
                      isLoading={isLoading}
                      leftIcon={<Icon as={FaKey} />}
                      rightIcon={<Icon as={FaArrowRight} />}
                      w="full"
                    >
                      {isLinking ? 'Confirm Link' : 'Sign & Continue'}
                    </GradientButton>
                  </VStack>
                )}

                {/* Step 3: Registration */}
                {currentStep === 3 && isRegistering && (
                  <VStack
                    spacing={6}
                    as="form"
                    onSubmit={handleRegistration}
                    w="full"
                  >
                    <Box
                      w="24"
                      h="24"
                      borderRadius="2xl"
                      bgGradient={gradients.secondary}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 8px 24px rgba(107, 70, 193, 0.3)"
                    >
                      <Icon as={FaUser} boxSize={12} color="white" />
                    </Box>
                    <VStack spacing={3}>
                      <Heading size="lg" color={textColor}>
                        Create Profile
                      </Heading>
                      <Text color={secondaryTextColor} textAlign="center">
                        Choose a username and display name to identify yourself
                        on the marketplace.
                      </Text>
                    </VStack>

                    <FormControl isRequired>
                      <FormLabel color={textColor}>Display Name</FormLabel>
                      <Input
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        placeholder="e.g. John Doe"
                        size="lg"
                        borderRadius="xl"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel color={textColor}>Username</FormLabel>
                      <Input
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="e.g. johndoe"
                        size="lg"
                        borderRadius="xl"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel color={textColor}>Email (Optional)</FormLabel>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. john@example.com"
                        size="lg"
                        borderRadius="xl"
                      />
                    </FormControl>

                    {error && (
                      <Alert status="error" borderRadius="xl">
                        <AlertIcon />
                        <Text fontSize="sm">{error}</Text>
                      </Alert>
                    )}

                    <GradientButton
                      type="submit"
                      variant="secondary"
                      size="lg"
                      isLoading={isLoading}
                      rightIcon={<Icon as={FaArrowRight} />}
                      w="full"
                    >
                      Complete Setup
                    </GradientButton>
                  </VStack>
                )}

                {/* Step 4: Success */}
                {(currentStep === 4 ||
                  (currentStep === 3 && !isRegistering)) && (
                  <VStack spacing={6}>
                    <Box
                      w="24"
                      h="24"
                      borderRadius="2xl"
                      bgGradient={gradients.success}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 8px 24px rgba(16, 185, 129, 0.3)"
                    >
                      <Icon as={FaCheck} boxSize={12} color="white" />
                    </Box>
                    <VStack spacing={3}>
                      <Heading size="lg" color={textColor}>
                        Welcome to Blockrent!
                      </Heading>
                      <Text color={secondaryTextColor} textAlign="center">
                        Your account has been created successfully. You can now
                        access all features of the marketplace.
                      </Text>
                    </VStack>
                    <GradientButton
                      as="a"
                      href="/dashboard"
                      variant="success"
                      size="lg"
                      rightIcon={<Icon as={FaArrowRight} />}
                      w="full"
                    >
                      Go to Dashboard
                    </GradientButton>
                  </VStack>
                )}
              </VStack>
            </ModernCard>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

export default AuthPage;
