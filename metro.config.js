const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Simplified Metro config
config.resolver.platforms = ['ios', 'android', 'native'];

module.exports = config;