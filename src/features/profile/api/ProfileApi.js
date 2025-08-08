import { BaseApi } from '../../../shared/api/base/BaseApi';
import { ValidationError } from '../../../shared/api/errors/ApiError';

/**
 * 프로필 API 클래스
 * 프로필 관련 순수 API 호출을 담당
 */
export class ProfileApi extends BaseApi {
  constructor() {
    super('profiles', {
      retryCount: 2,
      retryDelay: 1000,
    });
  }

  /**
   * 프로필 데이터 유효성 검사
   */
  validateProfileData(data) {
    const errors = [];

    if (data.username && data.username.length < 2) {
      errors.push({ field: 'username', message: 'Username must be at least 2 characters' });
    }

    if (data.username && !/^[a-zA-Z0-9_.-]+$/.test(data.username)) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, dots, dashes, and underscores' });
    }

    if (data.bio && data.bio.length > 500) {
      errors.push({ field: 'bio', message: 'Bio cannot exceed 500 characters' });
    }

    if (data.website && data.website && !this.isValidUrl(data.website)) {
      errors.push({ field: 'website', message: 'Please enter a valid website URL' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Profile validation failed', errors);
    }
  }

  /**
   * URL 유효성 검사
   */
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * 사용자 ID로 프로필 조회
   */
  async getByUserId(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    return this.executeWithRetry(
      () => this.supabase
        .from(this.tableName)
        .select(`
          *,
          user:users!profiles_user_id_fkey (
            id,
            email,
            created_at
          )
        `)
        .eq('user_id', userId)
        .single(),
      'GET profile by user_id'
    );
  }

  /**
   * 사용자명으로 프로필 조회
   */
  async getByUsername(username) {
    if (!username) {
      throw new ValidationError('Username is required');
    }

    return this.findOne(
      { username: username.toLowerCase() },
      `
        *,
        user:users!profiles_user_id_fkey (
          id,
          email,
          created_at
        )
      `
    );
  }

  /**
   * 프로필 생성
   */
  async createProfile(profileData) {
    this.validateProfileData(profileData);

    // 사용자명 중복 확인
    if (profileData.username) {
      const exists = await this.exists({ username: profileData.username.toLowerCase() });
      if (exists) {
        throw new ValidationError('Username already taken', [
          { field: 'username', message: 'This username is already taken' }
        ]);
      }
    }

    const dataToCreate = {
      ...profileData,
      username: profileData.username?.toLowerCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.create(dataToCreate);
  }

  /**
   * 프로필 업데이트
   */
  async updateProfile(userId, updates) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    this.validateProfileData(updates);

    // 사용자명 변경 시 중복 확인
    if (updates.username) {
      const existing = await this.findOne({ username: updates.username.toLowerCase() });
      if (existing && existing.user_id !== userId) {
        throw new ValidationError('Username already taken', [
          { field: 'username', message: 'This username is already taken' }
        ]);
      }
    }

    const dataToUpdate = {
      ...updates,
      username: updates.username?.toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    return this.updateWhere({ user_id: userId }, dataToUpdate);
  }

  /**
   * 프로필 삭제 (soft delete)
   */
  async deleteProfile(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    return this.updateWhere(
      { user_id: userId },
      {
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  }

  /**
   * 아바타 URL 업데이트
   */
  async updateAvatar(userId, avatarUrl) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (avatarUrl && !this.isValidUrl(avatarUrl)) {
      throw new ValidationError('Invalid avatar URL');
    }

    return this.updateWhere(
      { user_id: userId },
      {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }
    );
  }

  /**
   * 여러 프로필 조회 (검색, 페이지네이션)
   */
  async searchProfiles(query = '', options = {}) {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      ascending = false,
    } = options;

    let supabaseQuery = this.supabase
      .from(this.tableName)
      .select(`
        *,
        user:users!profiles_user_id_fkey (
          id,
          email,
          created_at
        )
      `)
      .is('deleted_at', null); // 삭제되지 않은 프로필만

    // 검색 쿼리가 있는 경우
    if (query.trim()) {
      supabaseQuery = supabaseQuery.or(`
        username.ilike.%${query}%,
        full_name.ilike.%${query}%,
        bio.ilike.%${query}%
      `);
    }

    supabaseQuery = supabaseQuery
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    return this.executeWithRetry(
      () => supabaseQuery,
      'GET profiles search'
    );
  }

  /**
   * 프로필 통계 조회
   */
  async getProfileStats(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // 병렬로 통계 데이터 조회
    const [notesCount, followersCount, followingCount] = await Promise.all([
      this.getNotesCount(userId),
      this.getFollowersCount(userId),
      this.getFollowingCount(userId),
    ]);

    return {
      notesCount,
      followersCount,
      followingCount,
    };
  }

  /**
   * 사용자의 노트 수 조회
   */
  async getNotesCount(userId) {
    const { count } = await this.supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_public', true)
      .is('deleted_at', null);

    return count || 0;
  }

  /**
   * 팔로워 수 조회
   */
  async getFollowersCount(userId) {
    const { count } = await this.supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId)
      .is('deleted_at', null);

    return count || 0;
  }

  /**
   * 팔로잉 수 조회
   */
  async getFollowingCount(userId) {
    const { count } = await this.supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', userId)
      .is('deleted_at', null);

    return count || 0;
  }
}

// 싱글톤 인스턴스 생성
export const profileApi = new ProfileApi();