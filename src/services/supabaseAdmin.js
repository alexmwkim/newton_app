import { createClient } from '@supabase/supabase-js';

// 🔒 SECURITY: Service role client for admin operations
// These should NEVER be exposed in client-side code
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('🚨 SECURITY: Missing Supabase admin configuration in environment variables');
}

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

class SupabaseAdminService {
  
  // Execute raw SQL with service role permissions
  async executeSQL(sql) {
    try {
      console.log('🔧 Executing SQL with admin permissions...');
      console.log('📋 SQL:', sql.substring(0, 100) + '...');
      
      // Use rpc function to execute SQL (if available)
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('❌ SQL execution error:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ SQL executed successfully');
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ SQL execution exception:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Create follows table with proper schema
  async createFollowsTable() {
    try {
      console.log('👥 === CREATING FOLLOWS TABLE ===');
      
      // Check if table exists by trying to query it
      const { data: testQuery, error: existsError } = await supabaseAdmin
        .from('follows')
        .select('id')
        .limit(1);
      
      if (!existsError) {
        console.log('✅ Follows table already exists');
        return { success: true, message: 'Table already exists' };
      } else if (existsError.code !== '42P01') {
        // Some other error (not "table doesn't exist")
        console.error('❌ Unexpected error checking table:', existsError);
        return { success: false, error: existsError.message };
      }
      
      console.log('🔧 Table does not exist, creating...');
      
      // Create the table with all policies and indexes
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
        DROP POLICY IF EXISTS "Allow read access to follows" ON public.follows;
        DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
        DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;
        
        -- Create RLS policies
        CREATE POLICY "Allow read access to follows" ON public.follows
          FOR SELECT USING (true);
        
        CREATE POLICY "Users can follow others" ON public.follows
          FOR INSERT WITH CHECK (auth.uid() = follower_id);
        
        CREATE POLICY "Users can unfollow others" ON public.follows
          FOR DELETE USING (auth.uid() = follower_id);
        
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
        CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
        CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at);
      `;
      
      // Try to execute the SQL using RPC (if available)
      let createResult = await this.executeSQL(createTableSQL);
      
      if (!createResult.success) {
        console.log('⚠️ SQL execution via RPC failed, this is expected if exec_sql function is not available');
        console.log('📋 MANUAL TABLE CREATION REQUIRED:');
        console.log('');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Copy and paste the SQL from: /Users/alex/Desktop/newton_app/setup_follows_table.sql');
        console.log('3. Execute the SQL script');
        console.log('4. Return to the app and test with: testFollowSystem()');
        console.log('');
        console.log('Alternatively, you can copy this SQL:');
        console.log('==========================================');
        console.log(createTableSQL);
        console.log('==========================================');
        
        return {
          success: false,
          error: 'Manual table creation required - see console for instructions',
          manualRequired: true,
          sql: createTableSQL,
          sqlFile: '/Users/alex/Desktop/newton_app/setup_follows_table.sql'
        };
      }
      
      console.log('✅ Follows table created successfully with all policies and indexes');
      return { success: true, message: 'Table created successfully' };
      
    } catch (error) {
      console.error('❌ Create follows table error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // List known tables by testing their existence
  async listTables() {
    try {
      console.log('📋 Checking known tables...');
      
      const knownTables = ['notes', 'profiles', 'follows', 'stars', 'user_pinned_notes'];
      const existingTables = [];
      
      for (const tableName of knownTables) {
        try {
          const { error } = await supabaseAdmin
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!error) {
            existingTables.push({ table_name: tableName, status: 'accessible' });
            console.log(`  ✅ ${tableName} - exists and accessible`);
          } else if (error.code === '42P01') {
            console.log(`  ❌ ${tableName} - does not exist`);
          } else {
            existingTables.push({ table_name: tableName, status: 'exists but restricted' });
            console.log(`  ⚠️ ${tableName} - exists but access restricted (${error.code})`);
          }
        } catch (err) {
          console.log(`  ❓ ${tableName} - error checking (${err.message})`);
        }
      }
      
      console.log('📋 Accessible tables:', existingTables.length);
      return { success: true, data: existingTables };
      
    } catch (error) {
      console.error('❌ List tables error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Check follows table structure
  async checkFollowsTable() {
    try {
      console.log('🔍 Checking follows table structure...');
      
      // Check if table exists and get sample data
      const { data, error } = await supabaseAdmin
        .from('follows')
        .select('*')
        .limit(5);
      
      if (error) {
        if (error.code === '42P01') {
          console.log('❌ Follows table does not exist');
          return { success: false, error: 'Table does not exist', exists: false };
        } else {
          console.error('❌ Error checking follows table:', error);
          return { success: false, error: error.message, exists: true };
        }
      }
      
      console.log('✅ Follows table exists and is accessible');
      console.log('📊 Sample data count:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📋 Sample records:');
        data.forEach((record, idx) => {
          console.log(`  ${idx + 1}. ${record.follower_id} → ${record.following_id} (${record.created_at})`);
        });
      }
      
      return { success: true, exists: true, data, count: data?.length || 0 };
      
    } catch (error) {
      console.error('❌ Check follows table error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Test table functionality by attempting basic operations
  async getTableSchema(tableName = 'follows') {
    try {
      console.log('🔍 Testing table functionality for:', tableName);
      
      // Test if we can query the table structure by examining a sample record
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          console.log('❌ Table does not exist');
          return { success: false, error: 'Table does not exist', exists: false };
        } else {
          console.log('⚠️ Table exists but query failed:', error.message);
          return { success: false, error: error.message, exists: true };
        }
      }
      
      console.log('✅ Table is accessible and functional');
      
      if (data && data.length > 0) {
        console.log('📋 Sample record structure:');
        const sampleRecord = data[0];
        Object.keys(sampleRecord).forEach(key => {
          const value = sampleRecord[key];
          const type = typeof value;
          console.log(`  - ${key}: ${type} (${value === null ? 'null' : value})`);
        });
      } else {
        console.log('📋 Table is empty but accessible');
        
        // If table is empty, we can't see the structure, but we know it exists
        if (tableName === 'follows') {
          console.log('📋 Expected follows table structure:');
          console.log('  - id: UUID (primary key)');
          console.log('  - follower_id: UUID (references auth.users)');
          console.log('  - following_id: UUID (references auth.users)'); 
          console.log('  - created_at: TIMESTAMP');
        }
      }
      
      return { success: true, exists: true, data, isEmpty: !data || data.length === 0 };
      
    } catch (error) {
      console.error('❌ Test table functionality error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export class instead of instance to prevent initialization errors  
// IMPORTANT: This service requires admin keys and should NOT be used in client applications
export default SupabaseAdminService;