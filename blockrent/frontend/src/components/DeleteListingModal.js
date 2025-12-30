// src/components/DeleteListingModal.js
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  HStack,
  Circle,
} from '@chakra-ui/react';
import React from 'react';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const DeleteListingModal = ({ isOpen, onClose, listing, onDeleteSuccess }) => {
  const bg = useColorModeValue('white', 'gray.800');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="md"
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent borderRadius="2xl" shadow="2xl" bg={bg}>
        <ModalHeader pb={4}>
          <HStack spacing={3}>
            <Circle size="12" bg="red.100" color="red.500">
              <Icon as={FaTrash} boxSize={5} />
            </Circle>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Delete Listing
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton
          size="lg"
          borderRadius="full"
          _hover={{ bg: 'red.50', color: 'red.500' }}
        />
        <ModalBody px={8} pb={6}>
          <VStack spacing={6} textAlign="center">
            <Circle size="20" bg="red.50" color="red.500">
              <Icon as={FaExclamationTriangle} boxSize={10} />
            </Circle>
            <VStack spacing={3}>
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                Are you sure you want to delete this listing?
              </Text>
              <Text fontSize="md" color="gray.600" maxW="300px">
                This action cannot be undone. The listing &quot;{listing?.title}
                &quot; will be permanently removed from the marketplace.
              </Text>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter px={8} py={6}>
          <HStack spacing={4} w="full">
            <Button
              variant="outline"
              onClick={onClose}
              borderRadius="xl"
              border="2px"
              borderColor="gray.300"
              flex={1}
              _hover={{
                borderColor: 'gray.400',
                bg: 'gray.50',
              }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={() => onDeleteSuccess(listing.id)}
              borderRadius="xl"
              bgGradient="linear(to-r, red.500, red.600)"
              _hover={{
                bgGradient: 'linear(to-r, red.600, red.700)',
                transform: 'translateY(-1px)',
                shadow: 'lg',
              }}
              flex={1}
              leftIcon={<Icon as={FaTrash} />}
              transition="all 0.2s"
            >
              Delete Listing
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteListingModal;
