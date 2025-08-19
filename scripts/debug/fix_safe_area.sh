#!/bin/bash

# Fix SafeArea imports in all JS files
find src -name "*.js" -exec sed -i '' 's/import { useSafeAreaInsets } from .react-native-safe-area-context.;//g' {} \;
find src -name "*.js" -exec sed -i '' 's/const { useSafeAreaInsets } = require(.react-native-safe-area-context.);//g' {} \;

# Replace SafeArea fallback blocks
find src -name "*.js" -exec perl -i -pe 's/\/\/ SafeArea fallback.*?^}/\/\/ SafeArea fallback\nconst useSafeAreaInsets = () => ({ bottom: 34, top: 44, left: 0, right: 0 });/gsm' {} \;

echo "✅ SafeArea fixes applied to all files"