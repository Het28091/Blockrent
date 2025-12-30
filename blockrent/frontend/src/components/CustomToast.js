import {
  Box,
  HStack,
  Icon,
  Text,
  CloseButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
} from 'react-icons/fi';

import gradients from '../theme/gradients';

const MotionBox = motion(Box);

/**
 * CustomToast Component
 * Modern, animated toast notifications with gradient accents
 *
 * Usage:
 * See useModernToast hook for easy usage
 */
const CustomToast = ({ status = 'info', title, description, onClose }) => {
  const icons = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertTriangle,
    info: FiInfo,
  };

  const gradientMap = {
    success: gradients.success,
    error: gradients.error,
    warning: gradients.warning,
    info: gradients.info,
  };

  const bg = useColorModeValue(
    'rgba(255, 255, 255, 0.98)',
    'rgba(45, 55, 72, 0.98)'
  );

  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const closeButtonHoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <MotionBox
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      bg={bg}
      backdropFilter="blur(20px)"
      borderRadius="xl"
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
      p={4}
      minW="300px"
      maxW="500px"
      border="1px solid"
      borderColor={borderColor}
      position="relative"
      overflow="hidden"
    >
      {/* Gradient accent bar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="3px"
        bgGradient={gradientMap[status]}
      />

      <HStack spacing={3} align="start">
        <Box
          p={2}
          borderRadius="lg"
          bgGradient={gradientMap[status]}
          flexShrink={0}
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
        >
          <Icon as={icons[status]} boxSize={5} color="white" />
        </Box>
        <Box flex={1}>
          <Text fontWeight="bold" fontSize="md" mb={1}>
            {title}
          </Text>
          {description && (
            <Text fontSize="sm" color={textColor} lineHeight="tall">
              {description}
            </Text>
          )}
        </Box>
        <CloseButton
          size="sm"
          onClick={onClose}
          borderRadius="md"
          _hover={{
            bg: closeButtonHoverBg,
          }}
        />
      </HStack>
    </MotionBox>
  );
};

export default CustomToast;
