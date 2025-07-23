module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    'react-native/react-native': true,
    es6: true,
    node: true,
  },
  rules: {
    // Critical errors only - focus on security and functionality
    'no-console': 'off', // Allow console logs in development
    'no-alert': 'error',
    'no-debugger': 'error',
    'no-undef': 'warn', // Allow undefined vars during development
    'no-dupe-keys': 'error',
    'react/no-unescaped-entities': 'off', // Allow unescaped entities in development
    
    // Security-focused rules
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Disable styling warnings for now
    'react-native/no-unused-styles': 'off',
    'react-native/split-platform-components': 'off',
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',
    'react-native/no-raw-text': 'off',
    
    // Disable performance warnings for now
    'react/jsx-no-bind': 'off',
    'react/no-array-index-key': 'off',
    
    // Disable unused vars warnings for development
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    
    // React specific
    'react/prop-types': 'off',
    'react/display-name': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    '*.config.js',
  ],
};