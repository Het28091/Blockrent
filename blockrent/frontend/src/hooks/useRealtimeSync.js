import { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const useRealtimeSync = (userId, onMarketplaceUpdate) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const onMarketplaceUpdateRef = useRef(onMarketplaceUpdate);

  // Update the ref when the callback changes
  useEffect(() => {
    onMarketplaceUpdateRef.current = onMarketplaceUpdate;
  }, [onMarketplaceUpdate]);

  useEffect(() => {
    // Only initialize socket if we have a userId
    if (!userId) return;

    // Initialize socket connection with better error handling
    const newSocket = io('http://localhost:5000', {
      timeout: 10000,
      forceNew: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5,
    });
    setTimeout(() => setSocket(newSocket), 0);

    // Connection event handlers
    newSocket.on('connect', () => {
      setIsConnected(true);

      // Join user room for personal updates
      if (userId) {
        newSocket.emit('joinUserRoom', userId);
      }

      // Join marketplace room for global updates
      newSocket.emit('joinMarketplace');
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
    });

    newSocket.on('reconnect_error', (error) => {});

    newSocket.on('reconnect_failed', () => {
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      setIsConnected(false);
    });

    // Listen for marketplace updates
    newSocket.on('marketplace_update', (data) => {
      if (onMarketplaceUpdateRef.current) {
        onMarketplaceUpdateRef.current(data);
      }
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [userId]); // Only depend on userId, not onMarketplaceUpdate

  return {
    socket,
    isConnected,
    emit: (event, data) => socket?.emit(event, data),
    on: (event, callback) => socket?.on(event, callback),
    off: (event, callback) => socket?.off(event, callback),
  };
};

export default useRealtimeSync;
