import {
  Box,
  Card,
  CardBody,
  Badge,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  useColorModeValue,
  AspectRatio,
  Image,
  Center,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import { FiEye } from 'react-icons/fi';

const MotionCard = motion(Card);

const ListingCard = ({ listing, onView }) => {
  const cardBg = useColorModeValue('brand.white', 'brand.darkBlue');
  const borderColor = useColorModeValue('brand.lightGray', 'brand.darkBlue');

  return (
    <MotionCard
      bg={cardBg}
      borderRadius="xl"
      shadow="lg"
      border="1px"
      borderColor={borderColor}
      overflow="hidden"
      whileHover={{ y: -5, shadow: '2xl' }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <CardBody p={0}>
        <AspectRatio ratio={16 / 9} w="full">
          <Image src={listing.image} alt={listing.title} objectFit="cover" />
        </AspectRatio>

        <VStack align="stretch" spacing={4} p={6}>
          <Heading size="md" noOfLines={1}>
            {listing.title}
          </Heading>
          <Text noOfLines={2} color="brand.gray">
            {listing.description}
          </Text>
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="lg" color="brand.primary">
              {listing.price} MATIC
            </Text>
            <Badge colorScheme={listing.isForRent ? 'green' : 'blue'}>
              {listing.isForRent ? 'For Rent' : 'For Sale'}
            </Badge>
          </HStack>
          <Button
            variant="solid"
            w="full"
            leftIcon={<Icon as={FiEye} />}
            onClick={() => onView(listing)}
          >
            View
          </Button>
        </VStack>
      </CardBody>
    </MotionCard>
  );
};

export default ListingCard;
