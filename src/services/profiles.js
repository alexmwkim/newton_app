import { supabase } from './supabase';

class ProfileService {
  // 프로필 조회
  async getProfile(userId) {
    try {
      console.log('👤 ProfileService.getProfile called for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('❌ Profile not found in database:', error.code, error.message);
        throw error;
      }

      console.log('✅ Profile found:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Get profile error:', {
        code: error.code || '',
        message: error.message || 'Unknown error',
        details: error.details || 'No details available',
        hint: error.hint || 'Check network connection'
      });
      
      // Return a more user-friendly error for network issues
      if (error.message && error.message.includes('Network request failed')) {
        return { data: null, error: 'Network connection failed. Please check your internet connection.' };
      }
      
      return { data: null, error: error.message || 'Failed to load profile' };
    }
  }

  // 사용자명으로 프로필 조회
  async getProfileByUsername(username) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get profile by username error:', error);
      return { data: null, error: error.message };
    }
  }

  // 프로필 업데이트
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error: error.message };
    }
  }

  // 프로필 생성 (회원가입 시 자동으로 트리거됨)
  async createProfile(userId, username, avatarUrl = null, bio = null) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: userId,
            username,
            avatar_url: avatarUrl,
            bio,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Create profile error:', error);
      return { data: null, error: error.message };
    }
  }

  // 사용자명 중복 확인
  async checkUsernameAvailability(username) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned means username is available
        return { isAvailable: true, error: null };
      } else if (error) {
        throw error;
      }

      return { isAvailable: false, error: null };
    } catch (error) {
      console.error('Check username availability error:', error);
      return { isAvailable: false, error: error.message };
    }
  }

  // 프로필 리스트 조회 (검색용)
  async searchProfiles(query, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .ilike('username', `%${query}%`)
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Search profiles error:', error);
      return { data: null, error: error.message };
    }
  }

  // 아바타 이미지 업로드
  async uploadAvatar(userId, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { data: updateData, error: updateError } = await this.updateProfile(userId, {
        avatar_url: publicUrl,
      });

      if (updateError) throw updateError;

      return { data: { avatarUrl: publicUrl, profile: updateData }, error: null };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { data: null, error: error.message };
    }
  }
}

export default new ProfileService();