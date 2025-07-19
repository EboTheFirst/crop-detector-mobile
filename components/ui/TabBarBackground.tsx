// This provides a proper background for web and Android tab bars
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function TabBarBackground() {
  const backgroundColor = useThemeColor({}, 'tabBarBackground');

  return <View style={[styles.background, { backgroundColor }]} />;
}

export function useBottomTabOverflow() {
  return 0;
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
