/**
 * FollowCacheStore - 팔로우 데이터 캐시 스토어
 * 
 * 페이지 간 이동시 팔로우 카운트가 즉시 표시되도록 메모리 캐시 제공
 * - 캐시 만료시간: 30초 (팔로우 데이터는 자주 변경될 수 있음)
 * - LRU 캐시로 메모리 효율성 보장
 */

class FollowCacheStore {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 (더 오래 캐시 유지)
    this.maxCacheSize = 100; // 최대 100개 사용자 데이터 캐시
    
    console.log('🚀 FollowCacheStore initialized');
  }

  /**
   * 캐시 키 생성
   */
  getCacheKey(userId) {
    return `follow_data_${userId}`;
  }

  /**
   * 캐시에서 데이터 조회
   */
  getFromCache(userId) {
    const key = this.getCacheKey(userId);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    const { data, timestamp } = cached;
    const now = Date.now();
    
    // 캐시 만료 확인
    if (now - timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      console.log('🗑️ Follow cache expired for user:', userId);
      return null;
    }

    console.log('⚡ Follow cache hit for user:', userId, data);
    
    // LRU: 사용된 캐시를 맨 뒤로 이동
    this.cache.delete(key);
    this.cache.set(key, cached);
    
    return data;
  }

  /**
   * 캐시에 데이터 저장
   */
  setCache(userId, data) {
    const key = this.getCacheKey(userId);
    
    // LRU: 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.log('🗑️ Follow cache evicted oldest entry');
    }

    const cacheEntry = {
      data: {
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        isFollowing: data.isFollowing || false,
      },
      timestamp: Date.now()
    };

    this.cache.set(key, cacheEntry);
    console.log('💾 Follow cache saved for user:', userId, cacheEntry.data);
  }

  /**
   * 특정 사용자의 캐시 삭제 (팔로우/언팔로우 시)
   */
  invalidateUser(userId) {
    const key = this.getCacheKey(userId);
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log('🗑️ Follow cache invalidated for user:', userId);
    }
  }

  /**
   * 팔로우 액션 후 캐시 업데이트
   */
  updateFollowCache(targetUserId, currentUserId, newIsFollowing) {
    // 타겟 사용자의 팔로워 카운트 캐시 무효화
    this.invalidateUser(targetUserId);
    
    // 현재 사용자의 팔로잉 카운트 캐시 무효화
    if (currentUserId && currentUserId !== targetUserId) {
      this.invalidateUser(currentUserId);
    }
    
    console.log('🔄 Follow cache updated after action:', {
      targetUserId,
      currentUserId,
      newIsFollowing
    });
  }

  /**
   * 전체 캐시 클리어
   */
  clearAll() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Follow cache cleared (${size} entries removed)`);
  }

  /**
   * 캐시 상태 조회 (디버깅용)
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      timeout: this.cacheTimeout,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 싱글톤 인스턴스 생성
const followCacheStore = new FollowCacheStore();

export default followCacheStore;