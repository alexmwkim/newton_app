#!/bin/bash
# 🔒 ULTRA-SECURE Environment Variable Loader
# This script safely loads environment variables without exposing them to Git

echo "🔐 Loading secure environment variables..."

# Load from .env.secret (highest security)
if [ -f ".env.secret" ]; then
    echo "🔑 Loading from .env.secret..."
    export $(grep -v '^#' .env.secret | grep -v '^$' | xargs)
    echo "✅ Secret environment loaded"
else
    echo "⚠️  .env.secret not found - create it with your service role key"
fi

# Load from .env (client-safe variables)
if [ -f ".env" ]; then
    echo "🔑 Loading from .env..."
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
    echo "✅ Client environment loaded"
fi

# Verify critical keys are loaded (show only first 20 chars for security)
echo ""
echo "🔍 Environment verification:"
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "✅ SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:15}..."
else
    echo "❌ SUPABASE_SERVICE_ROLE_KEY not found"
fi

if [ -n "$SUPABASE_ANON_KEY" ] || [ -n "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    if [ -n "$SUPABASE_ANON_KEY" ]; then
        echo "✅ SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:15}..."
    else
        echo "✅ EXPO_PUBLIC_SUPABASE_ANON_KEY: ${EXPO_PUBLIC_SUPABASE_ANON_KEY:0:15}..."
        export SUPABASE_ANON_KEY="$EXPO_PUBLIC_SUPABASE_ANON_KEY"
    fi
else
    echo "❌ SUPABASE_ANON_KEY not found"  
fi

echo ""
echo "🚀 Environment ready for secure MCP usage"