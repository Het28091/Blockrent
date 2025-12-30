import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  HStack,
  Text,
  useToast,
  Image,
  useColorModeValue,
  VStack,
  Box,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { uploadFileToIPFS } from '../utils/ipfsSimulation';

const EditListingModal = ({ isOpen, onClose, listing, onEditSuccess }) => {
  const toast = useToast();
  const { apiRequest } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    deposit: '',
    isForRent: false,
    imageFile: null,
    imagePreview: '',
  });

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price || '',
        deposit: listing.deposit || '',
        isForRent: listing.isForRent || false,
        imageFile: null,
        imagePreview: listing.image || '',
      });
    }
  }, [listing]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'imageFile' && files.length > 0) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const validateFields = () => {
    if (!formData.title || !formData.description || !formData.price) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateFields()) return;
    setIsUpdating(true);

    try {
      let imageUrl = formData.imagePreview;
      if (formData.imageFile) {
        toast({
          title: 'Uploading Image',
          description: 'Uploading image to IPFS...',
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
        imageUrl = await uploadFileToIPFS(formData.imageFile);
      }

      const updatedListing = {
        ...listing,
        title: formData.title,
        description: formData.description,
        price: formData.price,
        deposit: formData.deposit,
        isForRent: formData.isForRent,
        image: imageUrl,
        isActive: true,
      };

      const response = await apiRequest(
        `http://localhost:5000/api/listings/${listing.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedListing),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update listing');
      }

      toast({
        title: 'Success',
        description: 'Listing updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onEditSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update listing',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent
        borderRadius="2xl"
        shadow="2xl"
        bg={useColorModeValue('white', 'gray.800')}
      >
        <ModalHeader pb={4}>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            Edit Listing
          </Text>
        </ModalHeader>
        <ModalCloseButton
          size="lg"
          borderRadius="full"
          _hover={{ bg: 'red.50', color: 'red.500' }}
        />
        <ModalBody px={8}>
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel fontWeight="semibold" color="gray.700">
                Title
              </FormLabel>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter item title..."
                borderRadius="xl"
                border="2px"
                borderColor="gray.200"
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px #3182ce',
                }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontWeight="semibold" color="gray.700">
                Description
              </FormLabel>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your item..."
                rows={4}
                borderRadius="xl"
                border="2px"
                borderColor="gray.200"
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px #3182ce',
                }}
                resize="vertical"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.700">
                Listing Type
              </FormLabel>
              <Box
                bg={useColorModeValue('gray.50', 'gray.700')}
                p={4}
                borderRadius="xl"
                border="1px"
                borderColor="gray.200"
              >
                <HStack justify="space-between">
                  <Text
                    fontWeight="medium"
                    color={!formData.isForRent ? 'blue.600' : 'gray.600'}
                  >
                    For Sale
                  </Text>
                  <Switch
                    name="isForRent"
                    isChecked={formData.isForRent}
                    onChange={handleInputChange}
                    colorScheme="blue"
                  />
                  <Text
                    fontWeight="medium"
                    color={formData.isForRent ? 'green.600' : 'gray.600'}
                  >
                    For Rent
                  </Text>
                </HStack>
              </Box>
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontWeight="semibold" color="gray.700">
                {formData.isForRent
                  ? 'Rental Price (MATIC per period)'
                  : 'Sale Price (MATIC)'}
              </FormLabel>
              <Input
                name="price"
                type="number"
                step="0.001"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.0"
                borderRadius="xl"
                border="2px"
                borderColor="gray.200"
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px #3182ce',
                }}
              />
            </FormControl>

            {formData.isForRent && (
              <FormControl>
                <FormLabel fontWeight="semibold" color="gray.700">
                  Security Deposit (MATIC)
                </FormLabel>
                <Input
                  name="deposit"
                  type="number"
                  step="0.001"
                  value={formData.deposit}
                  onChange={handleInputChange}
                  placeholder="0.0"
                  borderRadius="xl"
                  border="2px"
                  borderColor="gray.200"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #3182ce',
                  }}
                />
              </FormControl>
            )}

            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.700">
                Upload Item Image
              </FormLabel>
              <VStack spacing={4}>
                <Input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleInputChange}
                  borderRadius="xl"
                  border="2px"
                  borderColor="gray.200"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #3182ce',
                  }}
                />
                {formData.imagePreview && (
                  <Box
                    borderRadius="xl"
                    overflow="hidden"
                    shadow="md"
                    maxW="300px"
                  >
                    <Image
                      src={formData.imagePreview}
                      alt="Preview"
                      w="full"
                      h="200px"
                      objectFit="cover"
                    />
                  </Box>
                )}
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter px={8} py={6}>
          <HStack spacing={4} w="full">
            <Button
              variant="outline"
              onClick={onClose}
              isDisabled={isUpdating}
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
              colorScheme="blue"
              onClick={handleUpdate}
              isLoading={isUpdating}
              borderRadius="xl"
              bgGradient="linear(to-r, blue.500, blue.600)"
              _hover={{
                bgGradient: 'linear(to-r, blue.600, blue.700)',
                transform: 'translateY(-1px)',
                shadow: 'lg',
              }}
              flex={1}
              transition="all 0.2s"
            >
              Save Changes
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditListingModal;
