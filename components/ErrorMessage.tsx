/**
 * Error Message Component
 * Displays user-friendly error messages with retry functionality
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { ThemedIcon } from './ThemedIcon';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  style?: ViewStyle;
  type?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
  suggestions?: string[];
}

export function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  retryText = 'Try Again',
  style,
  type = 'error',
  showIcon = true,
  suggestions = [],
}: ErrorMessageProps) {
  // Get theme colors
  const cardBg = useThemeColor({}, 'cardBackground');
  const errorColor = useThemeColor({}, 'errorColor');
  const warningColor = useThemeColor({}, 'warningColor');
  const infoColor = useThemeColor({}, 'buttonSecondary');
  const subtitleColor = useThemeColor({}, 'subtitleText');
  const placeholderColor = useThemeColor({}, 'placeholderText');

  const getIconName = () => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'alert-circle';
    }
  };

  const getIconColorKey = () => {
    switch (type) {
      case 'warning':
        return 'warningColor';
      case 'info':
        return 'buttonSecondary';
      default:
        return 'errorColor';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'warning':
        return warningColor;
      case 'info':
        return infoColor;
      default:
        return errorColor;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: cardBg }, style]}>
      {showIcon && (
        <ThemedIcon
          name={getIconName() as any}
          size={32}
          colorKey={getIconColorKey() as any}
          style={styles.icon}
        />
      )}

      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: getIconColor() }]}>
          {title}
        </ThemedText>

        <ThemedText style={[styles.message, { color: subtitleColor }]}>
          {message}
        </ThemedText>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ThemedText style={styles.suggestionsTitle}>Suggestions:</ThemedText>
            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <ThemedText style={[styles.suggestionBullet, { color: placeholderColor }]}>•</ThemedText>
                <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: getIconColor() }]}
            onPress={onRetry}
          >
            <ThemedIcon name="refresh" size={16} lightColor="#fff" darkColor="#fff" />
            <ThemedText style={styles.retryButtonText}>{retryText}</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    // color will be set dynamically
    marginBottom: 12,
  },
  suggestionsContainer: {
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    // color will be set dynamically
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  suggestionBullet: {
    fontSize: 14,
    // color will be set dynamically
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set dynamically
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});
