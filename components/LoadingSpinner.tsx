/**
 * Loading Spinner Component
 * Reusable loading indicator with customizable message and progress
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ThemedText } from './ThemedText';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  progress?: number; // 0-1 for progress indication
  showProgress?: boolean;
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 'large',
  color = '#4CAF50',
  style,
  progress,
  showProgress = false,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      
      {message && (
        <ThemedText style={styles.message}>{message}</ThemedText>
      )}
      
      {showProgress && progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.round(progress * 100)}%`, backgroundColor: color }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressText}>
            {Math.round(progress * 100)}%
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    color: '#666',
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    marginTop: 8,
    color: '#666',
  },
});
