import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

class FollowService {
  constructor() {
    // Service role client for admin operations (bypassing RLS)
    this.serviceSupabase = createClient(
      'https://kmhmoxzhsljtnztywfre.supabase.co',
      '***REMOVED***'
    );
  }

  // Create follows table if it doesn't exist
  async initializeFollowsTable() {
    try {
      console.log('🔧 Initializing follows table...');
      
      // Check if follows table exists by trying to query it
      const { data: testData, error: existsError } = await this.serviceSupabase
        .from('follows')
        .select('id')
        .limit(1);
      
      if (!existsError) {
        console.log('✅ Follows table already exists and is accessible');
        return { success: true, message: 'Table already exists' };
      } else if (existsError.code !== '42P01') {
        console.error('❌ Unexpected error checking follows table:', existsError);
        return { success: false, error: existsError.message };
      }
      
      console.log('🔧 Follows table does not exist, attempting to create...');
      
      // Create follows table using RPC call
      console.log('📝 Creating follows table...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.follows (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(follower_id, following_id)
        );
        
        -- Add RLS policies
        ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Users can view all follows (for public follow counts)
        CREATE POLICY "Allow read access to follows" ON public.follows
          FOR SELECT USING (true);
        
        -- Policy: Users can only create follows where they are the follower
        CREATE POLICY "Users can follow others" ON public.follows
          FOR INSERT WITH CHECK (auth.uid() = follower_id);
        
        -- Policy: Users can only delete their own follows
        CREATE POLICY "Users can unfollow others" ON public.follows
          FOR DELETE USING (auth.uid() = follower_id);
        
        -- Add indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
        CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
      `;
      
      // Execute the SQL using a stored procedure (if available) or direct query
      const { error: createError } = await this.serviceSupabase.rpc('exec_sql', {
        sql: createTableSQL
      });
      
      if (createError) {
        console.error('❌ Error creating follows table:', createError);
        // Try alternative method - direct table creation
        const { error: altError } = await this.serviceSupabase
          .from('follows')
          .select('*')
          .limit(1);
        
        if (altError && altError.code === '42P01') {
          // Table doesn't exist, we need to create it manually
          console.log('⚠️ Cannot create table via RPC, table creation needed via Supabase dashboard');
          return { 
            success: false, 
            error: 'Please create follows table manually in Supabase dashboard',
            sql: createTableSQL
          };
        }
      }
      
      console.log('✅ Follows table created successfully');
      return { success: true, message: 'Follows table created' };
      
    } catch (error) {
      console.error('❌ Initialize follows table error:', error);
      return { success: false, error: error.message };
    }
  }

  // Follow a user
  async followUser(followingUserId) {
    try {
      console.log('👥 Following user:', followingUserId);
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }
      
      const followerId = user.id;
      
      // Prevent self-follow
      if (followerId === followingUserId) {
        throw new Error('Cannot follow yourself');
      }
      
      // Check if already following
      const { data: existing, error: checkError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingUserId)
        .single();
      
      if (existing) {
        console.log('ℹ️ Already following this user');
        return { success: true, message: 'Already following', isFollowing: true };
      }
      
      // Create follow relationship
      const { data, error } = await supabase
        .from('follows')
        .insert([{
          follower_id: followerId,
          following_id: followingUserId
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Successfully followed user');
      return { success: true, data, isFollowing: true };
      
    } catch (error) {
      console.error('❌ Follow user error:', error);
      return { success: false, error: error.message, isFollowing: false };
    }
  }

  // Unfollow a user
  async unfollowUser(followingUserId) {
    try {
      console.log('👥 Unfollowing user:', followingUserId);
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }
      
      const followerId = user.id;
      
      // Delete follow relationship
      const { data, error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingUserId)
        .select();
      
      if (error) throw error;
      
      console.log('✅ Successfully unfollowed user');
      return { success: true, data, isFollowing: false };
      
    } catch (error) {
      console.error('❌ Unfollow user error:', error);
      return { success: false, error: error.message, isFollowing: true };
    }
  }

  // Check if current user is following another user
  async isFollowing(followingUserId) {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: true, isFollowing: false };
      }
      
      const followerId = user.id;
      
      // Check follow relationship
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingUserId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      const isFollowing = !!data;
      console.log('🔍 Follow status:', followingUserId, '→', isFollowing);
      
      return { success: true, isFollowing };
      
    } catch (error) {
      console.error('❌ Check following error:', error);
      return { success: false, error: error.message, isFollowing: false };
    }
  }

  // Get followers count for a user
  async getFollowersCount(userId) {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      
      if (error) throw error;
      
      console.log('📊 Followers count for', userId, ':', count);
      return { success: true, count: count || 0 };
      
    } catch (error) {
      console.error('❌ Get followers count error:', error);
      return { success: false, error: error.message, count: 0 };
    }
  }

  // Get following count for a user
  async getFollowingCount(userId) {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      if (error) throw error;
      
      console.log('📊 Following count for', userId, ':', count);
      return { success: true, count: count || 0 };
      
    } catch (error) {
      console.error('❌ Get following count error:', error);
      return { success: false, error: error.message, count: 0 };
    }
  }

  // Get followers list for a user
  async getFollowers(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          created_at,
          follower:follower_id (
            id,
            email
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      console.log('👥 Followers for', userId, ':', data?.length || 0);
      return { success: true, data: data || [] };
      
    } catch (error) {
      console.error('❌ Get followers error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Get following list for a user
  async getFollowing(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          created_at,
          following:following_id (
            id,
            email
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      console.log('👥 Following for', userId, ':', data?.length || 0);
      return { success: true, data: data || [] };
      
    } catch (error) {
      console.error('❌ Get following error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Toggle follow status (follow if not following, unfollow if following)
  async toggleFollow(followingUserId) {
    try {
      console.log('🔄 Toggling follow status for:', followingUserId);
      
      // Check current status
      const { success: checkSuccess, isFollowing } = await this.isFollowing(followingUserId);
      if (!checkSuccess) {
        throw new Error('Failed to check follow status');
      }
      
      // Toggle based on current status
      if (isFollowing) {
        return await this.unfollowUser(followingUserId);
      } else {
        return await this.followUser(followingUserId);
      }
      
    } catch (error) {
      console.error('❌ Toggle follow error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new FollowService();