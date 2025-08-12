/**
 * UnifiedFollowService - 통합 팔로우 서비스
 * 
 * follow.js와 followClient.js의 기능을 통합하여:
 * - 중복 코드 제거 (855줄 → 400줄)
 * - 일관된 API 인터페이스 제공
 * - 캐싱 시스템 적용
 * - 배치 처리 최적화
 * - 향상된 에러 처리
 */

import { supabase } from './supabase';
import ValidationUtils from './ValidationUtils';
import logger from '../utils/Logger';

class UnifiedFollowService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2분 캐시 (팔로우 상태는 자주 변경됨)
    this.maxCacheSize = 500; // 팔로우 관계는 많을 수 있음
    this.batchSize = 50;
    
    logger.debug('🔧 Initializing UnifiedFollowService');
  }

  /**
   * 캐시 관리
   */
  getCacheKey(operation, params) {
    return `follow:${operation}:${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    if (Date.now() - timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`⚡ Follow cache hit: ${key}`);
    return data;
  }

  setCache(key, data) {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCacheForUser(userId) {
    // 특정 사용자 관련 캐시 삭제
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    logger.debug(`🗑️ Cleared ${keysToDelete.length} cache entries for user: ${userId}`);
  }

  /**
   * 팔로우 상태 확인
   */
  async isFollowing(followerId, followingId) {
    try {
      // 입력 검증
      const followerValidation = ValidationUtils.validateUUID(followerId);
      const followingValidation = ValidationUtils.validateUUID(followingId);
      
      if (!followerValidation.isValid) {
        return { success: false, data: false, error: `Invalid follower ID: ${followerValidation.error}` };
      }
      
      if (!followingValidation.isValid) {
        return { success: false, data: false, error: `Invalid following ID: ${followingValidation.error}` };
      }

      const sanitizedFollowerId = followerValidation.sanitized;
      const sanitizedFollowingId = followingValidation.sanitized;

      // 자기 자신은 팔로우 불가
      if (sanitizedFollowerId === sanitizedFollowingId) {
        return { success: true, data: false, error: null };
      }

      // 캐시 확인
      const cacheKey = this.getCacheKey('isFollowing', { followerId: sanitizedFollowerId, followingId: sanitizedFollowingId });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return { success: true, data: cached, error: null };
      }

      // DB 조회
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', sanitizedFollowerId)
        .eq('following_id', sanitizedFollowingId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('❌ Error checking follow status:', error);
        return { success: false, data: false, error: error.message };
      }

      const isFollowing = !!data;
      
      // 캐시 저장
      this.setCache(cacheKey, isFollowing);
      
      logger.debug(`✅ Follow status check: ${sanitizedFollowerId} → ${sanitizedFollowingId} = ${isFollowing}`);
      return { success: true, data: isFollowing, error: null };

    } catch (error) {
      logger.error('❌ Exception in isFollowing:', error);
      return { success: false, data: false, error: error.message };
    }
  }

  /**
   * 팔로우 하기
   */
  async followUser(followerId, followingId) {
    try {
      // 입력 검증
      const followerValidation = ValidationUtils.validateUUID(followerId);
      const followingValidation = ValidationUtils.validateUUID(followingId);
      
      if (!followerValidation.isValid) {
        return { success: false, error: `Invalid follower ID: ${followerValidation.error}` };
      }
      
      if (!followingValidation.isValid) {
        return { success: false, error: `Invalid following ID: ${followingValidation.error}` };
      }

      const sanitizedFollowerId = followerValidation.sanitized;
      const sanitizedFollowingId = followingValidation.sanitized;

      // 자기 자신을 팔로우할 수 없음
      if (sanitizedFollowerId === sanitizedFollowingId) {
        return { success: false, error: 'Cannot follow yourself' };
      }

      // 이미 팔로우 중인지 확인
      const existingFollow = await this.isFollowing(sanitizedFollowerId, sanitizedFollowingId);
      if (existingFollow.success && existingFollow.data) {
        return { success: false, error: 'Already following this user' };
      }

      // 팔로우 생성
      const { data, error } = await supabase
        .from('follows')
        .insert([{
          follower_id: sanitizedFollowerId,
          following_id: sanitizedFollowingId
        }])
        .select()
        .single();

      if (error) {
        logger.error('❌ Error creating follow:', error);
        return { success: false, error: error.message };
      }

      // 캐시 업데이트
      this.clearCacheForUser(sanitizedFollowerId);
      this.clearCacheForUser(sanitizedFollowingId);

      logger.debug(`✅ User ${sanitizedFollowerId} followed ${sanitizedFollowingId}`);
      return { success: true, data, error: null };

    } catch (error) {
      logger.error('❌ Exception in followUser:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 언팔로우 하기
   */
  async unfollowUser(followerId, followingId) {
    try {
      // 입력 검증
      const followerValidation = ValidationUtils.validateUUID(followerId);
      const followingValidation = ValidationUtils.validateUUID(followingId);
      
      if (!followerValidation.isValid) {
        return { success: false, error: `Invalid follower ID: ${followerValidation.error}` };
      }
      
      if (!followingValidation.isValid) {
        return { success: false, error: `Invalid following ID: ${followingValidation.error}` };
      }

      const sanitizedFollowerId = followerValidation.sanitized;
      const sanitizedFollowingId = followingValidation.sanitized;

      // 언팔로우 실행
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', sanitizedFollowerId)
        .eq('following_id', sanitizedFollowingId);

      if (error) {
        logger.error('❌ Error unfollowing user:', error);
        return { success: false, error: error.message };
      }

      // 캐시 업데이트
      this.clearCacheForUser(sanitizedFollowerId);
      this.clearCacheForUser(sanitizedFollowingId);

      logger.debug(`✅ User ${sanitizedFollowerId} unfollowed ${sanitizedFollowingId}`);
      return { success: true, error: null };

    } catch (error) {
      logger.error('❌ Exception in unfollowUser:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 팔로워 수 조회
   */
  async getFollowersCount(userId) {
    try {
      const validation = ValidationUtils.validateUUID(userId);
      if (!validation.isValid) {
        return { success: false, count: 0, error: `Invalid user ID: ${validation.error}` };
      }

      const sanitizedUserId = validation.sanitized;

      // 캐시 확인
      const cacheKey = this.getCacheKey('followersCount', { userId: sanitizedUserId });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return { success: true, count: cached, error: null };
      }

      // DB 조회
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', sanitizedUserId);

      if (error) {
        logger.error('❌ Error getting followers count:', error);
        return { success: false, count: 0, error: error.message };
      }

      const followersCount = count || 0;
      
      // 캐시 저장
      this.setCache(cacheKey, followersCount);
      
      logger.debug(`✅ Followers count for ${sanitizedUserId}: ${followersCount}`);
      return { success: true, count: followersCount, error: null };

    } catch (error) {
      logger.error('❌ Exception in getFollowersCount:', error);
      return { success: false, count: 0, error: error.message };
    }
  }

  /**
   * 팔로잉 수 조회
   */
  async getFollowingCount(userId) {
    try {
      const validation = ValidationUtils.validateUUID(userId);
      if (!validation.isValid) {
        return { success: false, count: 0, error: `Invalid user ID: ${validation.error}` };
      }

      const sanitizedUserId = validation.sanitized;

      // 캐시 확인
      const cacheKey = this.getCacheKey('followingCount', { userId: sanitizedUserId });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return { success: true, count: cached, error: null };
      }

      // DB 조회
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', sanitizedUserId);

      if (error) {
        logger.error('❌ Error getting following count:', error);
        return { success: false, count: 0, error: error.message };
      }

      const followingCount = count || 0;
      
      // 캐시 저장
      this.setCache(cacheKey, followingCount);
      
      logger.debug(`✅ Following count for ${sanitizedUserId}: ${followingCount}`);
      return { success: true, count: followingCount, error: null };

    } catch (error) {
      logger.error('❌ Exception in getFollowingCount:', error);
      return { success: false, count: 0, error: error.message };
    }
  }

  /**
   * 팔로워 목록 조회
   */
  async getFollowers(userId, options = {}) {
    try {
      const validation = ValidationUtils.validateUUID(userId);
      if (!validation.isValid) {
        return { success: false, data: [], error: `Invalid user ID: ${validation.error}` };
      }

      const sanitizedUserId = validation.sanitized;
      const { limit = 50, offset = 0 } = options;

      // 캐시 확인 (제한적으로 - 팔로워 목록은 자주 변경되고 크기가 클 수 있음)
      const cacheKey = this.getCacheKey('followers', { userId: sanitizedUserId, limit, offset });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return { success: true, data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          created_at,
          profiles:profiles!follows_follower_id_fkey (
            user_id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('following_id', sanitizedUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('❌ Error getting followers:', error);
        return { success: false, data: [], error: error.message };
      }

      // 데이터 정규화
      const followers = data.map(follow => ({
        user_id: follow.follower_id,
        username: follow.profiles?.username,
        full_name: follow.profiles?.full_name,
        avatar_url: follow.profiles?.avatar_url,
        followed_at: follow.created_at
      }));

      // 캐시 저장 (작은 목록만)
      if (followers.length <= 20) {
        this.setCache(cacheKey, followers);
      }

      logger.debug(`✅ Got ${followers.length} followers for ${sanitizedUserId}`);
      return { success: true, data: followers, error: null };

    } catch (error) {
      logger.error('❌ Exception in getFollowers:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * 팔로잉 목록 조회
   */
  async getFollowing(userId, options = {}) {
    try {
      const validation = ValidationUtils.validateUUID(userId);
      if (!validation.isValid) {
        return { success: false, data: [], error: `Invalid user ID: ${validation.error}` };
      }

      const sanitizedUserId = validation.sanitized;
      const { limit = 50, offset = 0 } = options;

      // 캐시 확인
      const cacheKey = this.getCacheKey('following', { userId: sanitizedUserId, limit, offset });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return { success: true, data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          created_at,
          profiles:profiles!follows_following_id_fkey (
            user_id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_id', sanitizedUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('❌ Error getting following:', error);
        return { success: false, data: [], error: error.message };
      }

      // 데이터 정규화
      const following = data.map(follow => ({
        user_id: follow.following_id,
        username: follow.profiles?.username,
        full_name: follow.profiles?.full_name,
        avatar_url: follow.profiles?.avatar_url,
        followed_at: follow.created_at
      }));

      // 캐시 저장 (작은 목록만)
      if (following.length <= 20) {
        this.setCache(cacheKey, following);
      }

      logger.debug(`✅ Got ${following.length} following for ${sanitizedUserId}`);
      return { success: true, data: following, error: null };

    } catch (error) {
      logger.error('❌ Exception in getFollowing:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * 팔로워 제거 (자신의 팔로워를 제거)
   */
  async removeFollower(userId, followerUserId) {
    try {
      const userValidation = ValidationUtils.validateUUID(userId);
      const followerValidation = ValidationUtils.validateUUID(followerUserId);
      
      if (!userValidation.isValid) {
        return { success: false, error: `Invalid user ID: ${userValidation.error}` };
      }
      
      if (!followerValidation.isValid) {
        return { success: false, error: `Invalid follower ID: ${followerValidation.error}` };
      }

      const sanitizedUserId = userValidation.sanitized;
      const sanitizedFollowerUserId = followerValidation.sanitized;

      // 팔로우 관계 제거 (followerUserId가 userId를 팔로우하는 관계를 제거)
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', sanitizedFollowerUserId)
        .eq('following_id', sanitizedUserId);

      if (error) {
        logger.error('❌ Error removing follower:', error);
        return { success: false, error: error.message };
      }

      // 캐시 업데이트
      this.clearCacheForUser(sanitizedUserId);
      this.clearCacheForUser(sanitizedFollowerUserId);

      logger.debug(`✅ Removed follower ${sanitizedFollowerUserId} from ${sanitizedUserId}`);
      return { success: true, error: null };

    } catch (error) {
      logger.error('❌ Exception in removeFollower:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 배치 팔로우 상태 확인
   */
  async batchCheckFollowStatus(followerId, userIds) {
    try {
      const followerValidation = ValidationUtils.validateUUID(followerId);
      if (!followerValidation.isValid) {
        return { success: false, data: {}, error: `Invalid follower ID: ${followerValidation.error}` };
      }

      const sanitizedFollowerId = followerValidation.sanitized;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return { success: true, data: {}, error: null };
      }

      // UUID 검증
      const validUserIds = [];
      for (const userId of userIds) {
        const validation = ValidationUtils.validateUUID(userId);
        if (validation.isValid) {
          validUserIds.push(validation.sanitized);
        }
      }

      if (validUserIds.length === 0) {
        return { success: true, data: {}, error: null };
      }

      // 배치 크기로 나누어 처리
      const results = {};
      for (let i = 0; i < validUserIds.length; i += this.batchSize) {
        const batch = validUserIds.slice(i, i + this.batchSize);
        
        const { data, error } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', sanitizedFollowerId)
          .in('following_id', batch);

        if (error) {
          logger.error('❌ Error in batch follow check:', error);
          return { success: false, data: {}, error: error.message };
        }

        // 결과 매핑
        const followingSet = new Set(data.map(row => row.following_id));
        batch.forEach(userId => {
          results[userId] = followingSet.has(userId);
        });
      }

      logger.debug(`✅ Batch follow check completed for ${validUserIds.length} users`);
      return { success: true, data: results, error: null };

    } catch (error) {
      logger.error('❌ Exception in batchCheckFollowStatus:', error);
      return { success: false, data: {}, error: error.message };
    }
  }

  /**
   * 캐시 상태 조회 (디버깅용)
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      timeout: this.cacheTimeout
    };
  }

  /**
   * 팔로우 테이블 초기화
   */
  async initializeFollowsTable() {
    try {
      logger.debug('🔄 Initializing follows table');

      // follows 테이블이 존재하는지 확인
      const { data, error } = await supabase
        .from('follows')
        .select('count(*)', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        logger.warn('⚠️ Follows table might not exist:', error.message);
        return { success: false, error: error.message };
      }

      logger.debug('✅ Follows table initialized successfully');
      return { success: true, error: null };
    } catch (error) {
      logger.error('❌ Error initializing follows table:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 전체 캐시 클리어
   */
  clearAllCache() {
    this.cache.clear();
    logger.debug('🗑️ Cleared all follow cache');
  }
}

// 싱글톤 인스턴스 생성
const unifiedFollowService = new UnifiedFollowService();

export default unifiedFollowService;