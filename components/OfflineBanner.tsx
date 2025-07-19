/**
 * Offline Banner Component
 * Shows network status and offline mode indicator
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedIcon } from './ThemedIcon';

interface OfflineBannerProps {
  onRetry?: () => void;
  showWhenOnline?: boolean;
}

export function OfflineBanner({ onRetry, showWhenOnline = false }: OfflineBannerProps) {
  const { status, isOnline, isPoorConnection } = useNetworkStatus();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  // Get theme colors
  const successColor = useThemeColor({}, 'successColor');
  const warningColor = useThemeColor({}, 'warningColor');
  const errorColor = useThemeColor({}, 'errorColor');

  React.useEffect(() => {
    const shouldShow = !isOnline || isPoorConnection || showWhenOnline;
    
    Animated.timing(fadeAnim, {
      toValue: shouldShow ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, isPoorConnection, showWhenOnline, fadeAnim]);

  const getBannerStyle = () => {
    if (isOnline && !isPoorConnection) {
      return { backgroundColor: successColor };
    } else if (isPoorConnection) {
      return { backgroundColor: warningColor };
    } else {
      return { backgroundColor: errorColor };
    }
  };

  const getIcon = () => {
    if (isOnline && !isPoorConnection) {
      return 'wifi';
    } else if (isPoorConnection) {
      return 'wifi-outline';
    } else {
      return 'cloud-offline';
    }
  };

  const getMessage = () => {
    if (isOnline && !isPoorConnection) {
      return 'Connected';
    } else if (isPoorConnection) {
      return 'Poor connection - Some features may be limited';
    } else {
      return 'No internet connection - Using offline mode';
    }
  };

  const getTextColor = () => {
    if (isOnline && !isPoorConnection) {
      return '#fff';
    } else {
      return '#fff';
    }
  };

  if (isOnline && !showWhenOnline && !isPoorConnection) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.banner, getBannerStyle()]}>
        <View style={styles.content}>
          <ThemedIcon
            name={getIcon() as any}
            size={20}
            lightColor={getTextColor()}
            darkColor={getTextColor()}
            style={styles.icon}
          />
          <Text style={[styles.message, { color: getTextColor() }]}>
            {getMessage()}
          </Text>
        </View>

        {(!isOnline || isPoorConnection) && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <ThemedIcon name="refresh" size={16} lightColor="#fff" darkColor="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  // Banner colors will be set dynamically
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
