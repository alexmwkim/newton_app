const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enhanced stability and timeout settings
config.server = {
  ...config.server,
  port: 8081,
  useGlobalHotkey: false,
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
};

// Resolver platform and stability settings
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native'],
  unstable_enableSymlinks: false,
  unstable_enablePackageExports: false,
};

// Transformer settings for stability
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
  },
  unstable_allowRequireContext: false,
};

// Watchman and file watching configuration
config.watchFolders = [];
config.resetCache = true;

module.exports = config;