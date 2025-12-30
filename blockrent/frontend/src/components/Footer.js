import {
  Box,
  Container,
  Stack,
  VStack,
  HStack,
  Text,
  Link,
  useColorModeValue,
  Icon,
  Grid,
  GridItem,
  Input,
  Button,
  IconButton,
  Divider,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import {
  FaTwitter,
  FaGithub,
  FaDiscord,
  FaTelegram,
  FaLinkedin,
} from 'react-icons/fa';
import { FiSend, FiHeart } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

const FooterLink = ({ children, to }) => {
  const color = useColorModeValue('gray.600', 'gray.400');

  return (
    <Link
      as={RouterLink}
      to={to}
      fontSize="sm"
      color={color}
      _hover={{
        color: 'brand.500',
        textDecoration: 'none',
      }}
      transition="color 0.2s"
    >
      {children}
    </Link>
  );
};

const SocialButton = ({ label, href, icon }) => {
  return (
    <IconButton
      aria-label={label}
      icon={<Icon as={icon} />}
      variant="ghost"
      size="lg"
      borderRadius="full"
      _hover={{
        bg: 'brand.500',
        color: 'white',
        transform: 'translateY(-4px)',
      }}
      transition="all 0.3s"
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    />
  );
};

const Footer = () => {
  const [email, setEmail] = useState('');
  const bg = useColorModeValue(
    'rgba(255, 255, 255, 0.8)',
    'rgba(15, 20, 39, 0.95)'
  );
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    setEmail('');
  };

  return (
    <Box
      bg={bg}
      backdropFilter="blur(30px) saturate(180%)"
      WebkitBackdropFilter="blur(30px) saturate(180%)"
      borderTop="1px solid"
      borderColor={borderColor}
    >
      <Container maxW="7xl" py={16}>
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(5, 1fr)',
          }}
          gap={8}
        >
          {/* Brand Column */}
          <GridItem colSpan={{ base: 1, lg: 2 }}>
            <VStack align="start" spacing={6}>
              <Box>
                <Text
                  fontSize="2xl"
                  fontWeight="900"
                  color={useColorModeValue('gray.900', 'white')}
                  letterSpacing="tighter"
                  mb={1}
                >
                  BLOCKRENT
                </Text>
                <Box
                  h="3px"
                  w="120px"
                  bgGradient="linear(135deg, brand.500, brand.purple.500)"
                  borderRadius="full"
                  mb={3}
                />
                <Text
                  fontSize="sm"
                  color={textColor}
                  maxW="xs"
                  lineHeight="tall"
                >
                  The future of decentralized commerce. Buy, sell, and rent with
                  confidence on the blockchain.
                </Text>
              </Box>

              {/* Newsletter */}
              <Box w="full" maxW="xs">
                <Text fontWeight="600" mb={3} fontSize="sm">
                  Subscribe to our newsletter
                </Text>
                <form onSubmit={handleSubscribe}>
                  <HStack>
                    <Input
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="md"
                      borderRadius="xl"
                      bg={useColorModeValue('white', 'whiteAlpha.100')}
                      border="1px solid"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: 'glow',
                      }}
                    />
                    <IconButton
                      aria-label="Subscribe"
                      icon={<Icon as={FiSend} />}
                      type="submit"
                      borderRadius="xl"
                      size="md"
                    />
                  </HStack>
                </form>
              </Box>

              {/* Social Links */}
              <HStack spacing={2}>
                <SocialButton
                  label="Twitter"
                  href="https://twitter.com"
                  icon={FaTwitter}
                />
                <SocialButton
                  label="Discord"
                  href="https://discord.com"
                  icon={FaDiscord}
                />
                <SocialButton
                  label="Telegram"
                  href="https://telegram.org"
                  icon={FaTelegram}
                />
                <SocialButton
                  label="GitHub"
                  href="https://github.com"
                  icon={FaGithub}
                />
              </HStack>
            </VStack>
          </GridItem>

          {/* Marketplace Column */}
          <GridItem>
            <VStack align="start" spacing={4}>
              <Text fontWeight="700" fontSize="sm" mb={2}>
                Marketplace
              </Text>
              <FooterLink to="/marketplace">Browse Listings</FooterLink>
              <FooterLink to="/create">Create Listing</FooterLink>
              <FooterLink to="/listings">My Listings</FooterLink>
              <FooterLink to="/purchases">My Purchases</FooterLink>
            </VStack>
          </GridItem>

          {/* Resources Column */}
          <GridItem>
            <VStack align="start" spacing={4}>
              <Text fontWeight="700" fontSize="sm" mb={2}>
                Resources
              </Text>
              <FooterLink to="/docs">Documentation</FooterLink>
              <FooterLink to="/help">Help Center</FooterLink>
              <FooterLink to="/faq">FAQ</FooterLink>
              <FooterLink to="/api">API</FooterLink>
            </VStack>
          </GridItem>

          {/* Company Column */}
          <GridItem>
            <VStack align="start" spacing={4}>
              <Text fontWeight="700" fontSize="sm" mb={2}>
                Company
              </Text>
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/blog">Blog</FooterLink>
              <FooterLink to="/careers">Careers</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </VStack>
          </GridItem>
        </Grid>

        <Divider my={8} borderColor={borderColor} />

        {/* Bottom Section */}
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify="space-between"
          align="center"
        >
          <Text fontSize="sm" color={textColor}>
            © {new Date().getFullYear()} Blockrent. Made by Het Prajapati
          </Text>

          <HStack spacing={6} fontSize="sm">
            <FooterLink to="/privacy">Privacy Policy</FooterLink>
            <FooterLink to="/terms">Terms of Service</FooterLink>
            <FooterLink to="/cookies">Cookie Policy</FooterLink>
          </HStack>
        </Stack>
      </Container>

      {/* Gradient Decoration */}
      <Box
        h="2px"
        bgGradient="linear(90deg, transparent, brand.500, brand.purple.500, transparent)"
      />
    </Box>
  );
};

export default Footer;
