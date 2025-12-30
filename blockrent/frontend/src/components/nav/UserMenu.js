import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  Avatar,
  Icon,
} from '@chakra-ui/react';
import React from 'react';
import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiList,
  FiShoppingCart,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

const UserMenu = ({ user, logout, disconnect, onManageWallets }) => {
  return (
    <Menu>
      <MenuButton
        as={Button}
        rounded={'full'}
        variant={'link'}
        cursor={'pointer'}
        minW={0}
      >
        <Avatar
          size={'sm'}
          name={user?.displayName || user?.username}
          src={user?.avatar}
        />
      </MenuButton>
      <MenuList>
        <MenuItem as={RouterLink} to="/dashboard">
          <Icon as={FiUser} mr={2} />
          Dashboard
        </MenuItem>
        <MenuItem as={RouterLink} to="/listings">
          <Icon as={FiList} mr={2} />
          My Listings
        </MenuItem>
        <MenuItem as={RouterLink} to="/purchases">
          <Icon as={FiShoppingCart} mr={2} />
          My Purchases
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={onManageWallets}>
          <Icon as={FiSettings} mr={2} />
          Manage Wallets
        </MenuItem>
        <MenuDivider />
        <MenuItem
          onClick={() => {
            logout();
            disconnect();
          }}
        >
          <Icon as={FiLogOut} mr={2} />
          Sign Out
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default UserMenu;
