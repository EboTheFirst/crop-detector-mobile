/**
 * Farmer-Friendly Button Component
 * Large, high-contrast buttons designed for outdoor use
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/config/app';
import { useThemeColor } from '@/hooks/useThemeColor';

interface FarmerButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function FarmerButton({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}: FarmerButtonProps) {
  // Get theme colors
  const primaryColor = useThemeColor({}, 'buttonPrimary');
  const secondaryColor = useThemeColor({}, 'buttonSecondary');
  const successColor = useThemeColor({}, 'successColor');
  const warningColor = useThemeColor({}, 'warningColor');
  const errorColor = useThemeColor({}, 'errorColor');
  const getButtonStyle = () => {
    const baseStyle: any[] = [styles.button, styles[size]];

    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }

    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    } else {
      // Apply theme-aware colors
      switch (variant) {
        case 'primary':
          baseStyle.push({ backgroundColor: primaryColor });
          break;
        case 'secondary':
          baseStyle.push([styles.secondary, { borderColor: primaryColor }]);
          break;
        case 'success':
          baseStyle.push({ backgroundColor: successColor });
          break;
        case 'warning':
          baseStyle.push({ backgroundColor: warningColor });
          break;
        case 'danger':
          baseStyle.push({ backgroundColor: errorColor });
          break;
      }
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: any[] = [styles.text, styles[`${size}Text` as keyof typeof styles]];

    if (disabled || loading) {
      baseStyle.push(styles.disabledText);
    } else {
      // Apply theme-aware text colors
      switch (variant) {
        case 'primary':
        case 'success':
        case 'warning':
        case 'danger':
          baseStyle.push(styles.primaryText);
          break;
        case 'secondary':
          baseStyle.push({ color: primaryColor });
          break;
      }
    }

    return baseStyle;
  };

  const getIconColor = () => {
    if (disabled || loading) {
      return '#999';
    }

    switch (variant) {
      case 'secondary':
        return primaryColor;
      default:
        return '#fff';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size={size === 'small' ? 'small' : 'large'} 
            color={getIconColor()} 
          />
          <Text style={[getTextStyle(), { marginLeft: 8 }]}>Loading...</Text>
        </View>
      );
    }

    const iconElement = icon ? (
      <Ionicons 
        name={icon as any} 
        size={getIconSize()} 
        color={getIconColor()} 
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    ) : null;

    return (
      <View style={styles.contentContainer}>
        {iconPosition === 'left' && iconElement}
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: THEME.BORDER_RADIUS.LG,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  // Sizes
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
  },
  
  // Variants - colors will be applied dynamically
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    // borderColor will be set dynamically using theme colors
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: THEME.FONT_SIZES.MD,
  },
  mediumText: {
    fontSize: THEME.FONT_SIZES.LG,
  },
  largeText: {
    fontSize: THEME.FONT_SIZES.XL,
  },
  
  // Text colors
  primaryText: {
    color: '#fff',
  },
  
  // States
  disabled: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledText: {
    color: '#999',
  },
  
  // Layout
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
