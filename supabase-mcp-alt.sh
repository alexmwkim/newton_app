#!/bin/bash

# 🔒 Supabase MCP Server - SECURITY HARDENED
# 🚨 CRITICAL: All JWT tokens have been removed from this file for security
export SUPABASE_URL="https://kmhmoxzhsljtnztywfre.supabase.co"

# 🔐 Load credentials from environment variables (required for security)
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "🚨 SECURITY ERROR: SUPABASE_ANON_KEY environment variable not set"
    echo "Please set it with: export SUPABASE_ANON_KEY='your_anon_key_here'"
    exit 1
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "🚨 SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable not set"
    echo "Please set it with: export SUPABASE_ACCESS_TOKEN='your_service_role_key_here'"
    exit 1
fi

# Export the loaded environment variables
export SUPABASE_ANON_KEY
export SUPABASE_ACCESS_TOKEN

echo "🔒 Supabase MCP Server starting with secure environment variables..."
echo "URL: $SUPABASE_URL"
echo "Keys: [SECURED - loaded from environment]"

exec npx @supabase/mcp-server-supabase "$@"