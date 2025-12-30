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
  Box,
  Flex,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import {
  FaWallet,
  FaPlus,
  FaCheck,
  FaArrowRight,
  FaExchangeAlt,
} from 'react-icons/fa';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const EasyWalletSwitcher = () => {
  const { account, isConnected, connectWallet, disconnect } = useWeb3();
  const { user, addWallet } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const toast = useToast();

  const menuBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('green.50', 'green.900');
  const primaryBg = useColorModeValue('blue.50', 'blue.900');
  const hStackBg = useColorModeValue('gray.50', 'gray.800');
  const hStackHoverBg = useColorModeValue('gray.100', 'gray.700');

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleSwitchWallet = async (walletAddress) => {
    setIsConnecting(true);
    try {
      await connectWallet(false, walletAddress);
      toast({
        title: 'Wallet Switched!',
        description: `Now using ${formatAddress(walletAddress)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Wallet switch failed:', error);
      toast({
        title: 'Switch Failed',
        description: 'Failed to switch wallet. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectNewWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet(true);
      toast({
        title: 'New Wallet Connected!',
        description: 'Connect a different wallet to switch',
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

  const handleAddCurrentWallet = async () => {
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
        description: 'This wallet is already in your account',
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
        title: 'Wallet Added!',
        description: 'New wallet added to your account',
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
        onClick={handleConnectNewWallet}
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
        minW="300px"
      >
        {/* Current Active Wallet */}
        <MenuItem
          icon={<Icon as={FaCheck} color="green.500" />}
          _hover={{ bg: 'green.50' }}
          isDisabled
          bg={activeBg}
        >
          <VStack align="start" spacing={0} w="full">
            <Text fontSize="sm" fontWeight="semibold">
              {formatAddress(account)}
            </Text>
            <Text fontSize="xs" color="green.600">
              Currently Active - Ready to use
            </Text>
          </VStack>
        </MenuItem>

        <MenuDivider />

        {/* Other Wallets - SUPER EASY SWITCHING */}
        {user?.wallets
          ?.filter((w) => w.address.toLowerCase() !== account.toLowerCase())
          .map((wallet) => (
            <MenuItem
              key={wallet.address}
              icon={<Icon as={FaExchangeAlt} color="blue.500" />}
              _hover={{ bg: 'blue.50' }}
              onClick={() => handleSwitchWallet(wallet.address)}
              bg={wallet.isPrimary ? primaryBg : 'transparent'}
            >
              <VStack align="start" spacing={0} w="full">
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm" fontWeight="semibold">
                    {formatAddress(wallet.address)}
                  </Text>
                  <HStack spacing={1}>
                    {wallet.isPrimary && (
                      <Badge colorScheme="blue" size="sm">
                        Primary
                      </Badge>
                    )}
                  </HStack>
                </HStack>
                <Text fontSize="xs" color="blue.600">
                  Click to switch to this wallet
                </Text>
              </VStack>
            </MenuItem>
          ))}

        <MenuDivider />

        {/* Add Current Wallet */}
        <MenuItem
          icon={<Icon as={FaPlus} />}
          onClick={handleAddCurrentWallet}
          isDisabled={isAddingWallet}
          _hover={{ bg: 'blue.50' }}
        >
          {isAddingWallet ? 'Adding...' : 'Add Current Wallet to Account'}
        </MenuItem>

        {/* Connect Different Wallet */}
        <MenuItem
          icon={<Icon as={FaWallet} />}
          onClick={handleConnectNewWallet}
          isDisabled={isConnecting}
          _hover={{ bg: 'blue.50' }}
        >
          {isConnecting ? 'Connecting...' : 'Connect Different Wallet'}
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

export default EasyWalletSwitcher;
