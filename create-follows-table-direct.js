#!/usr/bin/env node

// Create follows table using direct PostgreSQL connection
const { Client } = require('pg');

console.log('🔧 Creating follows table using direct PostgreSQL connection...');

// Supabase connection string format
const connectionString = "postgresql://postgres:[YOUR_DB_PASSWORD]@db.kmhmoxzhsljtnztywfre.supabase.co:5432/postgres";

// We need the database password to connect directly
console.log('❌ Direct PostgreSQL connection requires database password.');
console.log('');
console.log('🔑 To get the database password:');
console.log('1. Go to Supabase Dashboard → Settings → Database');
console.log('2. Find "Connection string" section');
console.log('3. Copy the password from the connection string');
console.log('');
console.log('💡 Alternative: Use Supabase Dashboard SQL Editor with the provided SQL');
console.log('');

const createTableSQL = `
-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access" ON public.follows;
DROP POLICY IF EXISTS "Users can follow" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

-- Create policies
CREATE POLICY "Allow read access" ON public.follows 
  FOR SELECT USING (true);

CREATE POLICY "Users can follow" ON public.follows 
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows 
  FOR DELETE USING (auth.uid() = follower_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at);

-- Grant permissions
GRANT ALL ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

-- Success message
SELECT 'Follows table created successfully!' as result;
`;

console.log('📋 SQL TO EXECUTE IN SUPABASE DASHBOARD:');
console.log('=' .repeat(60));
console.log(createTableSQL);
console.log('=' .repeat(60));
console.log('');
console.log('📝 INSTRUCTIONS:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project: kmhmoxzhsljtnztywfre');
console.log('3. Click "SQL Editor" in the left menu');
console.log('4. Create a new query and paste the SQL above');
console.log('5. Click "RUN" to execute');
console.log('6. Return to the app and test with: testFollowSystem()');

// Function to test connection if password is provided
async function testConnection(password) {
  if (!password) {
    console.log('🔑 No password provided, skipping direct connection test.');
    return;
  }
  
  const client = new Client({
    connectionString: connectionString.replace('[YOUR_DB_PASSWORD]', password)
  });
  
  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    
    console.log('✅ Connected successfully!');
    
    // Execute the SQL
    console.log('🔧 Creating follows table...');
    const result = await client.query(createTableSQL);
    
    console.log('✅ Table created successfully!');
    console.log('📊 Result:', result.rows);
    
    // Test the table
    const testResult = await client.query('SELECT COUNT(*) FROM public.follows;');
    console.log('🧪 Test query result:', testResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

// Check for password argument
const password = process.argv[2];
if (password) {
  testConnection(password);
} else {
  console.log('');
  console.log('💡 To use direct PostgreSQL connection:');
  console.log('   node create-follows-table-direct.js [DATABASE_PASSWORD]');
}