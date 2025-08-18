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
import notificationService from './notifications';

class UnifiedFollowService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10분 캐시 (팔로우 데이터는 안정적이므로 더 긴 캐시 유지)
    this.maxCacheSize = 500; // 팔로우 관계는 많을 수 있음
    this.batchSize = 50;
    this.maxRetries = 2; // 최대 재시도 횟수
    this.retryDelay = 1000; // 재시도 지연 시간 (1초)
    
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
      logger.debug(`⏰ Cache expired for key: ${key} - triggering fresh DB query`);
      // 🔧 FIX: 캐시 만료 시 null 반환으로 변경하여 "데이터 없음"이 아닌 "캐시 없음"을 명확히 구분
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
   * 팔로우 액션 후 캐시를 선택적으로 업데이트 (전체 삭제 대신 증분 업데이트)
   */
  updateCacheAfterFollow(followerId, followingId, isNewFollow) {
    try {
      // 1. 팔로우 상태 캐시 업데이트
      const followStateKey = this.getCacheKey('isFollowing', { followerId, followingId });
      this.setCache(followStateKey, isNewFollow);
      
      // 2. 팔로워 수 캐시 증분 업데이트 (팔로잉 당하는 사람의 팔로워 수)
      const followingUserFollowersKey = this.getCacheKey('followersCount', { userId: followingId });
      const followingUserFollowersCache = this.getFromCache(followingUserFollowersKey);
      if (followingUserFollowersCache !== null) {
        const newCount = Math.max(0, followingUserFollowersCache + (isNewFollow ? 1 : -1));
        this.setCache(followingUserFollowersKey, newCount);
        logger.debug(`📊 Updated followers count for ${followingId}: ${followingUserFollowersCache} → ${newCount}`);
      }
      
      // 3. 팔로잉 수 캐시 증분 업데이트 (팔로우 하는 사람의 팔로잉 수)
      const followerUserFollowingKey = this.getCacheKey('followingCount', { userId: followerId });
      const followerUserFollowingCache = this.getFromCache(followerUserFollowingKey);
      if (followerUserFollowingCache !== null) {
        const newCount = Math.max(0, followerUserFollowingCache + (isNewFollow ? 1 : -1));
        this.setCache(followerUserFollowingKey, newCount);
        logger.debug(`📊 Updated following count for ${followerId}: ${followerUserFollowingCache} → ${newCount}`);
      }
      
      logger.debug(`✅ Smart cache update completed - ${isNewFollow ? 'follow' : 'unfollow'} action`);
    } catch (error) {
      logger.error('❌ Error in smart cache update, falling back to cache clear:', error);
      // 오류 발생 시 안전하게 관련 캐시만 삭제
      this.clearCacheForUser(followerId);
      this.clearCacheForUser(followingId);
    }
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
        logger.debug(`📦 Cache hit for follow status: ${sanitizedFollowerId} → ${sanitizedFollowingId} = ${cached}`);
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
      // 🚨 CRITICAL DEBUG: 팔로우 호출 추적
      console.log('🔥🔥🔥 FOLLOW STARTING 🔥🔥🔥', {
        followerId,
        followingId,
        timestamp: new Date().toISOString()
      });
      
      // 추가 추적
      if (typeof global?.trackFollow === 'function') {
        global.trackFollow('🔥 FOLLOW STARTING', { followerId, followingId });
      }
      
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

      // 인증 컨텍스트 확인 및 강제 동기화
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        logger.error('❌ Authentication context missing for follow operation');
        return { success: false, error: 'Authentication required' };
      }

      // RLS 정책 검증: 현재 사용자가 follower_id와 일치하는지 확인
      if (currentUser.id !== sanitizedFollowerId) {
        logger.error('❌ RLS Policy violation: auth.uid() != follower_id', {
          authUserId: currentUser.id,
          followerId: sanitizedFollowerId
        });
        return { success: false, error: 'Unauthorized follow operation' };
      }

      // 팔로우 생성 (인증 컨텍스트 확인 후 안전하게 생성)
      const { data, error } = await supabase
        .from('follows')
        .insert([{
          follower_id: sanitizedFollowerId,
          following_id: sanitizedFollowingId
        }])
        .select()
        .single();

      if (error) {
        // 중복 키 에러인 경우 이미 팔로우 중으로 처리
        if (error.code === '23505') {
          logger.warn('⚠️ Follow relationship already exists:', { followerId: sanitizedFollowerId, followingId: sanitizedFollowingId });
          return { success: false, error: 'Already following this user' };
        }
        
        logger.error('❌ Error creating follow:', error);
        return { success: false, error: error.message };
      }

      // 캐시 무효화 - 팔로우 관련 모든 캐시 클리어
      this.invalidateFollowCaches(sanitizedFollowerId, sanitizedFollowingId);

      // 노티피케이션은 데이터베이스 트리거에서 자동 생성됨 (중복 방지)
      console.log('🚨 FOLLOW SUCCESS: Notification will be created by database trigger', {
        follower: sanitizedFollowerId,
        following: sanitizedFollowingId,
        timestamp: new Date().toISOString()
      });

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
      // 🚨 CRITICAL DEBUG: 호출 스택 추적
      console.log('💥💥💥 UNFOLLOW STARTING 💥💥💥', {
        followerId,
        followingId,
        timestamp: new Date().toISOString()
      });
      
      // 추가 추적
      if (typeof global?.trackFollow === 'function') {
        global.trackFollow('💥 UNFOLLOW STARTING', { followerId, followingId });
      }
      
      logger.debug(`🔍 UNFOLLOW DEBUG START: followerId=${followerId}, followingId=${followingId}`);
      
      // 현재 인증 상태 먼저 확인
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        logger.error('❌ No authenticated user found');
        return { success: false, error: 'Authentication required' };
      }
      
      logger.debug(`🔍 CURRENT AUTH USER: ${currentUser.id}`);
      logger.debug(`🔍 UNFOLLOW PARAMS: follower=${followerId}, following=${followingId}`);
      
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

      // 🔧 CRITICAL FIX: 인증된 사용자 ID를 강제로 사용 (보안 강화)
      // 전달받은 followerId 대신 현재 인증된 사용자 ID 사용
      const authenticatedFollowerId = currentUser.id;
      
      logger.debug('🔍 UNFOLLOW AUTH FIX:', {
        originalFollowerId: sanitizedFollowerId,
        authenticatedFollowerId: authenticatedFollowerId,
        followingId: sanitizedFollowingId,
        usingAuthenticated: true
      });
      
      if (sanitizedFollowerId !== authenticatedFollowerId) {
        logger.warn('⚠️ SECURITY: followerId mismatch - using authenticated user ID', {
          provided: sanitizedFollowerId,
          authenticated: authenticatedFollowerId
        });
      }

      // 언팔로우 실행 (인증된 사용자 ID로 안전하게 삭제)
      console.log('🚨 EXECUTING UNFOLLOW:', {
        authenticatedFollowerId,
        sanitizedFollowingId,
        query: `DELETE FROM follows WHERE follower_id='${authenticatedFollowerId}' AND following_id='${sanitizedFollowingId}'`
      });
      
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', authenticatedFollowerId)  // 🔧 인증된 사용자 ID 사용
        .eq('following_id', sanitizedFollowingId);

      if (error) {
        logger.error('❌ Error unfollowing user:', error);
        return { success: false, error: error.message };
      }

      // 캐시 무효화 - 팔로우 관련 모든 캐시 클리어
      this.invalidateFollowCaches(authenticatedFollowerId, sanitizedFollowingId);

      logger.debug(`✅ User ${authenticatedFollowerId} unfollowed ${sanitizedFollowingId}`);
      return { success: true, error: null };

    } catch (error) {
      logger.error('❌ Exception in unfollowUser:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 팔로우 상태 토글 (팔로우 <-> 언팔로우)
   * @param {string} followerId - 팔로우하는 사용자 ID (현재 로그인한 사용자)
   * @param {string} followingId - 팔로우당하는 사용자 ID (대상 사용자)
   */
  async toggleFollow(followerId, followingId) {
    try {
      logger.debug(`🔄 Toggle follow: ${followerId} → ${followingId}`);
      
      // 현재 팔로우 상태 확인
      const { success: checkSuccess, data: isFollowing, error: checkError } = await this.isFollowing(followerId, followingId);
      
      if (!checkSuccess || checkError) {
        logger.error('❌ Failed to check follow status for toggle:', checkError);
        return { success: false, error: checkError };
      }

      if (isFollowing) {
        // 현재 팔로우 중이면 언팔로우
        logger.debug(`🔍 TOGGLE DEBUG: Calling unfollowUser(${followerId}, ${followingId})`);
        const result = await this.unfollowUser(followerId, followingId);
        return { 
          success: result.success, 
          isFollowing: false, 
          data: result.data, 
          error: result.error 
        };
      } else {
        // 현재 팔로우하지 않으면 팔로우
        const result = await this.followUser(followerId, followingId);
        return { 
          success: result.success, 
          isFollowing: true, 
          data: result.data, 
          error: result.error 
        };
      }

    } catch (error) {
      logger.error('❌ Exception in toggleFollow:', error);
      return { success: false, isFollowing: false, error: error.message };
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

      // DB 조회 (재시도 로직 적용)
      const { count, error } = await this.withRetry(async () => {
        return await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', sanitizedUserId);
      }, 'getFollowersCount');

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

      // DB 조회 (재시도 로직 적용)
      const { count, error } = await this.withRetry(async () => {
        return await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', sanitizedUserId);
      }, 'getFollowingCount');

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
        logger.debug(`📦 Cache hit: returning ${cached.length} followers for ${sanitizedUserId}`);
        return { success: true, data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          created_at
        `)
        .eq('following_id', sanitizedUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('❌ Error getting followers:', error);
        return { success: false, data: [], error: error.message };
      }

      // 별도로 profiles 데이터 가져오기 (JOIN 오류 방지)
      let followers = [];
      if (data && data.length > 0) {
        const followerIds = data.map(f => f.follower_id);
        logger.debug('📋 Follower IDs to fetch profiles:', followerIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url, bio')
          .in('user_id', followerIds);

        if (profilesError) {
          logger.error('❌ Error getting follower profiles:', profilesError);
          // 프로필 데이터 없이 기본 구조로 반환
          followers = data.map(follow => ({
            user_id: follow.follower_id,
            username: null,
            bio: null,
            avatar_url: null,
            followed_at: follow.created_at
          }));
        } else {
          // profiles 데이터와 follows 데이터 조합
          const profileMap = new Map(profilesData.map(p => [p.user_id, p]));
          
          followers = data.map(follow => {
            const profile = profileMap.get(follow.follower_id);
            return {
              user_id: follow.follower_id,
              username: profile?.username,
              bio: profile?.bio,
              avatar_url: profile?.avatar_url,
              followed_at: follow.created_at
            };
          });
        }
      }

      // 캐시 저장 (작은 목록만)
      if (followers.length <= 20) {
        this.setCache(cacheKey, followers);
        logger.debug(`📦 Cached ${followers.length} followers for ${sanitizedUserId}`);
      } else {
        logger.debug(`📦 Skip caching ${followers.length} followers (too large) for ${sanitizedUserId}`);
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
        logger.debug(`📦 Cache hit: returning ${cached.length} following for ${sanitizedUserId}`);
        return { success: true, data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          created_at
        `)
        .eq('follower_id', sanitizedUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('❌ Error getting following:', error);
        return { success: false, data: [], error: error.message };
      }

      // 별도로 profiles 데이터 가져오기 (JOIN 오류 방지)
      let following = [];
      if (data && data.length > 0) {
        const followingIds = data.map(f => f.following_id);
        logger.debug('📋 Following IDs to fetch profiles:', followingIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url, bio')
          .in('user_id', followingIds);

        if (profilesError) {
          logger.error('❌ Error getting following profiles:', profilesError);
          // 프로필 데이터 없이 기본 구조로 반환
          following = data.map(follow => ({
            user_id: follow.following_id,
            username: null,
            bio: null,
            avatar_url: null,
            followed_at: follow.created_at
          }));
        } else {
          // profiles 데이터와 follows 데이터 조합
          const profileMap = new Map(profilesData.map(p => [p.user_id, p]));
          
          following = data.map(follow => {
            const profile = profileMap.get(follow.following_id);
            return {
              user_id: follow.following_id,
              username: profile?.username,
              bio: profile?.bio,
              avatar_url: profile?.avatar_url,
              followed_at: follow.created_at
            };
          });
        }
      }

      // 캐시 저장 (작은 목록만)
      if (following.length <= 20) {
        this.setCache(cacheKey, following);
        logger.debug(`📦 Cached ${following.length} following for ${sanitizedUserId}`);
      } else {
        logger.debug(`📦 Skip caching ${following.length} following (too large) for ${sanitizedUserId}`);
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
   * 팔로우 관련 캐시 무효화
   * @param {string} followerId - 팔로우하는 사용자 ID
   * @param {string} followingId - 팔로우당하는 사용자 ID
   */
  invalidateFollowCaches(followerId, followingId) {
    logger.debug(`🔄 Invalidating follow caches for: ${followerId} ↔ ${followingId}`);
    
    // 팔로우 관련 모든 캐시 키 패턴
    const cachePatterns = [
      `follow:isFollowing:`,
      `follow:followers:`,
      `follow:following:`,
      `follow:followersCount:`,
      `follow:followingCount:`
    ];

    // 관련된 모든 캐시 키 찾아서 삭제
    for (const cacheKey of this.cache.keys()) {
      for (const pattern of cachePatterns) {
        if (cacheKey.startsWith(pattern)) {
          // follower 또는 following과 관련된 캐시만 삭제
          const keyData = cacheKey.substring(pattern.length);
          if (keyData.includes(followerId) || keyData.includes(followingId)) {
            this.cache.delete(cacheKey);
            logger.debug(`🗑️ Deleted cache: ${cacheKey}`);
          }
        }
      }
    }
    
    logger.debug(`✅ Follow caches invalidated for: ${followerId} ↔ ${followingId}`);
  }

  /**
   * 전체 캐시 클리어
   */
  clearAllCache() {
    this.cache.clear();
    logger.debug('🗑️ Cleared all follow cache');
  }

  /**
   * 캐시 무효화 - 데이터베이스 변경 후 관련 캐시만 선택적으로 무효화
   */
  invalidateRelatedCache(followerId, followingId) {
    const keysToInvalidate = [
      this.getCacheKey('isFollowing', { followerId, followingId }),
      this.getCacheKey('followersCount', { userId: followingId }),
      this.getCacheKey('followingCount', { userId: followerId }),
      this.getCacheKey('followers', { userId: followingId }),
      this.getCacheKey('following', { userId: followerId })
    ];
    
    keysToInvalidate.forEach(key => {
      // 정확한 키 매칭을 위해 전체 키로 검색
      for (const cacheKey of this.cache.keys()) {
        if (cacheKey.startsWith(key.split(':').slice(0, -1).join(':'))) {
          this.cache.delete(cacheKey);
        }
      }
    });
    
    logger.debug(`🔄 Invalidated cache for follow relationship: ${followerId} ↔ ${followingId}`);
  }

  /**
   * 네트워크 오류 시 재시도 로직
   */
  async withRetry(operation, operationName) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // 네트워크 오류인지 확인
        const isNetworkError = error.message?.includes('Network request failed') || 
                              error.code === '' || 
                              !error.code;
        
        if (!isNetworkError || attempt === this.maxRetries) {
          throw error;
        }
        
        logger.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${this.maxRetries}), retrying...`, error.message);
        
        // 재시도 전 지연
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
    
    throw lastError;
  }

  // 팔로우 노티피케이션은 데이터베이스 트리거에서 자동 생성됨 (중복 방지)

  /**
   * 팔로우 상태 디버깅 - 캐시와 DB 데이터 비교
   */
  async debugFollowStatus(followerId, followingId) {
    try {
      logger.debug(`🔍 DEBUG: Follow status for ${followerId} → ${followingId}`);
      
      // 1. 캐시 상태 확인
      const cacheKey = this.getCacheKey('isFollowing', { followerId, followingId });
      const cachedResult = this.getFromCache(cacheKey);
      
      // 2. 실제 DB 상태 확인 (캐시 우회)
      const { data: dbResult, error } = await supabase
        .from('follows')
        .select('id, created_at')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();
      
      const dbExists = !error && !!dbResult;
      
      // 3. 결과 비교
      const result = {
        followerId,
        followingId,
        cache: {
          exists: cachedResult !== null && cachedResult !== undefined,
          value: cachedResult,
          key: cacheKey
        },
        database: {
          exists: dbExists,
          data: dbResult,
          error: error?.message
        },
        mismatch: (cachedResult !== dbExists)
      };
      
      console.log('🔍 FOLLOW DEBUG RESULT:', JSON.stringify(result, null, 2));
      
      return result;
      
    } catch (error) {
      logger.error('❌ Debug follow status failed:', error);
      return { error: error.message };
    }
  }

  /**
   * 모든 팔로우 관계 확인 (특정 사용자)
   */
  async debugUserFollowStatus(userId) {
    try {
      logger.debug(`🔍 DEBUG: All follow relationships for user ${userId}`);
      
      // 내가 팔로우하는 사람들
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', userId);
      
      // 나를 팔로우하는 사람들  
      const { data: followers, error: followersError } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', userId);
      
      const result = {
        userId,
        following: {
          count: following?.length || 0,
          list: following || [],
          error: followingError?.message
        },
        followers: {
          count: followers?.length || 0,
          list: followers || [],
          error: followersError?.message
        }
      };
      
      console.log('👥 USER FOLLOW DEBUG:', JSON.stringify(result, null, 2));
      
      return result;
      
    } catch (error) {
      logger.error('❌ Debug user follow status failed:', error);
      return { error: error.message };
    }
  }
}

// 싱글톤 인스턴스 생성
const unifiedFollowService = new UnifiedFollowService();

export default unifiedFollowService;