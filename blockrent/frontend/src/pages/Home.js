import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Grid,
  GridItem,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Image,
  Flex,
  Circle,
} from '@chakra-ui/react';
import React from 'react';
import {
  FaShieldAlt,
  FaBolt,
  FaStar,
  FaLock,
  FaWallet,
  FaShoppingBag,
  FaPlus,
  FaCheckCircle,
  FaArrowRight,
  FaEthereum,
} from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

import { useWeb3 } from '../context/Web3Context';

const Home = () => {
  const { isConnected, connectWallet, account, balance } = useWeb3();
  const heroBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg={heroBg}
        py={24}
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          opacity: 0.1,
        }}
      >
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack spacing={12} textAlign="center">
            <VStack spacing={6}>
              <Heading
                size="4xl"
                bgGradient="linear(to-r, white, blue.100)"
                bgClip="text"
                fontWeight="bold"
                letterSpacing="tight"
              >
                Welcome to Blockrent
              </Heading>

              <Text
                fontSize="xl"
                maxW="800px"
                color="whiteAlpha.900"
                lineHeight="tall"
                fontWeight="medium"
              >
                The decentralized marketplace for buying, selling, and renting
                items with cryptocurrency. Powered by Polygon blockchain for
                fast, low-cost transactions.
              </Text>
            </VStack>

            {!isConnected ? (
              <VStack spacing={6}>
                <Button
                  size="xl"
                  onClick={connectWallet}
                  bgGradient="linear(to-r, blue.400, purple.400)"
                  _hover={{
                    bgGradient: 'linear(to-r, blue.500, purple.500)',
                    transform: 'translateY(-3px)',
                    shadow: '2xl',
                  }}
                  color="white"
                  px={12}
                  py={6}
                  fontSize="lg"
                  fontWeight="bold"
                  borderRadius="xl"
                  leftIcon={<Icon as={FaWallet} />}
                  transition="all 0.3s"
                  shadow="xl"
                >
                  Connect MetaMask Wallet
                </Button>
                <Text fontSize="md" color="whiteAlpha.800" maxW="400px">
                  Connect your wallet to start buying, selling, and renting
                  items in the decentralized marketplace
                </Text>
              </VStack>
            ) : (
              <VStack spacing={8}>
                <Card
                  bg="whiteAlpha.200"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  p={8}
                  border="1px"
                  borderColor="whiteAlpha.300"
                  shadow="2xl"
                  maxW="500px"
                >
                  <VStack spacing={4}>
                    <Circle size="16" bg="green.400" color="white">
                      <Icon as={FaCheckCircle} boxSize={8} />
                    </Circle>
                    <VStack spacing={2}>
                      <Text color="white" fontSize="2xl" fontWeight="bold">
                        Wallet Connected!
                      </Text>
                      <Text color="whiteAlpha.800" fontSize="md">
                        {account &&
                          `${account.slice(0, 8)}...${account.slice(-6)}`}
                      </Text>
                      <Badge
                        colorScheme="green"
                        fontSize="md"
                        px={4}
                        py={2}
                        borderRadius="full"
                      >
                        {parseFloat(balance).toFixed(4)} MATIC
                      </Badge>
                    </VStack>
                  </VStack>
                </Card>

                <HStack spacing={6}>
                  <Button
                    as={RouterLink}
                    to="/marketplace"
                    size="lg"
                    bgGradient="linear(to-r, green.400, blue.400)"
                    _hover={{
                      bgGradient: 'linear(to-r, green.500, blue.500)',
                      transform: 'translateY(-2px)',
                      shadow: 'xl',
                    }}
                    color="white"
                    px={8}
                    borderRadius="xl"
                    leftIcon={<Icon as={FaShoppingBag} />}
                    rightIcon={<Icon as={FaArrowRight} />}
                    transition="all 0.3s"
                  >
                    Browse Marketplace
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/create"
                    variant="outline"
                    size="lg"
                    borderColor="whiteAlpha.400"
                    color="white"
                    _hover={{
                      bg: 'whiteAlpha.200',
                      borderColor: 'whiteAlpha.600',
                      transform: 'translateY(-2px)',
                    }}
                    px={8}
                    borderRadius="xl"
                    leftIcon={<Icon as={FaPlus} />}
                    transition="all 0.3s"
                  >
                    List an Item
                  </Button>
                </HStack>
              </VStack>
            )}
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box bg={sectionBg} py={20}>
        <Container maxW="container.xl">
          <VStack spacing={16}>
            <VStack spacing={4} textAlign="center">
              <Heading
                size="2xl"
                bgGradient="linear(to-r, blue.600, purple.600)"
                bgClip="text"
                fontWeight="bold"
              >
                Why Choose Blockrent?
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="600px">
                Experience the future of decentralized commerce with our
                cutting-edge platform
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
              <Card
                bg={cardBg}
                rounded="2xl"
                shadow="lg"
                p={8}
                textAlign="center"
                h="full"
                border="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
                _hover={{
                  transform: 'translateY(-8px)',
                  shadow: '2xl',
                  transition: 'all 0.3s ease',
                }}
                transition="all 0.3s ease"
              >
                <CardBody>
                  <VStack spacing={6}>
                    <Circle size="20" bg="blue.100" color="blue.600">
                      <Icon as={FaShieldAlt} boxSize={10} />
                    </Circle>
                    <VStack spacing={3}>
                      <Heading size="lg" color="gray.800">
                        Secure Escrow
                      </Heading>
                      <Text color="gray.600" fontSize="md" lineHeight="tall">
                        Smart contract-powered escrow ensures safe transactions
                        with automatic fund release
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              <Card
                bg={cardBg}
                rounded="2xl"
                shadow="lg"
                p={8}
                textAlign="center"
                h="full"
                border="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
                _hover={{
                  transform: 'translateY(-8px)',
                  shadow: '2xl',
                  transition: 'all 0.3s ease',
                }}
                transition="all 0.3s ease"
              >
                <CardBody>
                  <VStack spacing={6}>
                    <Circle size="20" bg="yellow.100" color="yellow.600">
                      <Icon as={FaBolt} boxSize={10} />
                    </Circle>
                    <VStack spacing={3}>
                      <Heading size="lg" color="gray.800">
                        Fast & Cheap
                      </Heading>
                      <Text color="gray.600" fontSize="md" lineHeight="tall">
                        Built on Polygon for lightning-fast transactions with
                        minimal fees
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              <Card
                bg={cardBg}
                rounded="2xl"
                shadow="lg"
                p={8}
                textAlign="center"
                h="full"
                border="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
                _hover={{
                  transform: 'translateY(-8px)',
                  shadow: '2xl',
                  transition: 'all 0.3s ease',
                }}
                transition="all 0.3s ease"
              >
                <CardBody>
                  <VStack spacing={6}>
                    <Circle size="20" bg="green.100" color="green.600">
                      <Icon as={FaStar} boxSize={10} />
                    </Circle>
                    <VStack spacing={3}>
                      <Heading size="lg" color="gray.800">
                        Trust System
                      </Heading>
                      <Text color="gray.600" fontSize="md" lineHeight="tall">
                        Transparent reputation system with on-chain ratings and
                        reviews
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              <Card
                bg={cardBg}
                rounded="2xl"
                shadow="lg"
                p={8}
                textAlign="center"
                h="full"
                border="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
                _hover={{
                  transform: 'translateY(-8px)',
                  shadow: '2xl',
                  transition: 'all 0.3s ease',
                }}
                transition="all 0.3s ease"
              >
                <CardBody>
                  <VStack spacing={6}>
                    <Circle size="20" bg="purple.100" color="purple.600">
                      <Icon as={FaLock} boxSize={10} />
                    </Circle>
                    <VStack spacing={3}>
                      <Heading size="lg" color="gray.800">
                        Decentralized
                      </Heading>
                      <Text color="gray.600" fontSize="md" lineHeight="tall">
                        Your data is stored on IPFS - no central authority
                        controls your listings
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Getting Started */}
      <Box bg={heroBg} py={20} position="relative" overflow="hidden">
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack spacing={16} textAlign="center">
            <VStack spacing={6}>
              <Heading
                size="2xl"
                bgGradient="linear(to-r, white, blue.100)"
                bgClip="text"
                fontWeight="bold"
              >
                Getting Started
              </Heading>
              <Text fontSize="lg" color="whiteAlpha.800" maxW="600px">
                Join thousands of users in the decentralized marketplace in just
                3 simple steps
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={12}>
              <VStack spacing={6} position="relative">
                <Circle
                  size="20"
                  bgGradient="linear(to-r, blue.400, purple.400)"
                  color="white"
                  fontSize="2xl"
                  fontWeight="bold"
                  shadow="2xl"
                  position="relative"
                  zIndex={2}
                >
                  1
                </Circle>
                <Card
                  bg="whiteAlpha.200"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  p={8}
                  border="1px"
                  borderColor="whiteAlpha.300"
                  shadow="xl"
                  textAlign="center"
                  maxW="300px"
                >
                  <CardBody>
                    <VStack spacing={4}>
                      <Icon as={FaWallet} boxSize={8} color="white" />
                      <Heading size="lg" color="white">
                        Connect Wallet
                      </Heading>
                      <Text color="whiteAlpha.800" fontSize="md">
                        Connect your MetaMask wallet to get started with the
                        marketplace
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>

              <VStack spacing={6} position="relative">
                <Circle
                  size="20"
                  bgGradient="linear(to-r, green.400, blue.400)"
                  color="white"
                  fontSize="2xl"
                  fontWeight="bold"
                  shadow="2xl"
                  position="relative"
                  zIndex={2}
                >
                  2
                </Circle>
                <Card
                  bg="whiteAlpha.200"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  p={8}
                  border="1px"
                  borderColor="whiteAlpha.300"
                  shadow="xl"
                  textAlign="center"
                  maxW="300px"
                >
                  <CardBody>
                    <VStack spacing={4}>
                      <Icon as={FaShoppingBag} boxSize={8} color="white" />
                      <Heading size="lg" color="white">
                        Browse or List
                      </Heading>
                      <Text color="whiteAlpha.800" fontSize="md">
                        Find items to buy/rent or list your own items for others
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>

              <VStack spacing={6} position="relative">
                <Circle
                  size="20"
                  bgGradient="linear(to-r, purple.400, pink.400)"
                  color="white"
                  fontSize="2xl"
                  fontWeight="bold"
                  shadow="2xl"
                  position="relative"
                  zIndex={2}
                >
                  3
                </Circle>
                <Card
                  bg="whiteAlpha.200"
                  backdropFilter="blur(10px)"
                  borderRadius="2xl"
                  p={8}
                  border="1px"
                  borderColor="whiteAlpha.300"
                  shadow="xl"
                  textAlign="center"
                  maxW="300px"
                >
                  <CardBody>
                    <VStack spacing={4}>
                      <Icon as={FaCheckCircle} boxSize={8} color="white" />
                      <Heading size="lg" color="white">
                        Transact Safely
                      </Heading>
                      <Text color="whiteAlpha.800" fontSize="md">
                        Complete transactions with escrow protection and rate
                        your experience
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
