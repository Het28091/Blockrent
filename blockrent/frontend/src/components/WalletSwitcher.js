import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { FaWallet, FaPlus, FaCheck, FaArrowRight } from 'react-icons/fa';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const WalletSwitcher = () => {
  const { account, isConnected, connectWallet, disconnect } = useWeb3();
  const { user, addWallet } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const toast = useToast();

  const menuBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hStackBg = useColorModeValue('gray.50', 'gray.800');
  const hStackHoverBg = useColorModeValue('gray.100', 'gray.700');

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnectWallet = async (forceNewConnection = false) => {
    setIsConnecting(true);
    try {
      await connectWallet(forceNewConnection);
      toast({
        title: 'Wallet Connected',
        description: 'Your wallet has been connected successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsConnecting(false);
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

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  if (!isConnected) {
    return (
      <Button
        onClick={() => handleConnectWallet(true)}
        isLoading={isConnecting}
        loadingText="Connecting..."
        leftIcon={<Icon as={FaWallet} />}
        rightIcon={<Icon as={FaArrowRight} />}
        colorScheme="blue"
        variant="outline"
        borderRadius="xl"
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <Menu>
      <MenuButton as={Button} variant="ghost" p={0}>
        <HStack
          spacing={3}
          p={3}
          bg={hStackBg}
          rounded="xl"
          border="1px"
          borderColor={borderColor}
          cursor="pointer"
          _hover={{
            bg: hStackHoverBg,
            transform: 'translateY(-1px)',
            transition: 'all 0.2s',
          }}
        >
          <Icon as={FaWallet} color="blue.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              {formatAddress(account)}
            </Text>
            <HStack spacing={1}>
              <Badge colorScheme="green" size="sm">
                Active
              </Badge>
              {user?.wallets?.length > 1 && (
                <Badge colorScheme="blue" size="sm">
                  {user.wallets.length} wallets
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>
      </MenuButton>
      <MenuList
        borderRadius="xl"
        shadow="xl"
        border="1px"
        borderColor={borderColor}
        bg={menuBg}
      >
        {/* Current Active Wallet */}
        <MenuItem
          icon={<Icon as={FaCheck} color="green.500" />}
          _hover={{ bg: 'green.50' }}
          isDisabled
        >
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="semibold">
              {formatAddress(account)}
            </Text>
            <Text fontSize="xs" color="green.600">
              Currently Active - Ready to use
            </Text>
          </VStack>
        </MenuItem>

        <MenuDivider />

        {/* Other Connected Wallets */}
        {user?.wallets
          ?.filter((w) => w.address.toLowerCase() !== account.toLowerCase())
          .map((wallet, index) => (
            <MenuItem
              key={wallet.address}
              icon={<Icon as={FaWallet} />}
              _hover={{ bg: 'blue.50' }}
              onClick={() => {
                // In a real app, this would switch the active wallet
                toast({
                  title: 'Wallet Switching',
                  description:
                    'To switch wallets, please disconnect and reconnect with the desired wallet',
                  status: 'info',
                  duration: 3000,
                  isClosable: true,
                });
              }}
            >
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="semibold">
                  {formatAddress(wallet.address)}
                </Text>
                <HStack spacing={1}>
                  {wallet.isPrimary && (
                    <Badge colorScheme="blue" size="sm">
                      Primary
                    </Badge>
                  )}
                  <Text fontSize="xs" color="gray.500">
                    Added {new Date(wallet.addedAt).toLocaleDateString()}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  {wallet.isPrimary ? 'Your main wallet' : 'Additional wallet'}
                </Text>
              </VStack>
            </MenuItem>
          ))}

        <MenuDivider />

        {/* Switch Wallet */}
        <MenuItem
          icon={<Icon as={FaWallet} />}
          onClick={() => handleConnectWallet(true)}
          _hover={{ bg: 'blue.50' }}
        >
          Switch to Different Wallet
        </MenuItem>

        {/* Add New Wallet */}
        <MenuItem
          icon={<Icon as={FaPlus} />}
          onClick={handleAddWallet}
          isLoading={isAddingWallet}
          loadingText="Adding..."
          _hover={{ bg: 'blue.50' }}
        >
          Add Current Wallet
        </MenuItem>

        <MenuDivider />

        {/* Disconnect */}
        <MenuItem
          icon={<Icon as={FaWallet} />}
          onClick={handleDisconnect}
          color="red.500"
          _hover={{ bg: 'red.50' }}
        >
          Disconnect Wallet
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default WalletSwitcher;
