import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  useToast,
  useColorModeValue,
  Icon,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Badge,
  Divider,
  Link as ChakraLink,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import {
  FaWallet,
  FaCheck,
  FaArrowRight,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const ConnectWalletPage = () => {
  const { account, isConnected, connectWallet, disconnect } = useWeb3();
  const { isAuthenticated, user, addWallet } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, navigate]);

  const sectionBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const greenBg = useColorModeValue('green.50', 'green.900');
  const greenBorder = useColorModeValue('green.200', 'green.700');

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet(true); // Force new connection to show account selection
      toast({
        title: 'Wallet Connected!',
        description: 'Your wallet has been successfully connected',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setIsDisconnecting(true);
    try {
      await disconnect();
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleAddWallet = async () => {
    if (!account) {
      toast({
        title: 'No Wallet Connected',
        description: 'Please connect a wallet first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if wallet is already added
    const existingWallet = user?.wallets?.find(
      (w) => w.address.toLowerCase() === account.toLowerCase()
    );

    if (existingWallet) {
      toast({
        title: 'Wallet Already Added',
        description: 'This wallet is already connected to your account',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsAddingWallet(true);
    try {
      await addWallet(account);
      toast({
        title: 'Wallet Added',
        description: 'New wallet successfully added to your account',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Add wallet error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add wallet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAddingWallet(false);
    }
  };

  const handleContinueToDashboard = () => {
    if (isConnected && account) {
      navigate('/dashboard');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box bg={sectionBg} minH="100vh" py={20}>
      <Container maxW="lg">
        <VStack spacing={8}>
          {/* Header */}
          <VStack spacing={4} textAlign="center">
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
            <VStack spacing={2}>
              <Heading size="2xl" color="gray.800">
                Connect Your Wallet
              </Heading>
              <Text color="gray.600" maxW="500px">
                Connect your MetaMask wallet to access your dashboard and start
                trading on Blockrent
              </Text>
            </VStack>
          </VStack>

          {/* Wallet Status Card */}
          <Card
            bg={cardBg}
            w="full"
            borderRadius="2xl"
            shadow="xl"
            border="1px"
            borderColor={borderColor}
          >
            <CardBody p={8}>
              <VStack spacing={6}>
                {!isConnected ? (
                  <>
                    <Alert status="info" borderRadius="xl" w="full">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">No Wallet Connected</Text>
                        <Text fontSize="sm">
                          Connect your MetaMask wallet to continue
                        </Text>
                      </VStack>
                    </Alert>

                    <Button
                      onClick={handleConnectWallet}
                      isLoading={isConnecting}
                      loadingText="Connecting..."
                      size="lg"
                      w="full"
                      bgGradient="linear(to-r, blue.500, purple.500)"
                      _hover={{
                        bgGradient: 'linear(to-r, blue.600, purple.600)',
                        transform: 'translateY(-1px)',
                        shadow: 'lg',
                      }}
                      color="white"
                      borderRadius="xl"
                      leftIcon={<Icon as={FaWallet} />}
                      rightIcon={<Icon as={FaArrowRight} />}
                      transition="all 0.2s"
                    >
                      Connect MetaMask Wallet
                    </Button>

                    <Alert status="warning" borderRadius="xl" w="full">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" fontSize="sm">
                          Important
                        </Text>
                        <Text fontSize="xs">
                          Make sure you have MetaMask installed and unlocked.
                          You&apos;ll need to sign a message to verify wallet
                          ownership.
                        </Text>
                      </VStack>
                    </Alert>
                  </>
                ) : (
                  <>
                    <Box
                      w="full"
                      p={6}
                      bg={greenBg}
                      borderRadius="xl"
                      border="1px"
                      borderColor={greenBorder}
                    >
                      <VStack spacing={4}>
                        <Box
                          w="16"
                          h="16"
                          borderRadius="full"
                          bg="green.100"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaCheck} boxSize={8} color="green.600" />
                        </Box>

                        <VStack spacing={2}>
                          <Text
                            fontWeight="bold"
                            fontSize="lg"
                            color="green.800"
                          >
                            Wallet Connected Successfully!
                          </Text>
                          <HStack spacing={2}>
                            <Text
                              fontSize="sm"
                              color="green.600"
                              fontFamily="mono"
                            >
                              {formatAddress(account)}
                            </Text>
                            <Badge colorScheme="green" size="sm">
                              Connected
                            </Badge>
                          </HStack>
                        </VStack>
                      </VStack>
                    </Box>

                    <VStack spacing={4} w="full">
                      <Button
                        onClick={handleAddWallet}
                        isLoading={isAddingWallet}
                        loadingText="Adding Wallet..."
                        size="lg"
                        w="full"
                        bgGradient="linear(to-r, blue.500, blue.600)"
                        _hover={{
                          bgGradient: 'linear(to-r, blue.600, blue.700)',
                          transform: 'translateY(-1px)',
                          shadow: 'lg',
                        }}
                        color="white"
                        borderRadius="xl"
                        leftIcon={<Icon as={FaWallet} />}
                        transition="all 0.2s"
                      >
                        Add This Wallet
                      </Button>

                      <Button
                        onClick={handleContinueToDashboard}
                        size="lg"
                        w="full"
                        bgGradient="linear(to-r, green.500, green.600)"
                        _hover={{
                          bgGradient: 'linear(to-r, green.600, green.700)',
                          transform: 'translateY(-1px)',
                          shadow: 'lg',
                        }}
                        color="white"
                        borderRadius="xl"
                        leftIcon={<Icon as={FaArrowRight} />}
                        transition="all 0.2s"
                      >
                        Continue to Dashboard
                      </Button>

                      <Button
                        onClick={handleDisconnectWallet}
                        isLoading={isDisconnecting}
                        loadingText="Disconnecting..."
                        variant="outline"
                        size="md"
                        w="full"
                        colorScheme="red"
                        borderRadius="xl"
                      >
                        Disconnect Wallet
                      </Button>
                    </VStack>

                    <Alert status="success" borderRadius="xl" w="full">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" fontSize="sm">
                          Ready to Go!
                        </Text>
                        <Text fontSize="xs">
                          Your wallet is connected and verified. You can now
                          access all features of Blockrent.
                        </Text>
                      </VStack>
                    </Alert>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Info Section */}
          <VStack spacing={4} textAlign="center">
            <Text fontSize="sm" color="gray.500">
              Need help? Check out our wallet connection guide
            </Text>

            <HStack spacing={4}>
              <ChakraLink
                as={RouterLink}
                to="/"
                color="blue.500"
                _hover={{ color: 'blue.600' }}
              >
                Back to Home
              </ChakraLink>
              <Text color="gray.400">•</Text>
              <ChakraLink
                as={RouterLink}
                to="/signin"
                color="blue.500"
                _hover={{ color: 'blue.600' }}
              >
                Back to Sign In
              </ChakraLink>
            </HStack>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default ConnectWalletPage;
