#!/bin/bash

# Supabase MCP Server
export SUPABASE_URL="https://kmhmoxzhsljtnztywfre.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttaG1veHpoc2xqdG56dHl3ZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTMwNTUsImV4cCI6MjA2ODY2OTA1NX0.suIJ6i0GFAyiSbq6a7foUK2LYSdZ9cAAkCrft4hgI64"

# Use service role key for MCP server to allow migrations and RLS policy changes
export SUPABASE_ACCESS_TOKEN="***REMOVED***"

exec npx @supabase/mcp-server-supabase "$@"