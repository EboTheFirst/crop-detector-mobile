/**
 * Network Status Hook
 * Monitors network connectivity and provides offline/online status
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { NetworkStatus } from '@/types';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  status: NetworkStatus;
}

export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    status: 'online',
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      
      let status: NetworkStatus = 'offline';
      
      if (isConnected && isInternetReachable) {
        // Check connection quality based on type
        if (state.type === 'wifi' || state.type === 'ethernet') {
          status = 'online';
        } else if (state.type === 'cellular') {
          // For cellular, we could check signal strength if available
          status = 'online';
        } else {
          status = 'poor';
        }
      } else if (isConnected && !isInternetReachable) {
        status = 'poor';
      }

      setNetworkState({
        isConnected,
        isInternetReachable,
        type: state.type || 'unknown',
        status,
      });
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      
      let status: NetworkStatus = 'offline';
      
      if (isConnected && isInternetReachable) {
        status = 'online';
      } else if (isConnected && !isInternetReachable) {
        status = 'poor';
      }

      setNetworkState({
        isConnected,
        isInternetReachable,
        type: state.type || 'unknown',
        status,
      });
    });

    return unsubscribe;
  }, []);

  return {
    ...networkState,
    isOnline: networkState.status === 'online',
    isOffline: networkState.status === 'offline',
    isPoorConnection: networkState.status === 'poor',
  };
}
