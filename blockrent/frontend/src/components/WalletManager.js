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
  Text,
  useToast,
  useColorModeValue,
  Icon,
  Box,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  Divider,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { FaWallet, FaPlus, FaCopy, FaCheck, FaTrash } from 'react-icons/fa';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const WalletManager = ({ isOpen, onClose }) => {
  const { user, addWallet, isLoading } = useAuth();
  const { account, connectWallet } = useWeb3();
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState('');
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const grayBg = useColorModeValue('gray.50', 'gray.700');
  const blueBg = useColorModeValue('blue.50', 'blue.900');
  const blueBorder = useColorModeValue('blue.200', 'blue.700');

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

  const copyToClipboard = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast({
        title: 'Copied!',
        description: 'Wallet address copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      setTimeout(() => setCopiedAddress(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
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
                Wallet Management
              </Text>
              <Text fontSize="sm" color="gray.600">
                Manage your connected wallets
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
          <VStack spacing={6} align="stretch">
            {/* Current Wallets */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={4}>
                Connected Wallets ({user?.wallets?.length || 0})
              </Text>

              {user?.wallets?.map((wallet, index) => (
                <Box
                  key={wallet.address}
                  p={4}
                  bg={grayBg}
                  borderRadius="xl"
                  border="1px"
                  borderColor={borderColor}
                  mb={3}
                >
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Icon as={FaWallet} color="blue.500" />
                      <VStack align="start" spacing={0}>
                        <HStack spacing={2}>
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color="gray.800"
                          >
                            {formatAddress(wallet.address)}
                          </Text>
                          {wallet.isPrimary && (
                            <Badge colorScheme="blue" size="sm">
                              Primary
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                          Added {new Date(wallet.addedAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                    </HStack>

                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(wallet.address)}
                        leftIcon={
                          copiedAddress === wallet.address ? (
                            <Icon as={FaCheck} color="green.500" />
                          ) : (
                            <Icon as={FaCopy} />
                          )
                        }
                        _hover={{ bg: 'blue.50' }}
                      >
                        {copiedAddress === wallet.address ? 'Copied!' : 'Copy'}
                      </Button>
                    </HStack>
                  </HStack>
                </Box>
              ))}
            </Box>

            <Divider />

            {/* Add New Wallet */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={4}>
                Add New Wallet
              </Text>

              {!account ? (
                <Alert status="info" borderRadius="xl">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold">Connect a Wallet</Text>
                    <Text fontSize="sm">
                      Connect a new wallet to add it to your account
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<Icon as={FaWallet} />}
                      onClick={connectWallet}
                      mt={2}
                    >
                      Connect Wallet
                    </Button>
                  </VStack>
                </Alert>
              ) : (
                <Box
                  p={4}
                  bg={blueBg}
                  borderRadius="xl"
                  border="1px"
                  borderColor={blueBorder}
                >
                  <VStack spacing={4}>
                    <HStack spacing={3}>
                      <Icon as={FaWallet} color="blue.600" />
                      <VStack align="start" spacing={0}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="blue.800"
                        >
                          New Wallet Detected
                        </Text>
                        <Text fontSize="xs" color="blue.600" fontFamily="mono">
                          {formatAddress(account)}
                        </Text>
                      </VStack>
                    </HStack>

                    <Button
                      w="full"
                      colorScheme="blue"
                      leftIcon={<Icon as={FaPlus} />}
                      onClick={handleAddWallet}
                      isLoading={isAddingWallet}
                      loadingText="Adding Wallet..."
                      borderRadius="xl"
                    >
                      Add This Wallet
                    </Button>
                  </VStack>
                </Box>
              )}
            </Box>

            {/* Info */}
            <Alert status="info" borderRadius="xl">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="semibold" fontSize="sm">
                  Multi-Wallet Support
                </Text>
                <Text fontSize="xs">
                  You can connect multiple wallets to your account. Your
                  listings will be associated with the wallet you use to create
                  them.
                </Text>
              </VStack>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter justifyContent="center" pb={6}>
          <Button variant="ghost" onClick={onClose} borderRadius="xl">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WalletManager;
