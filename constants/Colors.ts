/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#4a5568', // Improved contrast from #687076
    tabIconDefault: '#4a5568', // Improved contrast for better visibility
    tabIconSelected: tintColorLight,
    subtitleText: '#4a5568', // Better contrast than #666
    secondaryText: '#718096', // For less important text
    tabBarBackground: '#ffffff',
    borderColor: '#e2e8f0',
    // Card and UI element colors
    cardBackground: '#ffffff',
    statCardBackground: '#f8f9fa',
    buttonPrimary: '#4CAF50',
    buttonSecondary: '#2196F3',
    linkColor: '#0a7ea4',
    successColor: '#4CAF50',
    warningColor: '#FF9800',
    errorColor: '#F44336',
    // Additional UI colors
    screenBackground: '#f5f5f5',
    searchBackground: '#f5f5f5',
    inputBackground: '#f5f5f5',
    inputText: '#333',
    placeholderText: '#666',
    dividerColor: '#e0e0e0',
    shadowColor: '#000',
    // Badge and status colors
    verifiedBackground: '#E8F5E8',
    verifiedText: '#4CAF50',
    ratingBackground: '#FFF8E1',
    ratingText: '#F57C00',
    ratingIcon: '#FFD700',
    // Button variants
    contactButtonBackground: '#f5f5f5',
    contactButtonText: '#333',
    retryButtonBackground: '#4CAF50',
    retryButtonText: '#fff',
    // Quick action colors
    helpActionColor: '#9C27B0',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#a0aec0', // Improved contrast from #9BA1A6
    tabIconDefault: '#a0aec0', // Better visibility in dark mode
    tabIconSelected: tintColorDark,
    subtitleText: '#a0aec0', // Better contrast for subtitles
    secondaryText: '#718096', // For less important text
    tabBarBackground: '#1a202c',
    borderColor: '#2d3748',
    // Card and UI element colors for dark mode
    cardBackground: '#1f2937',
    statCardBackground: '#374151',
    buttonPrimary: '#4CAF50',
    buttonSecondary: '#3b82f6',
    linkColor: '#60a5fa',
    successColor: '#10b981',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    // Additional UI colors for dark mode
    screenBackground: '#111827',
    searchBackground: '#374151',
    inputBackground: '#374151',
    inputText: '#f3f4f6',
    placeholderText: '#9ca3af',
    dividerColor: '#4b5563',
    shadowColor: '#000',
    // Badge and status colors for dark mode
    verifiedBackground: '#065f46',
    verifiedText: '#10b981',
    ratingBackground: '#451a03',
    ratingText: '#f59e0b',
    ratingIcon: '#fbbf24',
    // Button variants for dark mode
    contactButtonBackground: '#374151',
    contactButtonText: '#f3f4f6',
    retryButtonBackground: '#4CAF50',
    retryButtonText: '#fff',
    // Quick action colors for dark mode
    helpActionColor: '#ba68c8',
  },
};
