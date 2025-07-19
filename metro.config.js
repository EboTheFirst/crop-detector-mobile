const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TensorFlow.js model files
config.resolver.assetExts.push(
  // TensorFlow.js model files
  'bin',
  'pb',
  'json'
);

// Ensure proper handling of TensorFlow.js dependencies
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver alias for react-native-fs if needed
config.resolver.alias = {
  ...config.resolver.alias,
  // This helps resolve react-native-fs in the TensorFlow.js bundle
  'react-native-fs': require.resolve('react-native-fs'),
};

// Configure transformer to handle binary files
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Increase memory limit for large model files
config.maxWorkers = 2;

module.exports = config;
