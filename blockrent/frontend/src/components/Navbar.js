import {
  Box,
  Flex,
  Text,
  Button,
  HStack,
  useColorModeValue,
  Icon,
  useColorMode,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Container,
  useToast,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiCreditCard,
  FiGrid,
  FiPlus,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiList,
  FiPackage,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { useModernToast } from '../hooks/useModernToast';

import AuthModal from './AuthModal';
import WalletManager from './WalletManager';

const NavLink = ({ to, children, icon }) => {
  const color = useColorModeValue('gray.600', 'gray.300');
  const activeColor = useColorModeValue('brand.600', 'brand.400');

  return (
    <Button
      as={RouterLink}
      to={to}
      variant="ghost"
      leftIcon={icon ? <Icon as={icon} /> : undefined}
      color={color}
      _hover={{
        color: activeColor,
        bg: useColorModeValue('gray.100', 'whiteAlpha.100'),
      }}
      _active={{
        color: activeColor,
        fontWeight: '600',
      }}
      transition="all 0.2s"
    >
      {children}
    </Button>
  );
};

const Navbar = () => {
  const {
    isConnected,
    connectWallet,
    disconnect,
    balance,
    account,
    formatAddress,
  } = useWeb3();
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useModernToast();

  const bg = useColorModeValue(
    'rgba(255, 255, 255, 0.8)',
    'rgba(15, 20, 39, 0.8)'
  );
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuHoverBg = useColorModeValue('gray.100', 'whiteAlpha.200');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const logoGradient = useColorModeValue(
    'linear(135deg, #0052CC, #5C00CC)',
    'linear(135deg, brand.500, brand.purple.500)'
  );
  const purpleGradient = 'linear(135deg, #7000FF, #A666FF)';
  const buttonHoverBg = useColorModeValue('gray.100', 'whiteAlpha.200');

  const handleWalletSignIn = async () => {
    // Clear any existing toasts first
    toast.closeAll();

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error(
          'MetaMask is not installed. Please install MetaMask extension to use Blockrent.'
        );
      }

      // Step 1: Connect wallet if not connected
      let currentAccount = account;
      if (!isConnected) {
        try {
          const connectedAccount = await connectWallet();
          currentAccount = connectedAccount;

          // Wait for provider to be fully set
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (connectError) {
          // Check if user rejected the connection
          if (
            connectError.message?.includes('User rejected') ||
            connectError.message?.includes('User denied') ||
            connectError.code === 4001 ||
            connectError.code === 'ACTION_REJECTED'
          ) {
            return; // Silent return on user rejection
          }
          throw connectError; // Re-throw other errors
        }
      }

      // Step 2: Verify we have an account
      if (!currentAccount) {
        throw new Error(
          'No wallet account found. Please unlock your MetaMask wallet.'
        );
      }

      // Step 3: Sign in with wallet (this will prompt signature)
      try {
        await login(currentAccount);
      } catch (loginError) {
        // Check if user rejected the signature
        if (
          loginError.message?.includes('User rejected') ||
          loginError.message?.includes('User denied') ||
          loginError.message?.includes('rejected signature')
        ) {
          return; // Silent return on user rejection
        }
        throw loginError;
      }

      // Success! Show success toast
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in to Blockrent',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (error) {
      // User-friendly error messages
      let errorTitle = 'Sign In Failed';
      let errorDescription =
        error.message ||
        'Failed to sign in. Please check your wallet connection and try again.';

      // Don't show error for user rejections
      if (
        error.message?.includes('User rejected') ||
        error.message?.includes('User denied') ||
        error.message?.includes('rejected signature')
      ) {
        return;
      }

      // Specific error handling
      if (
        error.message?.includes('MetaMask') ||
        error.message?.includes('not installed')
      ) {
        errorTitle = 'MetaMask Required';
      } else if (error.message?.includes('unlock')) {
        errorTitle = 'Wallet Locked';
      } else if (
        error.message?.includes('network') ||
        error.message?.includes('nonce')
      ) {
        errorTitle = 'Connection Error';
        errorDescription =
          'Unable to connect to the server. Please make sure the backend is running.';
      } else if (error.message?.includes('provider')) {
        errorTitle = 'Wallet Error';
        errorDescription =
          'Unable to connect to your wallet. Please refresh the page and try again.';
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (isConnected) {
        disconnect();
      }

      toast({
        title: 'Signed out successfully',
        description: 'Come back soon!',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error signing out',
        description: 'There was a problem signing you out. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      bg={bg}
      backdropFilter="blur(30px) saturate(180%)"
      sx={{
        WebkitBackdropFilter: "blur(30px) saturate(180%)"
      }}
      borderBottom="1px solid"
      borderColor={borderColor}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.05)"
    >
      <Container maxW="7xl">
        <Flex h={20} alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <HStack spacing={8}>
            <Box
              as={RouterLink}
              to="/"
              position="relative"
              _hover={{ transform: 'translateY(-2px)' }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <Text
                fontSize="2xl"
                fontWeight="900"
                color={useColorModeValue('gray.900', 'white')}
                letterSpacing="tighter"
              >
                BLOCKRENT
              </Text>
              <Box
                position="absolute"
                bottom="-4px"
                left="0"
                right="0"
                height="3px"
                bgGradient={logoGradient}
                borderRadius="full"
              />
            </Box>

            {/* Desktop Navigation */}
            <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
              {isAuthenticated && (
                <>
                  <NavLink to="/dashboard" icon={FiShoppingBag}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/listings" icon={FiList}>
                    My Listings
                  </NavLink>
                  <NavLink to="/purchases" icon={FiPackage}>
                    Purchases
                  </NavLink>
                </>
              )}
              <NavLink to="/marketplace" icon={FiGrid}>
                Marketplace
              </NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/create" icon={FiPlus}>
                    Create
                  </NavLink>
                </>
              )}
            </HStack>
          </HStack>

          {/* Right Side */}
          <HStack spacing={3}>
            {/* Dark Mode Toggle */}
            <IconButton
              aria-label="Toggle dark mode"
              icon={
                colorMode === 'light' ? (
                  <Icon as={FaMoon} />
                ) : (
                  <Icon as={FaSun} />
                )
              }
              onClick={toggleColorMode}
              variant="ghost"
              borderRadius="full"
              size="md"
              _hover={{
                bg: buttonHoverBg,
                transform: 'rotate(180deg)',
                boxShadow: 'md',
              }}
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            />

            {/* Authentication */}
            {!isAuthenticated ? (
              <Button
                onClick={handleWalletSignIn}
                leftIcon={<Icon as={FiCreditCard} />}
                size="md"
                isLoading={isLoading}
                loadingText="Signing In..."
                bgGradient={purpleGradient}
                color="white"
                fontWeight="700"
                px={6}
                borderRadius="xl"
                boxShadow="0 8px 24px rgba(112, 0, 255, 0.4)"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(112, 0, 255, 0.6)',
                }}
                _active={{
                  transform: 'translateY(0)',
                  boxShadow: '0 4px 16px rgba(112, 0, 255, 0.4)',
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                Connect & Sign In
              </Button>
            ) : (
              <HStack spacing={3}>
                {/* Balance Badge */}
                {isConnected && (
                  <Box
                    px={6}
                    py={3}
                    borderRadius="full"
                    bgGradient="linear(135deg, #7000FF, #A666FF)"
                    color="white"
                    fontWeight="700"
                    fontSize="md"
                    display={{ base: 'none', md: 'flex' }}
                    alignItems="center"
                    gap={2}
                    boxShadow="0 8px 24px rgba(112, 0, 255, 0.4)"
                    position="relative"
                    overflow="hidden"
                    transition="all 0.3s"
                    _hover={{
                      boxShadow: '0 12px 32px rgba(112, 0, 255, 0.6)',
                      transform: 'translateY(-2px)',
                    }}
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'shine 3s infinite',
                    }}
                  >
                    💎 {parseFloat(balance || '0').toFixed(3)} MATIC
                  </Box>
                )}

                {/* User Menu */}
                <Menu
                  onOpen={() => setIsMenuOpen(true)}
                  onClose={() => setIsMenuOpen(false)}
                >
                  <MenuButton
                    as={IconButton}
                    icon={
                      <Icon
                        as={isMenuOpen ? FiX : FiMenu}
                        boxSize={6}
                        transition="all 0.3s ease"
                      />
                    }
                    variant="ghost"
                    borderRadius="xl"
                    size="md"
                    _hover={{
                      bg: menuHoverBg,
                    }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  />
                  <MenuList
                    bg={menuBg}
                    borderColor={borderColor}
                    boxShadow="xl"
                  >
                    <Box px={4} py={2}>
                      <Text fontWeight="bold">{user?.username || 'User'}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {formatAddress(account)}
                      </Text>
                    </Box>
                    <MenuDivider />
                    <MenuItem icon={<FiUser />} as={RouterLink} to="/dashboard">
                      Dashboard
                    </MenuItem>
                    <MenuItem
                      icon={<FiSettings />}
                      as={RouterLink}
                      to="/settings"
                    >
                      Settings
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem
                      icon={<FiLogOut />}
                      onClick={handleLogout}
                      color="red.500"
                    >
                      Sign Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            )}
          </HStack>
        </Flex>
      </Container>

      <AuthModal isOpen={false} onClose={() => {}} />
      <WalletManager
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />
    </Box>
  );
};

export default Navbar;
