import { Link, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const NavLink = ({ to, children }) => {
  const color = useColorModeValue('brand.gray', 'brand.white');
  const hoverColor = useColorModeValue('brand.primary', 'brand.primary');

  return (
    <Link
      as={RouterLink}
      to={to}
      px={2}
      py={1}
      rounded={'md'}
      color={color}
      _hover={{
        textDecoration: 'none',
        color: hoverColor,
      }}
    >
      {children}
    </Link>
  );
};

export default NavLink;
