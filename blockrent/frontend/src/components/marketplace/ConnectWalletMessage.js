import {
  Box,
  Container,
  Center,
  Card,
  CardBody,
  VStack,
  Icon,
  Heading,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import { FaShoppingBag } from 'react-icons/fa';

const ConnectWalletMessage = () => {
  const sectionBg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box bg={sectionBg} minH="80vh">
      <Container maxW="container.lg" py={20}>
        <Center>
          <Card
            bg={cardBg}
            p={8}
            borderRadius="2xl"
            shadow="xl"
            textAlign="center"
          >
            <CardBody>
              <VStack spacing={6}>
                <Icon as={FaShoppingBag} boxSize={16} color="orange.400" />
                <VStack spacing={3}>
                  <Heading size="lg" color="gray.700">
                    Connect Your Wallet
                  </Heading>
                  <Text color="gray.600">
                    Please connect your wallet to browse the marketplace and
                    discover amazing items.
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </Center>
      </Container>
    </Box>
  );
};

export default ConnectWalletMessage;
