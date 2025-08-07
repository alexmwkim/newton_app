#!/usr/bin/env node

// Create follows table using Supabase client directly
const { createClient } = require('@supabase/supabase-js');

// Use environment variables from MCP script
const SUPABASE_URL = process.env.SUPABASE_URL || "https://kmhmoxzhsljtnztywfre.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "REMOVED_FOR_SECURITY_PLEASE_SET_ENV_VAR";

// Security check
if (SUPABASE_SERVICE_ROLE_KEY === "REMOVED_FOR_SECURITY_PLEASE_SET_ENV_VAR") {
  console.error('🚨 SECURITY ERROR: Supabase service role key must be set as environment variable');
  console.error('Set SUPABASE_SERVICE_ROLE_KEY environment variable before running this script');
  process.exit(1);
}

console.log('🔧 Creating follows table using Supabase service role...');

// Create service role client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createFollowsTable() {
  try {
    console.log('📋 Checking if follows table exists...');
    
    // First check if table exists
    const { data: testData, error: existsError } = await supabase
      .from('follows')
      .select('id')
      .limit(1);
    
    if (!existsError) {
      console.log('✅ Follows table already exists!');
      return;
    } else if (existsError.code !== '42P01') {
      console.error('❌ Unexpected error:', existsError);
      return;
    }
    
    console.log('🔧 Table does not exist, creating...');
    
    // Create the table using SQL
    const createTableSQL = `
      -- Create follows table
      CREATE TABLE public.follows (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
        CONSTRAINT no_self_follow CHECK (follower_id != following_id)
      );

      -- Enable RLS
      ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Allow read access" ON public.follows 
        FOR SELECT USING (true);
      
      CREATE POLICY "Users can follow" ON public.follows 
        FOR INSERT WITH CHECK (auth.uid() = follower_id);
      
      CREATE POLICY "Users can unfollow" ON public.follows 
        FOR DELETE USING (auth.uid() = follower_id);

      -- Create indexes
      CREATE INDEX idx_follows_follower ON public.follows(follower_id);
      CREATE INDEX idx_follows_following ON public.follows(following_id);
      CREATE INDEX idx_follows_created_at ON public.follows(created_at);

      -- Grant permissions
      GRANT ALL ON public.follows TO authenticated;
      GRANT ALL ON public.follows TO service_role;
    `;
    
    // Try to execute using RPC
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (error) {
        throw error;
      }
      console.log('✅ Table created successfully via RPC!');
    } catch (rpcError) {
      console.log('⚠️ RPC method failed:', rpcError.message);
      console.log('🔧 Trying alternative method...');
      
      // Alternative: Try to create table by inserting and catching the error
      // This won't actually create the table, but we can provide the SQL for manual execution
      console.log('\n📋 MANUAL CREATION REQUIRED:');
      console.log('Copy and paste this SQL in Supabase Dashboard → SQL Editor:');
      console.log('=' .repeat(60));
      console.log(createTableSQL);
      console.log('=' .repeat(60));
      
      return false;
    }
    
    // Verify table creation
    const { data: verifyData, error: verifyError } = await supabase
      .from('follows')
      .select('id')
      .limit(1);
    
    if (!verifyError) {
      console.log('✅ Table verification successful!');
      console.log('🎉 Follows table is ready to use!');
      return true;
    } else {
      console.log('❌ Table verification failed:', verifyError);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error creating follows table:', error);
    return false;
  }
}

async function testFollowsTable() {
  try {
    console.log('\n🧪 Testing follows table functionality...');
    
    // Test read access
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Test failed:', error);
      return false;
    }
    
    console.log('✅ Table is accessible!');
    console.log('📊 Current records:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('📋 Sample records:');
      data.forEach((record, idx) => {
        console.log(`  ${idx + 1}. ${record.follower_id} → ${record.following_id} (${record.created_at})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting follows table creation process...\n');
  
  const created = await createFollowsTable();
  
  if (created !== false) {
    await testFollowsTable();
    console.log('\n🎉 Process completed successfully!');
    console.log('💡 You can now test the follow system in your app with: testFollowSystem()');
  } else {
    console.log('\n⚠️ Manual table creation required.');
    console.log('📋 Follow the SQL instructions above.');
  }
}

// Run the script
main().catch(console.error);