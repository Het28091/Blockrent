import { ethers } from 'ethers';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { useWeb3 } from './Web3Context';

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const PII_THRESHOLD_MATIC = 13000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { account, isConnected, provider } = useWeb3();
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsPiiCollection, setNeedsPiiCollection] = useState(false);

  // Always require an explicit sign-in
  useEffect(() => {
    const savedSessionId = localStorage.getItem('sessionId');
    const savedWallet = localStorage.getItem('walletAddress');

    if (savedSessionId || savedWallet) {
      clearAuth();
    }
  }, []);

  // Disconnect if wallet is disconnected while authenticated
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      clearAuth();
    }
  }, [isConnected, isAuthenticated]);

  const validateSession = async (sessionIdToValidate, walletAddress) => {
    try {
      if (!window.ethereum) {
        clearAuth();
        return false;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      const walletConnected = accounts.some(
        (acc) => acc.toLowerCase() === walletAddress.toLowerCase()
      );

      if (!walletConnected) {
        clearAuth();
        return false;
      }

      const response = await fetch(`${API_URL}/api/auth/session`, {
        headers: {
          Authorization: `Bearer ${sessionIdToValidate}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessionId(sessionIdToValidate);
          setIsAuthenticated(true);

          const userResponse = await fetch(
            `${API_URL}/api/users/${walletAddress}`
          );
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
          }
          return true;
        }
      }

      clearAuth();
      return false;
    } catch (error) {
      clearAuth();
      return false;
    }
  };

  const clearAuth = () => {
    setSessionId(null);
    setUser(null);
    setIsAuthenticated(false);
    setNeedsPiiCollection(false);
    localStorage.removeItem('sessionId');
    localStorage.removeItem('walletAddress');
  };

  const login = async (walletAddress = account) => {
    const providedWallet =
      typeof walletAddress === 'string' ? walletAddress.trim() : '';

    if (!providedWallet) {
      throw new Error('No wallet connected. Please connect your wallet first.');
    }

    const normalizedWallet = providedWallet.toLowerCase();

    setIsLoading(true);
    try {
      const nonceResponse = await fetch(`${API_URL}/api/auth/nonce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: normalizedWallet }),
      });

      if (!nonceResponse.ok) {
        const error = await nonceResponse.json();
        throw new Error(
          error.error || 'Failed to get authentication nonce from server'
        );
      }

      const { nonce, message } = await nonceResponse.json();

      let signature;
      try {
        signature = await signMessage(message, normalizedWallet);
      } catch (signError) {
        if (signError.message?.includes('rejected')) {
          throw new Error('User rejected signature request');
        }
        throw signError;
      }

      const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: normalizedWallet,
          signature,
          message,
          nonce,
        }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(
          error.message || error.error || 'Authentication verification failed'
        );
      }

      const data = await verifyResponse.json();

      setSessionId(data.sessionId);
      setIsAuthenticated(true);
      localStorage.setItem('sessionId', data.sessionId);

      const effectiveWalletAddress = data.walletAddress
        ? data.walletAddress.toLowerCase()
        : normalizedWallet;
      localStorage.setItem('walletAddress', effectiveWalletAddress);

      const userResponse = await fetch(
        `${API_URL}/api/users/${effectiveWalletAddress}`
      );
      let userData;
      if (userResponse.ok) {
        userData = await userResponse.json();
        setUser(userData);
        setNeedsPiiCollection(!userData?.piiProvided);
      } else {
        userData = {
          walletAddress: effectiveWalletAddress,
          username: null,
          profileData: {},
          reputation: 0,
          totalRatings: 0,
          piiProvided: false,
        };
        setUser(userData);
        setNeedsPiiCollection(true);
      }

      return { success: true, sessionId: data.sessionId, user: userData };
    } finally {
      setIsLoading(false);
    }
  };

  const signMessage = async (message, expectedWallet = account) => {
    let activeProvider = provider;

    if (!activeProvider && window.ethereum) {
      activeProvider = new ethers.providers.Web3Provider(window.ethereum);
    }

    if (!activeProvider) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      if (activeProvider.provider?.request) {
        try {
          await activeProvider.provider.request({
            method: 'eth_requestAccounts',
          });
        } catch (requestError) {
          if (requestError?.code === 4001) {
            throw new Error('User rejected wallet connection request');
          }
          throw requestError;
        }
      }

      const signer = activeProvider.getSigner();

      if (expectedWallet) {
        try {
          const signerAddress = await signer.getAddress();
          if (signerAddress.toLowerCase() !== expectedWallet.toLowerCase()) {
            console.warn(
              'Connected wallet does not match expected wallet address',
              {
                signerAddress,
                expectedWallet,
              }
            );
          }
        } catch (addressError) {
          console.warn('Failed to verify signer address', addressError);
        }
      }

      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      if (
        error.code === 4001 ||
        error.code === 'ACTION_REJECTED' ||
        error.message?.includes('User denied') ||
        error.message?.includes('rejected')
      ) {
        throw new Error('User rejected signature request');
      }
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    if (!user || !isAuthenticated) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    try {
      const response = await apiRequest(
        `${API_URL}/api/users/${user.walletAddress}`,
        {
          method: 'PUT',
          body: JSON.stringify(profileData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
      setNeedsPiiCollection(!data.user?.piiProvided);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (sessionId) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });
      }
    } catch (error) {
      // Ignore logout errors and clear local state regardless
    } finally {
      clearAuth();
    }
  };

  const getAuthHeaders = () => {
    if (!sessionId) {
      return {
        'Content-Type': 'application/json',
      };
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionId}`,
    };
  };

  const apiRequest = async (url, options = {}) => {
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      clearAuth();
      throw new Error('Authentication expired. Please sign in again.');
    }

    return response;
  };

  const submitPiiDetails = async (piiDetails) => {
    const { fullName, phoneNumber, address } = piiDetails || {};
    if (!fullName || !phoneNumber || !address) {
      throw new Error('All fields are required to complete verification.');
    }

    const updatedUser = await updateProfile({ fullName, phoneNumber, address });
    return updatedUser;
  };

  const value = {
    user,
    sessionId,
    isLoading,
    isAuthenticated,
    needsPiiCollection,
    piiThreshold: PII_THRESHOLD_MATIC,
    login,
    updateProfile,
    submitPiiDetails,
    logout,
    getAuthHeaders,
    apiRequest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
