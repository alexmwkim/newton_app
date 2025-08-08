import { supabase } from './supabase';

/**
 * 클라이언트 안전 버전 프로필 서비스
 * RLS를 통해 보안을 보장하며 admin 키 없이 작동
 */
class ProfileClientService {
  constructor() {
    // 클라이언트용 supabase 인스턴스만 사용 (RLS 적용)
    this.supabase = supabase;
  }

  // 프로필 조회 (클라이언트 안전)
  async getProfile(userId) {
    try {
      console.log('👤 ProfileClientService.getProfile called for user:', userId);
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('❌ Profile not found in database:', error.code, error.message);
        throw error;
      }

      console.log('✅ Profile found:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in getProfile:', error);
      throw error;
    }
  }

  // 프로필 업데이트 (클라이언트 안전 - RLS 적용)
  async updateProfile(userId, profileData) {
    try {
      console.log('✏️ Updating profile for user:', userId, 'Data:', profileData);

      // RLS에 의해 자동으로 현재 사용자만 업데이트 가능
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating profile:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in updateProfile:', error);
      throw error;
    }
  }

  // 프로필 생성 (클라이언트 안전 - 기본 정보만)
  async createBasicProfile(userId, profileData) {
    try {
      console.log('👤 Creating basic profile for user:', userId);

      // 기존 프로필 확인
      try {
        const existingProfile = await this.getProfile(userId);
        if (existingProfile) {
          console.log('✅ Profile already exists, returning existing profile');
          return existingProfile;
        }
      } catch (error) {
        // 프로필이 없는 경우 계속 진행
        console.log('📝 No existing profile found, creating new one');
      }

      // RLS에 의해 현재 사용자만 자신의 프로필 생성 가능
      const { data, error } = await this.supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: profileData.username || `user_${userId.substring(0, 8)}`,
          full_name: profileData.full_name || '',
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        throw error;
      }

      console.log('✅ Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in createBasicProfile:', error);
      throw error;
    }
  }

  // 사용자명 중복 확인 (클라이언트 안전)
  async checkUsernameAvailable(username, excludeUserId = null) {
    try {
      console.log('🔍 Checking username availability:', username);

      let query = this.supabase
        .from('profiles')
        .select('user_id')
        .eq('username', username);

      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error checking username:', error);
        throw error;
      }

      const isAvailable = !data || data.length === 0;
      console.log('✅ Username availability check:', { username, isAvailable });
      return isAvailable;
    } catch (error) {
      console.error('❌ Error in checkUsernameAvailable:', error);
      throw error;
    }
  }

  // 프로필 통계 조회 (클라이언트 안전)
  async getProfileStats(userId) {
    try {
      console.log('📊 Getting profile stats for user:', userId);

      // 병렬로 데이터 조회
      const [notesResult, followersResult, followingResult] = await Promise.allSettled([
        // 노트 수 조회
        this.supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_public', true), // 공개 노트만

        // 팔로워 수 조회
        this.supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),

        // 팔로잉 수 조회
        this.supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId)
      ]);

      const stats = {
        notesCount: notesResult.status === 'fulfilled' ? (notesResult.value.count || 0) : 0,
        followersCount: followersResult.status === 'fulfilled' ? (followersResult.value.count || 0) : 0,
        followingCount: followingResult.status === 'fulfilled' ? (followingResult.value.count || 0) : 0
      };

      console.log('✅ Profile stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error in getProfileStats:', error);
      return {
        notesCount: 0,
        followersCount: 0,
        followingCount: 0
      };
    }
  }

  // 공개 프로필 검색 (클라이언트 안전)
  async searchPublicProfiles(query, limit = 10) {
    try {
      console.log('🔍 Searching public profiles:', query);

      const { data, error } = await this.supabase
        .from('profiles')
        .select('user_id, username, full_name, bio, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        console.error('❌ Error searching profiles:', error);
        throw error;
      }

      console.log('✅ Found profiles:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error in searchPublicProfiles:', error);
      return [];
    }
  }

  // README 조회 (클라이언트 안전)
  async getReadme(userId) {
    try {
      console.log('📄 Getting README for user:', userId);

      const { data, error } = await this.supabase
        .from('profiles')
        .select('readme')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error getting README:', error);
        return null;
      }

      return data?.readme || null;
    } catch (error) {
      console.error('❌ Error in getReadme:', error);
      return null;
    }
  }

  // README 업데이트 (클라이언트 안전 - RLS 적용)
  async updateReadme(userId, readmeContent) {
    try {
      console.log('📝 Updating README for user:', userId);

      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          readme: readmeContent,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating README:', error);
        throw error;
      }

      console.log('✅ README updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error in updateReadme:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 (클라이언트 안전)
export default new ProfileClientService();