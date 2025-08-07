#!/bin/bash
# 🔒 Safe Environment Variable Loader
# This script loads environment variables from .env.local safely

if [ -f ".env.local" ]; then
    echo "🔑 Loading secure environment variables from .env.local..."
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
    echo "✅ Environment variables loaded successfully"
else
    echo "⚠️  .env.local file not found. Create it with your secret keys."
    echo "   Example: SUPABASE_ACCESS_TOKEN=your_secret_key_here"
fi

# Verify key is loaded (show only first 20 characters for security)
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "🔐 SUPABASE_ACCESS_TOKEN: ${SUPABASE_ACCESS_TOKEN:0:20}..."
else
    echo "❌ SUPABASE_ACCESS_TOKEN not loaded"
fi