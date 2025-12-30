import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import React from 'react';

/**
 * Transaction Confirmation Modal
 * Shows transaction details before user confirms
 */
const TransactionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  transactionDetails,
  isLoading = false,
  warningMessage = null,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const detailBoxBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent
        bg={bgColor}
        borderRadius="xl"
        border="1px"
        borderColor={borderColor}
      >
        <ModalHeader>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            bgGradient="linear(to-r, brand.500, brand.purple.500)"
            bgClip="text"
          >
            {title || 'Confirm Transaction'}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {description && (
              <Text color="gray.600" fontSize="sm">
                {description}
              </Text>
            )}

            {warningMessage && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  {warningMessage}
                </AlertDescription>
              </Alert>
            )}

            <Box
              p={4}
              borderRadius="lg"
              bg={detailBoxBg}
              border="1px"
              borderColor={borderColor}
            >
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" fontWeight="bold" color="gray.500">
                  Transaction Details
                </Text>
                <Divider />

                {transactionDetails?.map((detail, index) => (
                  <HStack key={index} justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      {detail.label}:
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold">
                      {detail.value}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            <Alert status="info" borderRadius="md" variant="left-accent">
              <AlertIcon />
              <AlertDescription fontSize="xs">
                This will trigger a MetaMask transaction. You&apos;ll need to
                approve it and pay gas fees.
              </AlertDescription>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              bgGradient="linear(to-r, brand.500, brand.purple.500)"
              color="white"
              onClick={onConfirm}
              isLoading={isLoading}
              loadingText="Confirming..."
              _hover={{
                bgGradient: 'linear(to-r, brand.600, brand.purple.600)',
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              _active={{
                transform: 'translateY(0)',
              }}
            >
              Confirm Transaction
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TransactionConfirmModal;
