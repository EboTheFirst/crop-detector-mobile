import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { offlineManager } from '@/services/offlineManager';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkStatus = useNetworkStatus();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize offline manager and sync network status
  useEffect(() => {
    // Initialize without automatic data preloading to prevent unwanted API calls
    offlineManager.initialize(false);
  }, []);

  useEffect(() => {
    offlineManager.setOnlineStatus(networkStatus.isOnline);
  }, [networkStatus.isOnline]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <OfflineBanner />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false }} />
          <Stack.Screen name="disease-detection" options={{ headerShown: false }} />
          <Stack.Screen name="treatment-recommendations" options={{ headerShown: false }} />
          <Stack.Screen name="supplier-locator" options={{ headerShown: false }} />
          <Stack.Screen name="price-estimation" options={{ headerShown: false }} />
          <Stack.Screen name="tutorial" options={{ headerShown: false }} />
          <Stack.Screen name="photo-tips" options={{ headerShown: false }} />
          <Stack.Screen name="supported-diseases" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
