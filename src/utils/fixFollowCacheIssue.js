/**
 * 팔로우 캐시 불일치 문제 해결
 */

import UnifiedFollowService from '../services/UnifiedFollowService';
import { supabase } from '../services/supabase';

class FollowCacheIssueFixed {
  constructor() {
    this.davidLeeId = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
    this.alexKimId = '10663749-9fba-4039-9f22-d6e7add9ea2d';
  }

  /**
   * 캐시와 데이터베이스 불일치 문제 해결
   */
  async fixCacheIssue() {
    console.log('🔧 FIXING FOLLOW CACHE ISSUE');
    console.log('============================');

    try {
      // 1. 모든 캐시 클리어
      console.log('🗑️ Clearing all caches...');
      UnifiedFollowService.clearAllCache();

      // 2. 데이터베이스에서 실제 상태 확인
      console.log('📊 Checking actual database state...');
      
      // David Lee의 팔로잉 상태
      const { data: davidFollowing, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', this.davidLeeId);

      console.log('👤 David Lee following in DB:', davidFollowing?.length || 0);
      if (davidFollowing) {
        davidFollowing.forEach(f => console.log(`   - Following: ${f.following_id}`));
      }

      // Alex Kim의 팔로워 상태
      const { data: alexFollowers, error: followersError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', this.alexKimId);

      console.log('👤 Alex Kim followers in DB:', alexFollowers?.length || 0);
      if (alexFollowers) {
        alexFollowers.forEach(f => console.log(`   - Followed by: ${f.follower_id}`));
      }

      // 3. David → Alex 관계 확인
      const davidFollowsAlex = davidFollowing?.find(f => f.following_id === this.alexKimId);
      const alexFollowedByDavid = alexFollowers?.find(f => f.follower_id === this.davidLeeId);

      console.log('🔗 Relationship check:');
      console.log(`   David follows Alex: ${davidFollowsAlex ? 'YES' : 'NO'}`);
      console.log(`   Alex followed by David: ${alexFollowedByDavid ? 'YES' : 'NO'}`);

      // 4. UnifiedFollowService로 올바른 데이터 다시 로드
      console.log('\n🔄 Reloading data through UnifiedFollowService...');
      
      const davidFollowingCount = await UnifiedFollowService.getFollowingCount(this.davidLeeId);
      const davidFollowersCount = await UnifiedFollowService.getFollowersCount(this.davidLeeId);
      const alexFollowingCount = await UnifiedFollowService.getFollowingCount(this.alexKimId);
      const alexFollowersCount = await UnifiedFollowService.getFollowersCount(this.alexKimId);

      console.log('📊 Fresh counts from service:');
      console.log(`   David Lee - Following: ${davidFollowingCount.count}, Followers: ${davidFollowersCount.count}`);
      console.log(`   Alex Kim - Following: ${alexFollowingCount.count}, Followers: ${alexFollowersCount.count}`);

      // 5. 팔로우 상태 확인
      const davidFollowsAlexStatus = await UnifiedFollowService.isFollowing(this.davidLeeId, this.alexKimId);
      console.log(`🔗 David follows Alex (service): ${davidFollowsAlexStatus.isFollowing ? 'YES' : 'NO'}`);

      // 6. 캐시 상태 확인
      const cacheStats = UnifiedFollowService.getCacheStats();
      console.log('💾 Updated cache stats:', cacheStats);

      console.log('\n✅ Cache issue fix completed!');
      console.log('💡 Try refreshing the profile page now');

    } catch (error) {
      console.error('❌ Fix failed:', error);
    }
  }

  /**
   * 특정 사용자의 프로필 데이터 강제 새로고침
   */
  async forceRefreshProfile(userId) {
    try {
      console.log(`🔄 Force refreshing profile for user: ${userId}`);
      
      // 캐시 클리어
      UnifiedFollowService.clearCache(userId);
      
      // 새 데이터 로드
      const followingResult = await UnifiedFollowService.getFollowingCount(userId);
      const followersResult = await UnifiedFollowService.getFollowersCount(userId);
      
      console.log(`📊 Refreshed counts for ${userId}:`);
      console.log(`   Following: ${followingResult.count}`);
      console.log(`   Followers: ${followersResult.count}`);
      
      return {
        followingCount: followingResult.count,
        followersCount: followersResult.count
      };
      
    } catch (error) {
      console.error('❌ Profile refresh failed:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스
const followCacheIssueFixed = new FollowCacheIssueFixed();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.fixFollowCacheIssue = () => followCacheIssueFixed.fixCacheIssue();
  global.forceRefreshProfile = (userId) => followCacheIssueFixed.forceRefreshProfile(userId || 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22');
  
  console.log('🔧 Follow cache issue fixer ready!');
  console.log('💡 Commands:');
  console.log('   global.fixFollowCacheIssue() - Fix cache inconsistency');
  console.log('   global.forceRefreshProfile(userId) - Force refresh specific user');
}

export default followCacheIssueFixed;