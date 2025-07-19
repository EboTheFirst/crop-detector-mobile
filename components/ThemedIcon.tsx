import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ThemedIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  lightColor?: string;
  darkColor?: string;
  colorKey?: keyof typeof import('@/constants/Colors').Colors.light & keyof typeof import('@/constants/Colors').Colors.dark;
  style?: any;
}

export function ThemedIcon({
  name,
  size = 24,
  lightColor,
  darkColor,
  colorKey = 'icon',
  style,
}: ThemedIconProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

  return <Ionicons name={name} size={size} color={color} style={style} />;
}
