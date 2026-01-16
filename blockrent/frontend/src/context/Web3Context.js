import { ethers } from 'ethers';
import React, { createContext, useContext, useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import BlockrentV2 from '../abis/BlockrentV2.json';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0');
  const [web3Modal, setWeb3Modal] = useState(null);

  const LOCALHOST_CHAIN_ID_HEX = '0x7a69'; // 31337
  const MUMBAI_CHAIN_ID = '0x13881'; // 80001
  const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

  useEffect(() => {
    const providerOptions = {
      // Example for WalletConnect (requires package installation)
      // walletconnect: {
      //   package: WalletConnectProvider,
      //   options: {
      //     infuraId: "YOUR_INFURA_ID"
      //   }
      // }
    };

    const newWeb3Modal = new Web3Modal({
      cacheProvider: true, // optional
      providerOptions, // required
      disableInjectedProvider: false, // Ensure injected providers (MetaMask) are enabled
      theme: 'dark',
    });

    setWeb3Modal(newWeb3Modal);
  }, []);

  const connectWallet = async () => {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error(
        'MetaMask is not installed. Please install MetaMask extension.'
      );
    }

    if (!web3Modal) {
      throw new Error('Web3Modal not initialized');
    }

    setIsConnecting(true);

    try {
      // Clear any cached provider first to force fresh connection
      web3Modal.clearCachedProvider();

      const instance = await web3Modal.connect();
      const web3Provider = new ethers.providers.Web3Provider(instance);
      const signer = web3Provider.getSigner();
      const accounts = await web3Provider.listAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error(
          'No accounts found. Please unlock your MetaMask wallet.'
        );
      }

      const network = await web3Provider.getNetwork();

      if (network.chainId !== 31337 && network.chainId !== 80001) {
        // Try to switch network
        try {
          await instance.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: LOCALHOST_CHAIN_ID_HEX }],
          });
        } catch (err) {
          // Network switch failed - user needs to switch manually
        }
      }

      if (CONTRACT_ADDRESS && BlockrentV2.abi) {
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          BlockrentV2.abi,
          signer
        );
        setContract(contractInstance);
      }

      setProvider(web3Provider);
      setAccount(accounts[0]);

      // Update balance
      const balRaw = await web3Provider.getBalance(accounts[0]);
      setBalance(ethers.utils.formatEther(balRaw));

      // Subscribe to accounts change
      instance.on('accountsChanged', (accounts) => {
        console.log('Account changed:', accounts);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Update balance for new account
          web3Provider.getBalance(accounts[0]).then((bal) => {
            setBalance(ethers.utils.formatEther(bal));
          });
        } else {
          console.log('No accounts, disconnecting...');
          disconnect();
        }
      });

      // Subscribe to chainId change
      instance.on('chainChanged', (chainId) => {
        console.log('Chain changed to:', chainId);
        // Reload to reset state for new chain
        window.location.reload();
      });

      // Subscribe to provider connection
      instance.on('connect', (info) => {
        console.log('Provider connected:', info);
      });

      // Subscribe to provider disconnection
      instance.on('disconnect', (error) => {
        console.log('Provider disconnected:', error);
        disconnect();
      });

      return { account: accounts[0], provider: web3Provider };
    } finally {
      setIsConnecting(false);
    }
  };


  const disconnect = async () => {
    try {
      if (web3Modal) {
        web3Modal.clearCachedProvider();
      }

      // Clear all state
      setAccount('');
      setProvider(null);
      setContract(null);
      setBalance('0');

      // Clear localStorage
      localStorage.removeItem('sessionId');
      localStorage.removeItem('walletAddress');

      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error during disconnect:', error);
      // Force clear state even if error occurs
      setAccount('');
      setProvider(null);
      setContract(null);
      setBalance('0');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const value = {
    account,
    provider,
    contract,
    isConnecting,
    balance,
    connectWallet,
    disconnect,
    formatAddress,
    isConnected: !!account,
    CONTRACT_ADDRESS,
    withRetry: async (fn) => fn(), // Simplified retry for now
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
