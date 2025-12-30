import { Box, Text, VStack, HStack } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

const fonts = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Lucida Console, monospace',
  'Verdana, sans-serif',
  'Tahoma, sans-serif',
  'Trebuchet MS, sans-serif',
];

const LoadingAnimation = ({ onAnimationComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onAnimationComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  const text = 'Blockrent';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
    exit: {
      y: '-100vh',
      opacity: 0,
      transition: {
        duration: 1,
        ease: 'easeInOut',
      },
    },
  };

  const letterVariants = {
    hidden: { y: '-100vh', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 10,
        stiffness: 100,
      },
    },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Box
            position="fixed"
            top="0"
            left="0"
            width="100vw"
            height="100vh"
            bg="gray.900"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex="9999"
          >
            <HStack spacing={2}>
              {text.split('').map((char, index) => (
                <motion.div key={index} variants={letterVariants}>
                  <Text
                    fontSize="6xl"
                    fontWeight="bold"
                    color="white"
                    fontFamily={fonts[index % fonts.length]}
                  >
                    {char}
                  </Text>
                </motion.div>
              ))}
            </HStack>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingAnimation;
