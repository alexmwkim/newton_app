#!/bin/bash

# Development Server Fix Script for Newton App
# This script fixes common "Could not connect to development server" errors

echo "🔧 Fixing Newton App Development Server..."

# Step 1: Kill any existing Metro/Expo processes
echo "📱 Stopping existing processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# Step 2: Clear caches
echo "🧹 Clearing caches..."
npm cache clean --force 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true

# Step 3: Check network connectivity
echo "🌐 Checking network..."
if ping -c 1 google.com >/dev/null 2>&1; then
    echo "✅ Network connection OK"
else
    echo "❌ Network issue detected - check WiFi connection"
fi

# Step 4: Restart development server
echo "🚀 Starting development server..."
npx expo start --clear --ios

echo "✅ Development server should now be running!"
echo "💡 If issues persist, check that your device and computer are on the same WiFi network"