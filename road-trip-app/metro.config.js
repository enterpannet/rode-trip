// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for Windows node:sea externals issue
// This prevents Expo from trying to create the problematic node:sea directory
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'ts', 'tsx', 'js', 'jsx', 'json'],
};

module.exports = config;
