import { profileApi } from '../api/ProfileApi';
import { getConsistentAvatarUrl, getConsistentUsername } from '../../../utils/avatarUtils';
import { ErrorLogger } from '../../../shared/api/errors/ApiError';

/**
 * 개선된 프로필 서비스 클래스
 * 비즈니스 로직과 데이터 처리를 담당
 * 
 * 기존 476줄에서 ~200줄로 축소
 * 캐싱, 데이터 변환, 비즈니스 규칙 등을 처리
 */
export class ProfileService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분
  }

  /**
   * 캐시 키 생성
   */
  getCacheKey(type, identifier) {
    return `${type}:${identifier}`;
  }

  /**
   * 캐시된 데이터 조회
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    const isExpired = Date.now() - timestamp > this.cacheTimeout;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  /**
   * 데이터 캐싱
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 원시 프로필 데이터를 UI용 데이터로 변환
   */
  transformProfileData(rawProfile) {
    if (!rawProfile) return null;

    return {
      ...rawProfile,
      username: getConsistentUsername(rawProfile),
      displayName: rawProfile.full_name || getConsistentUsername(rawProfile),
      avatarUrl: getConsistentAvatarUrl(rawProfile.avatar_url),
      bio: rawProfile.bio || '',
      website: rawProfile.website || '',
      location: rawProfile.location || '',
      joinedAt: rawProfile.created_at,
      isVerified: rawProfile.verified || false,
      
      // 계산된 필드들
      hasAvatar: !!rawProfile.avatar_url,
      hasFullProfile: !!(rawProfile.bio && rawProfile.full_name),
    };
  }

  /**
   * 프로필 조회 (캐싱 포함)
   */
  async getProfile(userId, options = {}) {
    const { forceRefresh = false } = options;
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // 캐시 확인 (강제 새로고침이 아닌 경우)
      if (!forceRefresh) {
        const cacheKey = this.getCacheKey('profile', userId);
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return { data: cached, error: null };
        }
      }

      // API에서 데이터 가져오기
      const rawProfile = await profileApi.getByUserId(userId);
      
      // 데이터 변환
      const transformedProfile = this.transformProfileData(rawProfile);
      
      // 캐시에 저장
      const cacheKey = this.getCacheKey('profile', userId);
      this.setCachedData(cacheKey, transformedProfile);

      return { data: transformedProfile, error: null };

    } catch (error) {
      ErrorLogger.log(error, { userId, service: 'ProfileService.getProfile' });
      return { data: null, error };
    }
  }

  /**
   * 사용자명으로 프로필 조회
   */
  async getProfileByUsername(username, options = {}) {
    const { forceRefresh = false } = options;
    
    if (!username) {
      throw new Error('Username is required');
    }

    try {
      // 캐시 확인
      if (!forceRefresh) {
        const cacheKey = this.getCacheKey('profile_username', username);
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return { data: cached, error: null };
        }
      }

      // API에서 데이터 가져오기
      const rawProfile = await profileApi.getByUsername(username);
      
      // 데이터 변환
      const transformedProfile = this.transformProfileData(rawProfile);
      
      // 캐시에 저장 (username과 userId 둘 다)
      const usernameCacheKey = this.getCacheKey('profile_username', username);
      const userIdCacheKey = this.getCacheKey('profile', transformedProfile.user_id);
      this.setCachedData(usernameCacheKey, transformedProfile);
      this.setCachedData(userIdCacheKey, transformedProfile);

      return { data: transformedProfile, error: null };

    } catch (error) {
      ErrorLogger.log(error, { username, service: 'ProfileService.getProfileByUsername' });
      return { data: null, error };
    }
  }

  /**
   * 프로필 업데이트
   */
  async updateProfile(userId, updates) {
    try {
      // 데이터 정제
      const sanitizedUpdates = this.sanitizeProfileUpdates(updates);
      
      // API 호출
      const updatedProfiles = await profileApi.updateProfile(userId, sanitizedUpdates);
      const updatedProfile = updatedProfiles[0]; // updateWhere는 배열 반환

      // 데이터 변환
      const transformedProfile = this.transformProfileData(updatedProfile);

      // 캐시 무효화 및 업데이트
      this.invalidateCache(userId);
      const cacheKey = this.getCacheKey('profile', userId);
      this.setCachedData(cacheKey, transformedProfile);

      return { data: transformedProfile, error: null };

    } catch (error) {
      ErrorLogger.log(error, { userId, updates, service: 'ProfileService.updateProfile' });
      return { data: null, error };
    }
  }

  /**
   * 프로필 업데이트 데이터 정제
   */
  sanitizeProfileUpdates(updates) {
    const sanitized = { ...updates };

    // 빈 문자열을 null로 변환
    ['bio', 'website', 'location', 'full_name'].forEach(field => {
      if (sanitized[field] === '') {
        sanitized[field] = null;
      }
    });

    // 웹사이트 URL 정규화
    if (sanitized.website && !sanitized.website.startsWith('http')) {
      sanitized.website = `https://${sanitized.website}`;
    }

    return sanitized;
  }

  /**
   * 아바타 업데이트
   */
  async updateAvatar(userId, avatarUrl) {
    try {
      const updatedProfiles = await profileApi.updateAvatar(userId, avatarUrl);
      const updatedProfile = updatedProfiles[0];
      
      const transformedProfile = this.transformProfileData(updatedProfile);

      // 캐시 업데이트
      this.invalidateCache(userId);
      const cacheKey = this.getCacheKey('profile', userId);
      this.setCachedData(cacheKey, transformedProfile);

      return { data: transformedProfile, error: null };

    } catch (error) {
      ErrorLogger.log(error, { userId, avatarUrl, service: 'ProfileService.updateAvatar' });
      return { data: null, error };
    }
  }

  /**
   * 프로필 생성
   */
  async createProfile(profileData) {
    try {
      const rawProfile = await profileApi.createProfile(profileData);
      const transformedProfile = this.transformProfileData(rawProfile);

      // 캐시에 저장
      const cacheKey = this.getCacheKey('profile', transformedProfile.user_id);
      this.setCachedData(cacheKey, transformedProfile);

      return { data: transformedProfile, error: null };

    } catch (error) {
      ErrorLogger.log(error, { profileData, service: 'ProfileService.createProfile' });
      return { data: null, error };
    }
  }

  /**
   * 프로필 검색
   */
  async searchProfiles(query, options = {}) {
    try {
      const rawProfiles = await profileApi.searchProfiles(query, options);
      const transformedProfiles = rawProfiles.map(profile => 
        this.transformProfileData(profile)
      );

      return { data: transformedProfiles, error: null };

    } catch (error) {
      ErrorLogger.log(error, { query, options, service: 'ProfileService.searchProfiles' });
      return { data: [], error };
    }
  }

  /**
   * 프로필 통계 조회
   */
  async getProfileStats(userId) {
    try {
      // 캐시 확인
      const cacheKey = this.getCacheKey('stats', userId);
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      // API에서 통계 데이터 조회
      const stats = await profileApi.getProfileStats(userId);

      // 캐시에 저장 (통계는 더 짧은 시간 캐시)
      this.setCachedData(cacheKey, stats);

      return { data: stats, error: null };

    } catch (error) {
      ErrorLogger.log(error, { userId, service: 'ProfileService.getProfileStats' });
      return { data: null, error };
    }
  }

  /**
   * 프로필 완성도 계산
   */
  calculateProfileCompleteness(profile) {
    if (!profile) return 0;

    const fields = [
      'avatar_url',
      'full_name',
      'bio',
      'website',
      'location',
    ];

    const completed = fields.filter(field => 
      profile[field] && profile[field].length > 0
    ).length;

    return Math.round((completed / fields.length) * 100);
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 싱글톤 인스턴스 생성
export const profileService = new ProfileService();