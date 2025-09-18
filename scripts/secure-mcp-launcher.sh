#!/bin/bash
# 🔒 SECURE MCP Launcher
# Launches MCP server with environment variables loaded securely

echo "🔐 Starting Secure MCP Server..."

# Load secure environment variables
source ./secure-env-loader.sh

# Verify we have the required keys
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY not found!"
    echo "Please add it to .env.secret file"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ CRITICAL: SUPABASE_ANON_KEY not found!"
    echo "Please add it to .env.secret or .env.local file"
    exit 1
fi

# Set environment variables for MCP
export SUPABASE_URL="https://kmhmoxzhsljtnztywfre.supabase.co"
export SUPABASE_ACCESS_TOKEN="$SUPABASE_SERVICE_ROLE_KEY"

echo "🚀 Launching Supabase MCP Server..."
echo "URL: $SUPABASE_URL"
echo "Keys: [SECURED - loaded from environment files]"

# Launch MCP server
exec npx @supabase/mcp-server-supabase "$@"