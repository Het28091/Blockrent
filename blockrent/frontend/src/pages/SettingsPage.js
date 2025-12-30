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
  Textarea,
  useColorModeValue,
  useToast,
  Avatar,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Icon,
  Switch,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import {
  FiSave,
  FiUser,
  FiMail,
  FiShield,
  FiBell,
  FiLogOut,
  FiPlus,
  FiSettings,
} from 'react-icons/fi';

import GradientButton from '../components/GradientButton';
import ModernCard from '../components/ModernCard';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import gradients from '../theme/gradients';

const MotionBox = motion(Box);

const SettingsPage = () => {
  const { user, updateProfile, logout, apiRequest, login } = useAuth();
  const { account, disconnect, connectWallet, provider } = useWeb3();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    displayName: user?.displayName || '',
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Handle wallet linking flow
  useEffect(() => {
    const checkLinking = async () => {
      const pendingToken = localStorage.getItem('pendingLinkToken');
      if (isLinking && pendingToken && account) {
        // Check if the connected account is different from the user's primary wallet
        // Note: user.walletAddress is the primary wallet
        if (account.toLowerCase() !== user?.walletAddress?.toLowerCase()) {
          // Ready to link!
          try {
            await confirmLinkWallet(pendingToken);
          } catch (error) {
            toast({
              title: 'Linking failed',
              description: error.message,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            setIsLinking(false);
            localStorage.removeItem('pendingLinkToken');
          }
        }
      }
    };

    checkLinking();
  }, [account, isLinking, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(formData);
      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    disconnect();
    window.location.href = '/';
  };

  const startLinkWallet = async () => {
    try {
      setIsLoading(true);
      // 1. Get link token
      const response = await apiRequest(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/link-token`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to generate link token');

      const data = await response.json();
      localStorage.setItem('pendingLinkToken', data.token);

      setIsLinking(true);
      onOpen(); // Show modal instructions
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLinkWallet = async (token) => {
    try {
      toast({
        title: 'Linking wallet...',
        description: 'Please sign the message to confirm ownership.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      // 1. Get nonce for new wallet (public endpoint)
      const nonceResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/nonce`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: account }),
        }
      );

      const { nonce, message } = await nonceResponse.json();

      // 2. Sign message
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);

      // 3. Confirm link
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

      toast({
        title: 'Success!',
        description:
          'Wallet linked successfully. You can now login with this wallet.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Cleanup
      localStorage.removeItem('pendingLinkToken');
      setIsLinking(false);
      onClose();

      // Re-login with the new wallet to refresh session/context
      await login(account);
    } finally {
      setIsLinking(false);
    }
  };

  const handleSwitchWallet = async () => {
    // Trigger wallet switch/connect
    // This will update 'account' and trigger the useEffect
    await connectWallet();
  };

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

      <Container maxW="container.md" py={12} position="relative" zIndex={1}>
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
                  <Icon as={FiSettings} boxSize={8} color="white" />
                </Box>
                <Heading
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="900"
                  color={useColorModeValue('gray.800', 'gray.50')}
                >
                  Settings
                </Heading>
              </HStack>
              <Text
                fontSize="xl"
                color={useColorModeValue('gray.600', 'gray.300')}
                fontWeight="500"
              >
                Manage your account and preferences
              </Text>
            </VStack>
          </MotionBox>

          {/* Profile Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ModernCard>
              <HStack spacing={4} mb={6}>
                <Icon as={FiUser} boxSize={6} color="purple.500" />
                <Heading
                  size="md"
                  color={useColorModeValue('gray.800', 'gray.50')}
                >
                  Profile Information
                </Heading>
              </HStack>
              <VStack spacing={6} as="form" onSubmit={handleSubmit}>
                <HStack spacing={6} w="full" align="center">
                  <Avatar
                    size="xl"
                    name={formData.displayName || formData.username}
                    bg="brand.500"
                  />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" fontSize="lg">
                      {formData.displayName || 'Anonymous User'}
                    </Text>
                    <Badge colorScheme="green">Verified Wallet</Badge>
                  </VStack>
                </HStack>

                <Divider />

                <FormControl>
                  <FormLabel>Display Name</FormLabel>
                  <Input
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Enter your display name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Username</FormLabel>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="@username"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Bio</FormLabel>
                  <Textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                  />
                </FormControl>

                <GradientButton
                  type="submit"
                  variant="cosmic"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  leftIcon={<Icon as={FiSave} />}
                >
                  Save Changes
                </GradientButton>
              </VStack>
            </ModernCard>
          </MotionBox>

          {/* Wallet Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <ModernCard>
              <HStack spacing={4} mb={6}>
                <Icon as={FiShield} boxSize={6} color="purple.500" />
                <Heading
                  size="md"
                  color={useColorModeValue('gray.800', 'gray.50')}
                >
                  Wallet & Security
                </Heading>
              </HStack>
              <VStack spacing={4} align="stretch">
                <Box
                  p={4}
                  bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                  borderRadius="lg"
                >
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Connected Wallet
                  </Text>
                  <Text fontFamily="mono" fontWeight="bold" fontSize="md">
                    {account}
                  </Text>
                </Box>

                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Link Another Wallet</Text>
                    <Text fontSize="sm" color="gray.500">
                      Login to this account with other wallets
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    onClick={startLinkWallet}
                    leftIcon={<Icon as={FiPlus} />}
                  >
                    Link Wallet
                  </Button>
                </HStack>

                <Divider />

                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Disconnect Wallet</Text>
                    <Text fontSize="sm" color="gray.500">
                      Sign out of your current session
                    </Text>
                  </VStack>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={handleLogout}
                    leftIcon={<Icon as={FiLogOut} />}
                  >
                    Disconnect
                  </Button>
                </HStack>
              </VStack>
            </ModernCard>
          </MotionBox>

          {/* Notifications Section */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <ModernCard>
              <HStack spacing={4} mb={6}>
                <Icon as={FiBell} boxSize={6} color="purple.500" />
                <Heading
                  size="md"
                  color={useColorModeValue('gray.800', 'gray.50')}
                >
                  Notifications
                </Heading>
              </HStack>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Email Notifications</Text>
                    <Text fontSize="sm" color="gray.500">
                      Receive updates about your listings
                    </Text>
                  </VStack>
                  <Switch colorScheme="purple" defaultChecked />
                </HStack>
                <Divider />
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">Marketing Emails</Text>
                    <Text fontSize="sm" color="gray.500">
                      Receive news and special offers
                    </Text>
                  </VStack>
                  <Switch colorScheme="purple" />
                </HStack>
              </VStack>
            </ModernCard>
          </MotionBox>
        </VStack>
      </Container>

      {/* Link Wallet Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setIsLinking(false);
          localStorage.removeItem('pendingLinkToken');
        }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Link New Wallet</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="center" py={4}>
              <Icon as={FiShield} boxSize={12} color="blue.500" />
              <Text textAlign="center">
                To link a new wallet, please switch accounts in your wallet
                provider (e.g., MetaMask) now.
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                We will detect the change and ask you to sign a confirmation
                message.
              </Text>
              <Button colorScheme="blue" onClick={handleSwitchWallet} w="full">
                Switch Wallet
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                onClose();
                setIsLinking(false);
                localStorage.removeItem('pendingLinkToken');
              }}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SettingsPage;
