import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Button,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  useToast,
  Card,
  CardBody,
  Icon,
  Divider,
  Image,
  Center,
  SimpleGrid,
  FormErrorMessage,
  Select,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import {
  FiPlus,
  FiUpload,
  FiImage,
  FiDollarSign,
  FiShield,
  FiInfoCircle,
  FiPackage,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import GradientButton from '../components/GradientButton';
import ModernCard from '../components/ModernCard';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import gradients from '../theme/gradients';
import {
  uploadToIPFS,
  uploadFileToIPFS,
  createListingMetadata,
  validateMetadata,
} from '../utils/ipfsSimulation';

const MotionBox = motion(Box);

const CreateListing = () => {
  const { contract, isConnected, withRetry } = useWeb3();
  const { isAuthenticated, apiRequest } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  // Category options matching Marketplace
  const categories = [
    'Electronics',
    'Photography',
    'Computing',
    'Gaming',
    'Audio',
    'Drones',
    'Sports',
    'Fashion',
    'Home',
    'Books',
    'Other',
  ];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    deposit: '',
    isForRent: false,
    category: 'Electronics',
    imageFile: null,
    imageUrl: '',
    imagePreview: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const textColor = useColorModeValue('gray.800', 'gray.50');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('white', 'whiteAlpha.100');
  const inputBorder = useColorModeValue('gray.300', 'whiteAlpha.300');

  // Real-time validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Title is required';
        } else if (value.length < 3) {
          newErrors.title = 'Title must be at least 3 characters';
        } else if (value.length > 200) {
          newErrors.title = 'Title must not exceed 200 characters';
        } else {
          delete newErrors.title;
        }
        break;

      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.length < 10) {
          newErrors.description = 'Description must be at least 10 characters';
        } else if (value.length > 5000) {
          newErrors.description = 'Description must not exceed 5000 characters';
        } else {
          delete newErrors.description;
        }
        break;

      case 'price':
        if (!value || parseFloat(value) <= 0) {
          newErrors.price = 'Price must be greater than 0';
        } else {
          delete newErrors.price;
        }
        break;

      case 'deposit':
        if (formData.isForRent && value && parseFloat(value) < 0) {
          newErrors.deposit = 'Deposit must be 0 or greater';
        } else {
          delete newErrors.deposit;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'imageFile' && files.length > 0) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imageUrl: '',
        imagePreview: URL.createObjectURL(file),
      }));
      delete errors.imageFile;
    } else if (name === 'imageUrl') {
      setFormData((prev) => ({
        ...prev,
        imageUrl: value,
        imageFile: null,
        imagePreview: value,
      }));
      delete errors.imageFile;
    } else {
      const newValue = type === 'checkbox' ? checked : value;
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));

      // Validate on change if field has been touched
      if (touched[name]) {
        validateField(name, newValue);
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected || !isAuthenticated || !contract) {
      toast({
        title: 'Error',
        description:
          'Please ensure you are signed in, your wallet is connected, and the contract is loaded.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    // Comprehensive validation
    const validationErrors = [];

    // Mark all fields as touched
    setTouched({
      title: true,
      description: true,
      price: true,
      deposit: true,
    });

    if (!formData.title?.trim()) {
      validationErrors.push('Title is required');
      setErrors((prev) => ({ ...prev, title: 'Title is required' }));
    } else if (formData.title.length < 3) {
      validationErrors.push('Title must be at least 3 characters');
      setErrors((prev) => ({
        ...prev,
        title: 'Title must be at least 3 characters',
      }));
    } else if (formData.title.length > 200) {
      validationErrors.push('Title must not exceed 200 characters');
      setErrors((prev) => ({
        ...prev,
        title: 'Title must not exceed 200 characters',
      }));
    }

    if (!formData.description?.trim()) {
      validationErrors.push('Description is required');
      setErrors((prev) => ({
        ...prev,
        description: 'Description is required',
      }));
    } else if (formData.description.length < 10) {
      validationErrors.push('Description must be at least 10 characters');
      setErrors((prev) => ({
        ...prev,
        description: 'Description must be at least 10 characters',
      }));
    } else if (formData.description.length > 5000) {
      validationErrors.push('Description must not exceed 5000 characters');
      setErrors((prev) => ({
        ...prev,
        description: 'Description must not exceed 5000 characters',
      }));
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      validationErrors.push('Price must be greater than 0');
      setErrors((prev) => ({ ...prev, price: 'Price must be greater than 0' }));
    }

    if (
      formData.isForRent &&
      formData.deposit &&
      parseFloat(formData.deposit) < 0
    ) {
      validationErrors.push('Deposit must be 0 or greater');
      setErrors((prev) => ({
        ...prev,
        deposit: 'Deposit must be 0 or greater',
      }));
    }

    if (!formData.imageUrl?.trim() && !formData.imageFile) {
      validationErrors.push('Image URL or image file is required');
      setErrors((prev) => ({ ...prev, imageFile: 'Image is required' }));
    }

    if (validationErrors.length > 0) {
      toast({
        title: 'Please fix validation errors',
        description: 'Check the form for errors and try again',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsCreating(true);

    try {
      let imageUrl = formData.imageUrl;
      if (formData.imageFile) {
        imageUrl = await uploadFileToIPFS(formData.imageFile);
      }

      const metadata = createListingMetadata({ ...formData, imageUrl });
      const validation = validateMetadata(metadata);
      if (!validation.isValid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsCreating(false);
        return;
      }

      const ipfsHash = await uploadToIPFS(metadata);
      const priceWei = ethers.utils.parseEther(formData.price);
      const depositWei =
        formData.isForRent && formData.deposit
          ? ethers.utils.parseEther(formData.deposit)
          : 0;

      const tx = await withRetry(() =>
        contract.createListing(
          formData.category,
          priceWei,
          depositWei,
          ipfsHash,
          formData.isForRent
        )
      );
      const receipt = await tx.wait();
      const listingCreatedEvent = receipt.events?.find(
        (e) => e.event === 'ListingCreated'
      );
      const createdListingId = listingCreatedEvent?.args?.listingId.toString();
      const sellerAddress = await contract.signer.getAddress();

      // Cache listing in backend database
      const newListingData = {
        blockchainId: createdListingId,
        seller: sellerAddress,
        isForRent: formData.isForRent,
        price: formData.price,
        deposit: formData.deposit || '0',
        ipfsHash: ipfsHash,
        metadata: {
          title: formData.title,
          description: formData.description,
          image: imageUrl,
          images: [imageUrl],
          category: formData.category,
        },
        transactionHash: receipt.transactionHash,
      };

      try {
        await apiRequest(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/listings`,
          {
            method: 'POST',
            body: JSON.stringify(newListingData),
          }
        );
      } catch (apiError) {
        console.error('Failed to cache listing in backend:', apiError);
        // Don't fail the whole operation if backend cache fails
      }

      toast({
        title: 'Success',
        description: 'Listing created!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form and errors
      setFormData({
        title: '',
        description: '',
        price: '',
        deposit: '',
        isForRent: false,
        category: 'Electronics',
        imageFile: null,
        imageUrl: '',
        imagePreview: '',
      });
      setErrors({});
      setTouched({});

      // Redirect to marketplace after 2 seconds
      setTimeout(() => {
        navigate('/marketplace');
      }, 2000);
    } catch (error) {
      // Handle transaction failure
      toast({
        title: 'Error',
        description: error.message || 'Error creating listing',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box
      minH="100vh"
      pt={20}
      bgGradient={useColorModeValue(
        gradients.subtle.blue,
        gradients.dark.background
      )}
      position="relative"
      overflow="hidden"
    >
      {/* Animated Background Elements */}
      <MotionBox
        position="absolute"
        top="-10%"
        right="-5%"
        width="500px"
        height="500px"
        borderRadius="full"
        bgGradient={gradients.primary}
        opacity={0.08}
        filter="blur(100px)"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <MotionBox
        position="absolute"
        bottom="-10%"
        left="-5%"
        width="500px"
        height="500px"
        borderRadius="full"
        bgGradient={gradients.secondary}
        opacity={0.08}
        filter="blur(100px)"
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [90, 0, 90],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <Container maxW="container.lg" py={12} position="relative" zIndex={1}>
        <VStack spacing={10} align="stretch">
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={3} textAlign="center">
              <HStack justify="center" spacing={3}>
                <Box
                  p={3}
                  borderRadius="xl"
                  bgGradient={gradients.cosmic}
                  boxShadow="0 8px 24px rgba(0, 102, 255, 0.3)"
                >
                  <Icon as={FiPackage} boxSize={8} color="white" />
                </Box>
                <Heading
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="900"
                  color={textColor}
                >
                  Create New Listing
                </Heading>
              </HStack>
              <Text fontSize="xl" color={secondaryTextColor} fontWeight="500">
                List your asset on the blockchain marketplace
              </Text>
            </VStack>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit}>
              <ModernCard>
                <VStack spacing={8}>
                  <FormControl
                    isRequired
                    isInvalid={errors.title && touched.title}
                  >
                    <FormLabel color={textColor} fontWeight="600" fontSize="md">
                      Item Title
                    </FormLabel>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g., Canon EOS R5 Camera"
                      size="lg"
                      bg={inputBg}
                      borderColor={inputBorder}
                      borderWidth="2px"
                      borderRadius="xl"
                      _hover={{ borderColor: 'brand.400' }}
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.1)',
                      }}
                    />
                    {errors.title && touched.title && (
                      <FormErrorMessage>{errors.title}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl
                    isRequired
                    isInvalid={errors.description && touched.description}
                  >
                    <FormLabel color={textColor} fontWeight="600" fontSize="md">
                      Description
                    </FormLabel>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Describe your item in detail..."
                      size="lg"
                      rows={6}
                      bg={inputBg}
                      borderColor={inputBorder}
                      borderWidth="2px"
                      borderRadius="xl"
                      _hover={{ borderColor: 'brand.400' }}
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.1)',
                      }}
                    />
                    {errors.description && touched.description && (
                      <FormErrorMessage>{errors.description}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={textColor} fontWeight="600" fontSize="md">
                      Category
                    </FormLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      size="lg"
                      bg={inputBg}
                      borderColor={inputBorder}
                      borderWidth="2px"
                      borderRadius="xl"
                      _hover={{ borderColor: 'brand.400' }}
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.1)',
                      }}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
                    <FormControl>
                      <FormLabel
                        color={textColor}
                        fontWeight="600"
                        fontSize="md"
                      >
                        Listing Type
                      </FormLabel>
                      <HStack
                        p={4}
                        bg={inputBg}
                        borderRadius="xl"
                        borderWidth="2px"
                        borderColor={inputBorder}
                        justify="space-between"
                      >
                        <Text
                          fontWeight="600"
                          color={!formData.isForRent ? 'brand.500' : textColor}
                        >
                          For Sale
                        </Text>
                        <Switch
                          name="isForRent"
                          isChecked={formData.isForRent}
                          onChange={handleInputChange}
                          size="lg"
                          colorScheme="brand"
                        />
                        <Text
                          fontWeight="600"
                          color={formData.isForRent ? 'brand.500' : textColor}
                        >
                          For Rent
                        </Text>
                      </HStack>
                    </FormControl>
                    <FormControl
                      isRequired
                      isInvalid={errors.price && touched.price}
                    >
                      <FormLabel
                        color={textColor}
                        fontWeight="600"
                        fontSize="md"
                      >
                        {formData.isForRent
                          ? 'Rental Price (MATIC)'
                          : 'Sale Price (MATIC)'}
                      </FormLabel>
                      <Input
                        name="price"
                        type="number"
                        step="0.001"
                        value={formData.price}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="e.g., 1.5"
                        size="lg"
                        bg={inputBg}
                        borderColor={inputBorder}
                        borderWidth="2px"
                        borderRadius="xl"
                        _hover={{ borderColor: 'brand.400' }}
                        _focus={{
                          borderColor: 'brand.500',
                          boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.1)',
                        }}
                      />
                      {errors.price && touched.price && (
                        <FormErrorMessage>{errors.price}</FormErrorMessage>
                      )}
                    </FormControl>
                  </SimpleGrid>

                  {formData.isForRent && (
                    <FormControl isInvalid={errors.deposit && touched.deposit}>
                      <FormLabel
                        color={textColor}
                        fontWeight="600"
                        fontSize="md"
                      >
                        Security Deposit (MATIC)
                      </FormLabel>
                      <Input
                        name="deposit"
                        type="number"
                        step="0.001"
                        value={formData.deposit}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="e.g., 0.5"
                        size="lg"
                        bg={inputBg}
                        borderColor={inputBorder}
                        borderWidth="2px"
                        borderRadius="xl"
                        _hover={{ borderColor: 'brand.400' }}
                        _focus={{
                          borderColor: 'brand.500',
                          boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.1)',
                        }}
                      />
                      {errors.deposit && touched.deposit && (
                        <FormErrorMessage>{errors.deposit}</FormErrorMessage>
                      )}
                    </FormControl>
                  )}

                  <FormControl>
                    <FormLabel color={textColor} fontWeight="600" fontSize="md">
                      Item Image
                    </FormLabel>
                    <VStack spacing={4} align="stretch">
                      <Box
                        p={6}
                        borderWidth="2px"
                        borderStyle="dashed"
                        borderColor={inputBorder}
                        borderRadius="xl"
                        bg={inputBg}
                        textAlign="center"
                        cursor="pointer"
                        transition="all 0.3s"
                        _hover={{
                          borderColor: 'brand.500',
                          bg: useColorModeValue('brand.50', 'whiteAlpha.50'),
                        }}
                      >
                        <VStack spacing={3}>
                          <Icon as={FiUpload} boxSize={10} color="brand.500" />
                          <Text fontWeight="600" color={textColor}>
                            Upload Image
                          </Text>
                          <Input
                            type="file"
                            name="imageFile"
                            accept="image/*"
                            onChange={handleInputChange}
                            position="absolute"
                            opacity={0}
                            cursor="pointer"
                          />
                        </VStack>
                      </Box>

                      <HStack>
                        <Divider />
                        <Text
                          fontSize="sm"
                          color={secondaryTextColor}
                          fontWeight="600"
                        >
                          OR
                        </Text>
                        <Divider />
                      </HStack>

                      <Input
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="Enter Image URL"
                        size="lg"
                        bg={inputBg}
                        borderColor={inputBorder}
                        borderWidth="2px"
                        borderRadius="xl"
                        _hover={{ borderColor: 'brand.400' }}
                        _focus={{
                          borderColor: 'brand.500',
                          boxShadow: '0 0 0 3px rgba(0, 102, 255, 0.1)',
                        }}
                      />

                      {formData.imagePreview && (
                        <Box
                          borderRadius="xl"
                          overflow="hidden"
                          borderWidth="2px"
                          borderColor={inputBorder}
                        >
                          <Image
                            src={formData.imagePreview}
                            alt="Preview"
                            w="full"
                            maxH="400px"
                            objectFit="cover"
                          />
                        </Box>
                      )}
                    </VStack>
                  </FormControl>

                  <GradientButton
                    type="submit"
                    variant="cosmic"
                    size="lg"
                    w="full"
                    isLoading={isCreating}
                    loadingText="Creating Listing..."
                    leftIcon={<Icon as={FiPlus} />}
                    fontSize="lg"
                    py={7}
                  >
                    Create Listing
                  </GradientButton>
                </VStack>
              </ModernCard>
            </form>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

export default CreateListing;
