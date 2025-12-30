import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  VStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  useDisclosure,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FaShieldAlt, FaIdBadge } from 'react-icons/fa';

import { useAuth } from '../context/AuthContext';
import useModernToast from '../hooks/useModernToast';

const PiiConsentModal = () => {
  const {
    needsPiiCollection,
    submitPiiDetails,
    user,
    piiThreshold,
    isAuthenticated,
    isLoading,
  } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useModernToast();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (needsPiiCollection && isAuthenticated) {
      onOpen();
    } else {
      onClose();
    }
  }, [needsPiiCollection, isAuthenticated, onOpen, onClose]);

  useEffect(() => {
    if (needsPiiCollection && user) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
      });
    }
  }, [needsPiiCollection, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await submitPiiDetails(formData);
      toast.success(
        'Identity details saved',
        `Your information stays encrypted and is only accessed when a transaction exceeds ${piiThreshold.toLocaleString()} MATIC.`
      );
      onClose();
    } catch (error) {
      toast.error('Verification failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      isCentered
      size="lg"
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(12px)" />
      <ModalContent borderRadius="2xl" p={2}>
        <ModalHeader>
          <HStack spacing={3} align="center">
            <Icon as={FaShieldAlt} color="purple.500" boxSize={6} />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold">
                Verify Your Identity
              </Text>
              <Text fontSize="sm" color="gray.500">
                Required once per wallet to comply with large-transaction rules
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack align="stretch" spacing={5}>
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <Text fontSize="sm">
                  We only access your personal information if a single transaction amount exceeds{' '}
                  {piiThreshold.toLocaleString()} MATIC. Otherwise it remains private and encrypted.
                </Text>
              </Alert>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Full Legal Name</FormLabel>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Primary Phone Number</FormLabel>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Include country code"
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Residential Address</FormLabel>
                <Textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, city, postal code, country"
                  borderRadius="xl"
                  minH="100px"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              colorScheme="purple"
              leftIcon={<Icon as={FaIdBadge} />}
              isLoading={isSubmitting || isLoading}
              loadingText="Saving"
              borderRadius="xl"
              w="full"
            >
              Save and Continue
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default PiiConsentModal;
