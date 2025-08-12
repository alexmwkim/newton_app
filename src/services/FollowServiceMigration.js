/**
 * FollowServiceMigration - 팔로우 서비스 마이그레이션 래퍼 RESTORED
 * 
 * 기존 follow.js와 followClient.js를 UnifiedFollowService로 점진적 마이그레이션
 * 기존 코드의 호환성을 보장하면서 새로운 통합 서비스 사용
 */

import UnifiedFollowService from './UnifiedFollowService';
import logger from '../utils/Logger';

/**
 * FollowService 마이그레이션 클래스 (기존 follow.js 대체)
 */
class FollowServiceMigration {
  constructor() {
    this.unifiedService = UnifiedFollowService;
    logger.debug('🔄 FollowService migrating to UnifiedFollowService');
  }

  // 기존 follow.js 메서드들과 호환되는 인터페이스 제공

  async followUser(followingUserId) {
    try {
      // 현재 사용자 ID를 어떻게 얻을지는 구현에 따라 달라짐
      // 일반적으로 AuthContext나 다른 방법으로 현재 사용자를 파악
      logger.warn('⚠️ followUser needs current user ID. Use followUser(followerId, followingId) instead');
      
      // 임시로 에러 반환 - 실제 구현에서는 현재 사용자 ID를 얻어야 함
      return { success: false, error: 'Current user ID required. Please use UnifiedFollowService.followUser(followerId, followingId)' };
      
    } catch (error) {
      logger.error('❌ FollowService migration error:', error);
      return { success: false, error: error.message };
    }
  }

  async unfollowUser(followingUserId) {
    try {
      logger.warn('⚠️ unfollowUser needs current user ID. Use unfollowUser(followerId, followingId) instead');
      return { success: false, error: 'Current user ID required. Please use UnifiedFollowService.unfollowUser(followerId, followingId)' };
      
    } catch (error) {
      logger.error('❌ FollowService migration error:', error);
      return { success: false, error: error.message };
    }
  }

  async getFollowersList(userId) {
    return this.unifiedService.getFollowers(userId);
  }

  async initializeFollowsTable() {
    return this.unifiedService.initializeFollowsTable();
  }

  async getFollowingList(userId) {
    return this.unifiedService.getFollowing(userId);
  }

  async getFollowersCount(userId) {
    return this.unifiedService.getFollowersCount(userId);
  }

  async getFollowingCount(userId) {
    return this.unifiedService.getFollowingCount(userId);
  }

  async isFollowing(followerId, followingId) {
    const result = await this.unifiedService.isFollowing(followerId, followingId);
    // 기존 API와 호환되도록 data를 최상위로 이동
    return {
      success: result.success,
      isFollowing: result.data,
      error: result.error
    };
  }

  async removeFollower(userId, followerUserId) {
    return this.unifiedService.removeFollower(userId, followerUserId);
  }

  // 새로운 기능들은 직접 통합 서비스로 연결
  async batchCheckFollowStatus(followerId, userIds) {
    return this.unifiedService.batchCheckFollowStatus(followerId, userIds);
  }
}

/**
 * FollowClientService 마이그레이션 클래스 (기존 followClient.js 대체)
 */
class FollowClientServiceMigration {
  constructor() {
    this.unifiedService = UnifiedFollowService;
    logger.debug('🔄 FollowClientService migrating to UnifiedFollowService');
  }

  async getFollowersCount(userId) {
    const result = await this.unifiedService.getFollowersCount(userId);
    // 기존 API 형식에 맞추어 변환
    return {
      success: result.success,
      count: result.count,
      error: result.error
    };
  }

  async getFollowingCount(userId) {
    const result = await this.unifiedService.getFollowingCount(userId);
    return {
      success: result.success,
      count: result.count,
      error: result.error
    };
  }

  async isFollowing(followerId, followingId) {
    const result = await this.unifiedService.isFollowing(followerId, followingId);
    return {
      success: result.success,
      isFollowing: result.data,
      error: result.error
    };
  }

  async getFollowers(userId) {
    const result = await this.unifiedService.getFollowers(userId);
    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  async getFollowing(userId) {
    const result = await this.unifiedService.getFollowing(userId);
    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  async followUser(followerId, followingId) {
    return this.unifiedService.followUser(followerId, followingId);
  }

  async unfollowUser(followerId, followingId) {
    return this.unifiedService.unfollowUser(followerId, followingId);
  }

  async removeFollower(userId, followerUserId) {
    return this.unifiedService.removeFollower(userId, followerUserId);
  }

  async initializeFollowsTable() {
    return this.unifiedService.initializeFollowsTable();
  }
}

// 인스턴스 생성 및 export
export const FollowService = new FollowServiceMigration();
export const FollowClientService = new FollowClientServiceMigration();

// 기본 export는 FollowService (기존 follow.js와 호환)
export default FollowService;