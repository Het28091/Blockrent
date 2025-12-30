import {
  SimpleGrid,
  Center,
  VStack,
  Icon,
  Heading,
  Text,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import { FaShoppingBag } from 'react-icons/fa';

import ListingCard from './ListingCard';

const MotionSimpleGrid = motion(SimpleGrid);

const ListingsGrid = ({
  listings,
  isOwner,
  onViewDetails,
  onEditListing,
  onDeleteListing,
  loading,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (loading) {
    return null; // Loading state is handled in the parent component
  }

  if (listings.length === 0) {
    return (
      <Center py={20}>
        <Card
          bg="white"
          p={12}
          borderRadius="2xl"
          shadow="xl"
          textAlign="center"
          maxW="500px"
        >
          <CardBody>
            <VStack spacing={6}>
              <Icon as={FaShoppingBag} boxSize={16} color="gray.400" />
              <VStack spacing={3}>
                <Heading size="lg" color="gray.700">
                  No items found
                </Heading>
                <Text color="gray.600">
                  Try adjusting your search or filters to find what you&apos;re
                  looking for.
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Center>
    );
  }

  return (
    <MotionSimpleGrid
      columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
      spacing={8}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isOwner={isOwner(listing)}
          onView={onViewDetails}
          onEdit={onEditListing}
          onDelete={onDeleteListing}
        />
      ))}
    </MotionSimpleGrid>
  );
};

export default ListingsGrid;
