import { supabase } from './supabase';

/**
 * 클라이언트 안전 버전 팔로우 서비스
 * RLS를 통해 보안을 보장하며 admin 키 없이 작동
 */
class FollowClientService {
  constructor() {
    // 클라이언트용 supabase 인스턴스만 사용 (RLS 적용)
    this.supabase = supabase;
  }

  /**
   * 팔로워 수 조회 (클라이언트 안전)
   */
  async getFollowersCount(userId) {
    try {
      if (!userId) {
        return { count: 0, error: null };
      }

      console.log('📊 Getting followers count for user:', userId);

      // RLS가 적용된 클라이언트 쿼리
      const { count, error } = await this.supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) {
        console.error('❌ Error getting followers count:', error);
        return { count: 0, error };
      }

      console.log('✅ Followers count:', count);
      return { success: true, count: count || 0, error: null };

    } catch (error) {
      console.error('❌ Exception in getFollowersCount:', error);
      return { success: false, count: 0, error };
    }
  }

  /**
   * 팔로잉 수 조회 (클라이언트 안전)
   */
  async getFollowingCount(userId) {
    try {
      if (!userId) {
        return { count: 0, error: null };
      }

      console.log('📊 Getting following count for user:', userId);

      // RLS가 적용된 클라이언트 쿼리
      const { count, error } = await this.supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (error) {
        console.error('❌ Error getting following count:', error);
        return { success: false, count: 0, error };
      }

      console.log('✅ Following count:', count);
      return { success: true, count: count || 0, error: null };

    } catch (error) {
      console.error('❌ Exception in getFollowingCount:', error);
      return { success: false, count: 0, error };
    }
  }

  /**
   * 팔로우 상태 확인 (클라이언트 안전)
   */
  async isFollowing(followerId, followingId) {
    try {
      if (!followerId || !followingId) {
        return { isFollowing: false, error: null };
      }

      const { data, error } = await this.supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking follow status:', error);
        return { success: false, isFollowing: false, error };
      }

      return { success: true, isFollowing: !!data, error: null };

    } catch (error) {
      console.error('❌ Exception in isFollowing:', error);
      return { success: false, isFollowing: false, error };
    }
  }

  /**
   * 팔로우 하기 (클라이언트 안전 - RLS 적용)
   */
  async followUser(followerId, followingId) {
    try {
      if (!followerId || !followingId) {
        return { success: false, error: new Error('Missing user IDs') };
      }

      if (followerId === followingId) {
        return { success: false, error: new Error('Cannot follow yourself') };
      }

      const { data, error } = await this.supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error following user:', error);
        return { success: false, error };
      }

      console.log('✅ Successfully followed user:', data);
      return { success: true, data, error: null };

    } catch (error) {
      console.error('❌ Exception in followUser:', error);
      return { success: false, error };
    }
  }

  /**
   * 언팔로우 하기 (클라이언트 안전 - RLS 적용)
   */
  async unfollowUser(followerId, followingId) {
    try {
      if (!followerId || !followingId) {
        return { success: false, error: new Error('Missing user IDs') };
      }

      const { data, error } = await this.supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .select();

      if (error) {
        console.error('❌ Error unfollowing user:', error);
        return { success: false, error };
      }

      console.log('✅ Successfully unfollowed user:', data);
      return { success: true, data, error: null };

    } catch (error) {
      console.error('❌ Exception in unfollowUser:', error);
      return { success: false, error };
    }
  }

  /**
   * 팔로우 토글 (편의 메서드)
   */
  async toggleFollow(followerId, followingId) {
    try {
      const { success: checkSuccess, isFollowing, error: checkError } = await this.isFollowing(followerId, followingId);
      
      if (!checkSuccess || checkError) {
        return { success: false, error: checkError };
      }

      if (isFollowing) {
        const result = await this.unfollowUser(followerId, followingId);
        return { 
          success: result.success, 
          isFollowing: false, 
          data: result.data, 
          error: result.error 
        };
      } else {
        const result = await this.followUser(followerId, followingId);
        return { 
          success: result.success, 
          isFollowing: true, 
          data: result.data, 
          error: result.error 
        };
      }

    } catch (error) {
      console.error('❌ Exception in toggleFollow:', error);
      return { success: false, isFollowing: false, error };
    }
  }

  /**
   * 클라이언트 안전 버전 - 테이블 초기화 확인
   * 실제 테이블 생성은 할 수 없고, 존재 여부만 확인
   */
  async initializeFollowsTable() {
    try {
      console.log('🔧 Checking follows table accessibility (client mode)...');
      
      // 클라이언트에서는 테이블 생성 권한이 없으므로 단순 존재 확인만
      const { count, error } = await this.supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.warn('⚠️ Follows table does not exist - admin setup required');
          return { 
            success: false, 
            error: 'Follows table not found. Please contact administrator to set up the database schema.',
            needsSetup: true 
          };
        } else {
          console.error('❌ Error accessing follows table:', error);
          return { success: false, error: error.message };
        }
      }

      console.log('✅ Follows table is accessible');
      return { success: true, message: 'Table is accessible' };

    } catch (error) {
      console.error('❌ Exception in initializeFollowsTable:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 팔로워 목록 조회 (클라이언트 안전)
   */
  async getFollowers(userId, limit = 20, offset = 0) {
    try {
      console.log('👥 Getting followers for user:', userId);

      const { data, error } = await this.supabase
        .from('follows')
        .select(`
          follower_id,
          created_at
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error getting followers:', error);
        return { success: false, data: [], error };
      }

      // 별도로 profiles 데이터 가져오기
      if (data && data.length > 0) {
        const followerIds = data.map(f => f.follower_id);
        console.log('📋 Follower IDs to fetch profiles:', followerIds);
        
        const { data: profilesData, error: profilesError } = await this.supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url, bio')
          .in('user_id', followerIds);

        console.log('👤 Profiles data:', profilesData);
        console.log('❌ Profiles error:', profilesError);

        if (!profilesError && profilesData) {
          // followers 데이터와 profiles 데이터 결합
          const followersWithProfiles = data.map(follower => {
            const profile = profilesData.find(p => p.user_id === follower.follower_id);
            console.log(`🔗 Matching follower ${follower.follower_id} with profile:`, profile);
            return {
              ...follower,
              profiles: profile
            };
          });
          
          console.log('✅ Retrieved followers:', followersWithProfiles.length);
          return { success: true, data: followersWithProfiles };
        }
      }

      console.log('✅ Retrieved followers (no profiles):', data?.length || 0);
      console.log('🔍 Followers data (no profiles):', JSON.stringify(data, null, 2));
      return { success: true, data: data || [] };

    } catch (error) {
      console.error('❌ Exception in getFollowers:', error);
      return { success: false, data: [], error };
    }
  }

  /**
   * 팔로잉 목록 조회 (클라이언트 안전)
   */
  async getFollowing(userId, limit = 20, offset = 0) {
    try {
      console.log('👥 Getting following for user:', userId);

      const { data, error } = await this.supabase
        .from('follows')
        .select(`
          following_id,
          created_at
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error getting following:', error);
        return { success: false, data: [], error };
      }

      // 별도로 profiles 데이터 가져오기
      if (data && data.length > 0) {
        const followingIds = data.map(f => f.following_id);
        const { data: profilesData, error: profilesError } = await this.supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url, bio')
          .in('user_id', followingIds);

        if (!profilesError && profilesData) {
          // following 데이터와 profiles 데이터 결합
          const followingWithProfiles = data.map(following => {
            const profile = profilesData.find(p => p.user_id === following.following_id);
            return {
              ...following,
              profiles: profile
            };
          });
          
          console.log('✅ Retrieved following:', followingWithProfiles.length);
          console.log('🔍 Following data structure:', JSON.stringify(followingWithProfiles, null, 2));
          return { success: true, data: followingWithProfiles };
        }
      }

      console.log('✅ Retrieved following:', data?.length || 0);
      return { success: true, data: data || [] };

    } catch (error) {
      console.error('❌ Exception in getFollowing:', error);
      return { success: false, data: [], error };
    }
  }
}

// 싱글톤 인스턴스 (클라이언트 안전)
export default new FollowClientService();