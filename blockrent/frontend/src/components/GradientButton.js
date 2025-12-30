import { Button, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';

import gradients from '../theme/gradients';

const MotionButton = motion(Button);

/**
 * GradientButton Component
 * Beautiful gradient buttons with animations and variants
 *
 * Usage:
 * <GradientButton variant="primary">Click Me</GradientButton>
 * <GradientButton variant="success" size="lg">Success</GradientButton>
 * <GradientButton variant="cosmic" isLoading>Loading</GradientButton>
 */
const GradientButton = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  onClick,
  ...props
}) => {
  // Gradient mappings
  const gradientMap = {
    primary: {
      light: gradients.primary,
      dark: gradients.dark.primary,
      hover: gradients.primaryHover,
    },
    secondary: {
      light: gradients.secondary,
      dark: gradients.dark.secondary,
      hover: gradients.secondaryHover,
    },
    success: {
      light: gradients.success,
      dark: gradients.dark.success,
      hover: gradients.successHover,
    },
    warning: {
      light: gradients.warning,
      dark: gradients.dark.warning,
      hover: gradients.warningHover,
    },
    error: {
      light: gradients.error,
      dark: gradients.error,
      hover: gradients.errorHover,
    },
    cosmic: {
      light: gradients.cosmic,
      dark: gradients.dark.cosmic,
      hover: gradients.cosmic,
    },
    ocean: {
      light: gradients.ocean,
      dark: gradients.dark.ocean,
      hover: gradients.ocean,
    },
    neon: {
      light: gradients.neon,
      dark: gradients.neon,
      hover: gradients.neon,
    },
  };

  const selectedGradient = gradientMap[variant] || gradientMap.primary;

  const bgGradient = useColorModeValue(
    selectedGradient.light,
    selectedGradient.dark
  );

  return (
    <MotionButton
      bgGradient={bgGradient}
      color="white"
      size={size}
      isLoading={isLoading}
      isDisabled={isDisabled}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      onClick={onClick}
      fontWeight="600"
      borderRadius="xl"
      border="none"
      position="relative"
      overflow="hidden"
      _hover={{
        bgGradient: selectedGradient.hover,
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        _disabled: {
          transform: 'none',
          bgGradient: bgGradient,
        },
      }}
      _active={{
        transform: 'translateY(0)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
      _focus={{
        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
      }}
      _disabled={{
        opacity: 0.6,
        cursor: 'not-allowed',
      }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      {...props}
    >
      {/* Shine effect overlay */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          pointerEvents: 'none',
        }}
        animate={{
          left: ['100%', '-100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      />
      {children}
    </MotionButton>
  );
};

export default GradientButton;
