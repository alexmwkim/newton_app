const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize Metro for faster bundling
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Reduce timeout issues
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Set longer timeout
      res.setTimeout(120000); // 2 minutes
      return middleware(req, res, next);
    };
  },
};

// Optimize transforming
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Enable symlinks and better caching
config.resolver.symlinks = false;
config.resetCache = true;

module.exports = config;