import { Button, HStack } from '@chakra-ui/react';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const AuthButtons = () => {
  return (
    <HStack spacing={3}>
      <Button as={RouterLink} to="/signin" variant="ghost">
        Sign In
      </Button>
      <Button as={RouterLink} to="/signup" variant="solid">
        Sign Up
      </Button>
    </HStack>
  );
};

export default AuthButtons;
