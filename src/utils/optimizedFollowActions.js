/**
 * 최적화된 팔로우/언팔로우 액션 유틸리티
 * 딜레이 없는 즉시 UI 업데이트를 위한 헬퍼 함수들
 */

import UnifiedFollowService from '../services/UnifiedFollowService';
// Real-time monitoring disabled for production
// import monitor from './realTimeMonitoring';

/**
 * 즉시 반응하는 언팔로우 액션
 * @param {string} currentUserId - 현재 사용자 ID
 * @param {string} targetUserId - 언팔로우할 사용자 ID  
 * @param {Function} onOptimisticUpdate - 즉시 UI 업데이트 콜백
 * @param {Function} onSuccess - 성공 시 콜백
 * @param {Function} onError - 실패 시 롤백 콜백
 */
export const instantUnfollow = async (
  currentUserId, 
  targetUserId, 
  onOptimisticUpdate, 
  onSuccess, 
  onError
) => {
  try {
    console.log('⚡ INSTANT UNFOLLOW: Starting immediate UI update...');
    
    // 1. 즉시 UI 업데이트 (사용자가 바로 볼 수 있도록)
    onOptimisticUpdate && onOptimisticUpdate();
    
    // 2. 백그라운드에서 실제 언팔로우 실행
    console.log('🚀 INSTANT UNFOLLOW: Executing database action...');
    const result = await UnifiedFollowService.unfollowUser(currentUserId, targetUserId);
    
    if (result.success) {
      console.log('✅ INSTANT UNFOLLOW: Database action successful');
      onSuccess && onSuccess(result);
    } else {
      console.error('❌ INSTANT UNFOLLOW: Database action failed:', result.error);
      onError && onError(result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ INSTANT UNFOLLOW: Exception:', error);
    onError && onError(error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 즉시 반응하는 팔로우 액션
 * @param {string} currentUserId - 현재 사용자 ID
 * @param {string} targetUserId - 팔로우할 사용자 ID
 * @param {Function} onOptimisticUpdate - 즉시 UI 업데이트 콜백
 * @param {Function} onSuccess - 성공 시 콜백
 * @param {Function} onError - 실패 시 롤백 콜백
 */
export const instantFollow = async (
  currentUserId, 
  targetUserId, 
  onOptimisticUpdate, 
  onSuccess, 
  onError
) => {
  try {
    console.log('⚡ INSTANT FOLLOW: Starting immediate UI update...');
    
    // 1. 즉시 UI 업데이트
    onOptimisticUpdate && onOptimisticUpdate();
    
    // 2. 백그라운드에서 실제 팔로우 실행
    console.log('🚀 INSTANT FOLLOW: Executing database action...');
    const result = await UnifiedFollowService.followUser(currentUserId, targetUserId);
    
    if (result.success) {
      console.log('✅ INSTANT FOLLOW: Database action successful');
      onSuccess && onSuccess(result);
    } else {
      console.error('❌ INSTANT FOLLOW: Database action failed:', result.error);
      onError && onError(result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ INSTANT FOLLOW: Exception:', error);
    onError && onError(error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 캐시 최적화 - 여러 사용자의 캐시를 한번에 무효화
 * @param {Array} userIds - 무효화할 사용자 ID 배열
 * @param {Object} followCacheStore - 캐시 스토어 인스턴스
 */
export const batchClearCache = (userIds, followService) => {
  console.log('🗑️ BATCH CACHE CLEAR:', userIds.length, 'users');
  userIds.forEach(userId => {
    if (userId) {
      followService.clearCacheForUser(userId);
    }
  });
  console.log('✅ BATCH CACHE CLEAR: Completed');
};

/**
 * 딜레이 없는 팔로우 토글 (언팔로우 최적화)
 * @param {boolean} isCurrentlyFollowing - 현재 팔로우 상태
 * @param {string} currentUserId - 현재 사용자 ID
 * @param {string} targetUserId - 대상 사용자 ID
 * @param {Object} ui - UI 업데이트 함수들 객체
 * @param {Object} cache - 캐시 스토어
 */
export const instantFollowToggle = async (
  isCurrentlyFollowing,
  currentUserId,
  targetUserId,
  ui,
  cache
) => {
  console.log(`⚡ INSTANT TOGGLE: ${isCurrentlyFollowing ? 'UNFOLLOW' : 'FOLLOW'}`);
  
  // 원본 상태 저장 (롤백용)
  const originalState = {
    isFollowing: isCurrentlyFollowing,
    followersCount: ui.currentFollowersCount
  };
  
  // 즉시 UI 업데이트
  const newFollowingState = !isCurrentlyFollowing;
  const newFollowersCount = isCurrentlyFollowing 
    ? ui.currentFollowersCount - 1 
    : ui.currentFollowersCount + 1;
    
  // UI 업데이트
  ui.setIsFollowing(newFollowingState);
  ui.setFollowersCount(newFollowersCount);
  
  // 캐시 즉시 무효화
  batchClearCache([currentUserId, targetUserId], cache);
  
  try {
    const startTime = performance.now();
    let result;
    
    if (isCurrentlyFollowing) {
      result = await UnifiedFollowService.unfollowUser(currentUserId, targetUserId);
    } else {
      result = await UnifiedFollowService.followUser(currentUserId, targetUserId);
    }
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // 모니터링에 액션 기록 (disabled)
    // monitor.recordFollowAction(responseTime);
    
    if (result.success) {
      console.log('✅ INSTANT TOGGLE: Database action successful');
      return { success: true, newState: newFollowingState };
    } else {
      // 실패시 롤백
      console.error('❌ INSTANT TOGGLE: Database action failed, rolling back...');
      // monitor.recordError(result.error);
      ui.setIsFollowing(originalState.isFollowing);
      ui.setFollowersCount(originalState.followersCount);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    // 예외시 롤백
    console.error('❌ INSTANT TOGGLE: Exception, rolling back...', error);
    // monitor.recordError(error.message);
    ui.setIsFollowing(originalState.isFollowing);
    ui.setFollowersCount(originalState.followersCount);
    return { success: false, error: error.message };
  }
};