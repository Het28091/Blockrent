import { Box, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';

const MotionBox = motion(Box);

/**
 * ModernCard Component
 * A beautiful glassmorphism card with smooth animations
 *
 * Features:
 * - Glassmorphism effect with backdrop blur
 * - Smooth hover animations (lift + shadow)
 * - Fade-in entrance animation
 * - Customizable via props
 *
 * Usage:
 * <ModernCard>Your content here</ModernCard>
 * <ModernCard variant="solid">Solid background</ModernCard>
 * <ModernCard noHover>No hover effect</ModernCard>
 */
const ModernCard = ({
  children,
  variant = 'glass',
  noHover = false,
  noAnimation = false,
  ...props
}) => {
  // Glass variant colors
  const glassBg = useColorModeValue(
    'rgba(255, 255, 255, 0.9)',
    'rgba(45, 55, 72, 0.95)'
  );

  const glassBorder = useColorModeValue(
    'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.15)'
  );

  const glassShadow = useColorModeValue(
    '0 8px 32px rgba(31, 38, 135, 0.15)',
    '0 8px 32px rgba(0, 0, 0, 0.5)'
  );

  const glassHoverShadow = useColorModeValue(
    '0 20px 40px rgba(0, 0, 0, 0.15)',
    '0 20px 40px rgba(0, 0, 0, 0.6)'
  );

  // Solid variant colors
  const solidBg = useColorModeValue('white', 'gray.700');
  const solidBorder = useColorModeValue('gray.200', 'gray.600');

  // Select colors based on variant
  const bg = variant === 'glass' ? glassBg : solidBg;
  const borderColor = variant === 'glass' ? glassBorder : solidBorder;

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  };

  // Hover animation
  const hoverAnimation = noHover
    ? {}
    : {
        y: -8,
        boxShadow: glassHoverShadow,
      };

  return (
    <MotionBox
      bg={bg}
      backdropFilter={
        variant === 'glass' ? 'blur(20px) saturate(180%)' : 'none'
      }
      WebkitBackdropFilter={
        variant === 'glass' ? 'blur(20px) saturate(180%)' : 'none'
      }
      borderRadius="2xl"
      border="1px solid"
      borderColor={borderColor}
      boxShadow={glassShadow}
      p={6}
      overflow="hidden"
      position="relative"
      initial={noAnimation ? false : 'hidden'}
      animate={noAnimation ? false : 'visible'}
      variants={noAnimation ? {} : cardVariants}
      whileHover={hoverAnimation}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

export default ModernCard;
