const { getDefaultConfig } = require("expo/metro-config");

// Suppress Expo Router compatibility check during bundling
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = "1";

const config = getDefaultConfig(__dirname);

module.exports = config;
