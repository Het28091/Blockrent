import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  useColorModeValue,
  Divider,
  Icon,
  Box,
  Alert,
  AlertIcon,
  Spinner,
  Center,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { FaWallet, FaUser, FaEnvelope, FaKey } from 'react-icons/fa';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const AuthModal = ({ isOpen, onClose }) => {
  const { account, isConnected } = useWeb3();
  const { handleWalletLogin, register, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const greenBg = useColorModeValue('green.50', 'green.900');
  const greenBorder = useColorModeValue('green.200', 'green.700');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isConnected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      if (isLogin) {
        await handleWalletLogin();
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        if (!formData.username.trim()) {
          setError('Username is required');
          return;
        }

        await register({
          username: formData.username,
          email: formData.email,
          displayName: formData.displayName || formData.username,
        });

        toast({
          title: 'Registration Successful',
          description: 'Account created successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onClose();
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', email: '', displayName: '' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent
        borderRadius="2xl"
        shadow="2xl"
        bg={cardBg}
        border="1px"
        borderColor={borderColor}
      >
        <ModalHeader textAlign="center" pb={4}>
          <VStack spacing={3}>
            <Box
              w="16"
              h="16"
              borderRadius="full"
              bg="blue.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FaWallet} boxSize={8} color="blue.600" />
            </Box>
            <VStack spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {isLogin
                  ? 'Sign in with your wallet'
                  : 'Register with your wallet'}
              </Text>
            </VStack>
          </VStack>
        </ModalHeader>

        <ModalCloseButton
          size="lg"
          borderRadius="full"
          _hover={{ bg: 'red.50', color: 'red.500' }}
        />

        <ModalBody px={8}>
          {!isConnected ? (
            <Alert status="warning" borderRadius="xl">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="semibold">Wallet Not Connected</Text>
                <Text fontSize="sm">
                  Please connect your wallet first to continue.
                </Text>
              </VStack>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                {/* Connected Wallet Info */}
                <Box
                  w="full"
                  p={4}
                  bg={greenBg}
                  borderRadius="xl"
                  border="1px"
                  borderColor={greenBorder}
                >
                  <HStack spacing={3}>
                    <Icon as={FaWallet} color="green.600" />
                    <VStack align="start" spacing={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="green.800"
                      >
                        Connected Wallet
                      </Text>
                      <Text fontSize="xs" color="green.600" fontFamily="mono">
                        {account.slice(0, 6)}...{account.slice(-4)}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {error && (
                  <Alert status="error" borderRadius="xl">
                    <AlertIcon />
                    <Text fontSize="sm">{error}</Text>
                  </Alert>
                )}

                {!isLogin && (
                  <>
                    <FormControl isRequired>
                      <FormLabel
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        <Icon as={FaUser} mr={2} />
                        Username
                      </FormLabel>
                      <Input
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Choose a unique username"
                        borderRadius="xl"
                        border="2px"
                        borderColor="gray.200"
                        _focus={{
                          borderColor: 'blue.400',
                          boxShadow: '0 0 0 1px #3182ce',
                        }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        <Icon as={FaEnvelope} mr={2} />
                        Email (Optional)
                      </FormLabel>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        borderRadius="xl"
                        border="2px"
                        borderColor="gray.200"
                        _focus={{
                          borderColor: 'blue.400',
                          boxShadow: '0 0 0 1px #3182ce',
                        }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        <Icon as={FaUser} mr={2} />
                        Display Name (Optional)
                      </FormLabel>
                      <Input
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        placeholder="How you want to be displayed"
                        borderRadius="xl"
                        border="2px"
                        borderColor="gray.200"
                        _focus={{
                          borderColor: 'blue.400',
                          boxShadow: '0 0 0 1px #3182ce',
                        }}
                      />
                    </FormControl>
                  </>
                )}

                <Button
                  type="submit"
                  w="full"
                  size="lg"
                  isLoading={isLoading}
                  loadingText={
                    isLogin ? 'Signing In...' : 'Creating Account...'
                  }
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  _hover={{
                    bgGradient: 'linear(to-r, blue.600, purple.600)',
                    transform: 'translateY(-1px)',
                    shadow: 'lg',
                  }}
                  color="white"
                  borderRadius="xl"
                  leftIcon={<Icon as={FaKey} />}
                  transition="all 0.2s"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Button>

                <Divider />

                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">
                    {isLogin
                      ? "Don't have an account?"
                      : 'Already have an account?'}
                  </Text>
                  <Button
                    variant="link"
                    size="sm"
                    color="blue.500"
                    onClick={toggleMode}
                    _hover={{ color: 'blue.600' }}
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Button>
                </HStack>
              </VStack>
            </form>
          )}
        </ModalBody>

        <ModalFooter justifyContent="center" pb={6}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
