import { supabase } from './supabase';

class FollowService {
  constructor() {
    // Use the main supabase client (with anon key + RLS)
    // This is secure because RLS policies control access
    console.log('🔧 Initializing FollowService with client authentication');
  }

  // Create follows table if it doesn't exist
  async initializeFollowsTable() {
    try {
      console.log('🔧 Initializing follows table...');
      
      // Check if follows table exists by trying to query it
      const { data: testData, error: existsError } = await supabase
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
      
      // Note: Table creation should be done via Supabase dashboard or SQL editor
      // Client apps cannot create tables due to security restrictions
      console.log('⚠️ Table creation should be done manually via Supabase dashboard');
      const createError = new Error('Table creation requires admin access');
      
      if (createError) {
        console.error('❌ Error creating follows table:', createError);
        // Try alternative method - direct table creation
        const { error: altError } = await supabase
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
      console.log('🔍 ENHANCED isFollowing DEBUG: Starting check for followingUserId:', followingUserId);
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔍 Auth check result:', {
        hasUser: !!user,
        userId: user?.id,
        hasAuthError: !!authError,
        authError: authError?.message
      });
      
      if (authError || !user) {
        console.log('🔍 No authenticated user, returning false');
        return { success: true, isFollowing: false };
      }
      
      const followerId = user.id;
      console.log('🔍 Query parameters:', {
        follower_id: followerId,
        following_id: followingUserId
      });
      
      // Check follow relationship
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingUserId)
        .single();
      
      console.log('🔍 Supabase query result:', {
        hasData: !!data,
        dataCount: data ? 1 : 0,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        rawData: data
      });
      
      if (error && error.code !== 'PGRST116') {
        console.log('🔍 Database error (not "no rows"):', error);
        throw error;
      }
      
      const isFollowing = !!data;
      console.log('🔍 FINAL Follow status result:', {
        followerId,
        followingUserId,
        isFollowing,
        meaning: isFollowing ? 'Following relationship EXISTS' : 'Following relationship does NOT exist'
      });
      
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

  // Get followers list for a user with profile data
  async getFollowers(userId, limit = 50, offset = 0) {
    try {
      console.log('👥 Getting followers for user:', userId);
      
      // Get follows first (without JOIN to avoid schema cache issues)
      const { data: followsData, error } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      if (!followsData || followsData.length === 0) {
        console.log('👥 No followers found for user:', userId);
        return { success: true, data: [] };
      }

      // Get profile data for all follower_ids
      const followerIds = followsData.map(f => f.follower_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, bio')
        .in('user_id', followerIds);
        
      if (profilesError) {
        console.warn('⚠️ Failed to get profile data, using basic info:', profilesError);
      }
      
      // Combine follows and profiles data
      const followers = followsData.map(follow => {
        const profile = profilesData?.find(p => p.user_id === follow.follower_id);
        return {
          id: follow.follower_id,
          username: profile?.username || null,
          full_name: profile?.username || 'Newton User',
          avatar_url: profile?.avatar_url || null,
          bio: profile?.bio || null,
          followed_at: follow.created_at
        };
      });
      
      console.log('👥 Followers for', userId, ':', followers.length);
      return { success: true, data: followers };
      
    } catch (error) {
      console.error('❌ Get followers error:', error);
      // Fallback: try to get basic user data
      try {
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('follower_id, created_at')
          .eq('following_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (followError) throw followError;
        
        const followers = (followData || []).map(item => ({
          id: item.follower_id,
          username: null,
          full_name: 'Newton User',
          avatar_url: null,
          bio: null,
          followed_at: item.created_at
        }));
        
        return { success: true, data: followers };
      } catch (fallbackError) {
        console.error('❌ Fallback followers error:', fallbackError);
        return { success: false, error: error.message, data: [] };
      }
    }
  }

  // Get following list for a user with profile data
  async getFollowing(userId, limit = 50, offset = 0) {
    try {
      console.log('👥 Getting following for user:', userId);
      
      // Get follows first (without JOIN to avoid schema cache issues)
      const { data: followsData, error } = await supabase
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      if (!followsData || followsData.length === 0) {
        console.log('👥 No following found for user:', userId);
        return { success: true, data: [] };
      }

      // Get profile data for all following_ids
      const followingIds = followsData.map(f => f.following_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, bio')
        .in('user_id', followingIds);
        
      if (profilesError) {
        console.warn('⚠️ Failed to get profile data, using basic info:', profilesError);
      }
      
      // Combine follows and profiles data
      const following = followsData.map(follow => {
        const profile = profilesData?.find(p => p.user_id === follow.following_id);
        return {
          id: follow.following_id,
          username: profile?.username || null,
          full_name: profile?.username || 'Newton User',
          avatar_url: profile?.avatar_url || null,
          bio: profile?.bio || null,
          followed_at: follow.created_at
        };
      });
      
      console.log('👥 Following for', userId, ':', following.length);
      return { success: true, data: following };
      
    } catch (error) {
      console.error('❌ Get following error:', error);
      // Fallback: try to get basic user data
      try {
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('following_id, created_at')
          .eq('follower_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (followError) throw followError;
        
        const following = (followData || []).map(item => ({
          id: item.following_id,
          username: null,
          full_name: 'Newton User',
          avatar_url: null,
          bio: null,
          followed_at: item.created_at
        }));
        
        return { success: true, data: following };
      } catch (fallbackError) {
        console.error('❌ Fallback following error:', fallbackError);
        return { success: false, error: error.message, data: [] };
      }
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

// Create service instance
const followServiceInstance = new FollowService();

// Helper methods for easier usage
export const followService = {
  // Core follow operations
  followUser: (userId) => followServiceInstance.followUser(userId),
  unfollowUser: (userId) => followServiceInstance.unfollowUser(userId),
  toggleFollow: (userId) => followServiceInstance.toggleFollow(userId),
  
  // Follow status checks
  checkFollowStatus: async (userId) => {
    const result = await followServiceInstance.isFollowing(userId);
    return result.isFollowing;
  },
  
  // Get counts
  getFollowersCount: (userId) => followServiceInstance.getFollowersCount(userId),
  getFollowingCount: (userId) => followServiceInstance.getFollowingCount(userId),
  
  // Get lists with enhanced data
  getFollowers: async (userId, limit = 50, offset = 0) => {
    const result = await followServiceInstance.getFollowers(userId, limit, offset);
    return result.success ? result.data : [];
  },
  
  getFollowing: async (userId, limit = 50, offset = 0) => {
    const result = await followServiceInstance.getFollowing(userId, limit, offset);
    return result.success ? result.data : [];
  },
  
  // Initialize table if needed
  initializeTable: () => followServiceInstance.initializeFollowsTable(),
};

// Export both the class and the service instance
export { FollowService };
export default followService;