/**
 * 빠른 팔로우 데이터 확인 도구
 */

import { supabase } from '../services/supabase';

class QuickFollowCheck {
  constructor() {
    this.davidLeeId = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
    this.alexKimId = '10663749-9fba-4039-9f22-d6e7add9ea2d';
  }

  async checkDavidLeeData() {
    console.log('🔍 CHECKING DAVID LEE FOLLOW DATA');
    console.log('================================');
    console.log(`David Lee ID: ${this.davidLeeId}`);
    console.log(`Alex Kim ID: ${this.alexKimId}`);

    try {
      // 1. David Lee가 팔로우하는 모든 사람들
      const { data: davidFollowing, error: followingError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', this.davidLeeId);

      console.log('\n📊 David Lee Following:');
      if (followingError) {
        console.error('   Error:', followingError);
      } else {
        console.log(`   Count: ${davidFollowing.length}`);
        davidFollowing.forEach((follow, index) => {
          console.log(`   ${index + 1}. Following ${follow.following_id} (created: ${follow.created_at})`);
        });
      }

      // 2. David Lee를 팔로우하는 모든 사람들
      const { data: davidFollowers, error: followersError } = await supabase
        .from('follows')
        .select('*')
        .eq('following_id', this.davidLeeId);

      console.log('\n📊 David Lee Followers:');
      if (followersError) {
        console.error('   Error:', followersError);
      } else {
        console.log(`   Count: ${davidFollowers.length}`);
        davidFollowers.forEach((follow, index) => {
          console.log(`   ${index + 1}. Followed by ${follow.follower_id} (created: ${follow.created_at})`);
        });
      }

      // 3. David → Alex 특정 관계 확인
      const { data: davidAlexRelation, error: relationError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', this.davidLeeId)
        .eq('following_id', this.alexKimId);

      console.log('\n🔗 David → Alex Relationship:');
      if (relationError) {
        console.error('   Error:', relationError);
      } else {
        console.log(`   Exists: ${davidAlexRelation.length > 0 ? 'YES' : 'NO'}`);
        if (davidAlexRelation.length > 0) {
          console.log(`   Data:`, davidAlexRelation[0]);
        }
      }

      // 4. 전체 follows 테이블 상태
      const { data: allFollows, error: allError } = await supabase
        .from('follows')
        .select('*');

      console.log('\n📋 All Follows in Database:');
      if (allError) {
        console.error('   Error:', allError);
      } else {
        console.log(`   Total relationships: ${allFollows.length}`);
        allFollows.forEach((follow, index) => {
          console.log(`   ${index + 1}. ${follow.follower_id} → ${follow.following_id} (${follow.created_at})`);
        });
      }

    } catch (error) {
      console.error('❌ Check failed:', error);
    }
  }

  async checkCacheVsDatabase() {
    console.log('\n🔍 CACHE VS DATABASE COMPARISON');
    console.log('===============================');

    try {
      // 캐시에서 데이터 가져오기
      const followCacheStore = require('../store/FollowCacheStore').default;
      const cachedData = followCacheStore.getFromCache(this.davidLeeId);
      
      console.log('💾 Cached data for David Lee:', cachedData);

      // 데이터베이스에서 직접 카운트
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', this.davidLeeId);

      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', this.davidLeeId);

      console.log('📊 Database counts for David Lee:');
      console.log(`   Following: ${followingError ? 'ERROR' : followingCount}`);
      console.log(`   Followers: ${followersError ? 'ERROR' : followersCount}`);

      // 비교
      if (cachedData) {
        console.log('\n🔍 Comparison:');
        console.log(`   Following - Cache: ${cachedData.followingCount}, DB: ${followingCount}`);
        console.log(`   Followers - Cache: ${cachedData.followersCount}, DB: ${followersCount}`);
        
        const followingMatch = cachedData.followingCount === followingCount;
        const followersMatch = cachedData.followersCount === followersCount;
        
        console.log(`   Following match: ${followingMatch ? '✅' : '❌'}`);
        console.log(`   Followers match: ${followersMatch ? '✅' : '❌'}`);
        
        if (!followingMatch || !followersMatch) {
          console.log('⚠️ CACHE IS STALE! Clearing cache...');
          followCacheStore.clearCache(this.davidLeeId);
        }
      } else {
        console.log('💾 No cached data found for David Lee');
      }

    } catch (error) {
      console.error('❌ Cache vs DB check failed:', error);
    }
  }

  async fixDavidLeeData() {
    console.log('\n🔧 FIXING DAVID LEE DATA');
    console.log('========================');

    try {
      // 1. 캐시 클리어
      const followCacheStore = require('../store/FollowCacheStore').default;
      followCacheStore.clearCache(this.davidLeeId);
      console.log('✅ Cleared cache for David Lee');

      // 2. UnifiedFollowService로 새로운 데이터 가져오기
      const UnifiedFollowService = require('../services/UnifiedFollowService').default;
      
      const followingResult = await UnifiedFollowService.getFollowingCount(this.davidLeeId);
      const followersResult = await UnifiedFollowService.getFollowersCount(this.davidLeeId);
      
      console.log('🔄 Fresh data from UnifiedFollowService:');
      console.log(`   Following: ${followingResult.success ? followingResult.count : 'ERROR'}`);
      console.log(`   Followers: ${followersResult.success ? followersResult.count : 'ERROR'}`);

      // 3. 새로운 데이터로 캐시 설정
      if (followingResult.success && followersResult.success) {
        followCacheStore.setCache(this.davidLeeId, {
          followingCount: followingResult.count,
          followersCount: followersResult.count,
          isFollowing: false // David Lee 자신의 프로필이므로
        });
        console.log('✅ Updated cache with fresh data');
      }

    } catch (error) {
      console.error('❌ Fix failed:', error);
    }
  }
}

// 싱글톤 인스턴스
const quickCheck = new QuickFollowCheck();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.checkDavidLeeData = () => quickCheck.checkDavidLeeData();
  global.checkCacheVsDatabase = () => quickCheck.checkCacheVsDatabase();
  global.fixDavidLeeData = () => quickCheck.fixDavidLeeData();
  
  console.log('⚡ Quick follow check ready!');
  console.log('💡 Commands:');
  console.log('   global.checkDavidLeeData() - Check David Lee database');
  console.log('   global.checkCacheVsDatabase() - Compare cache vs DB');
  console.log('   global.fixDavidLeeData() - Fix David Lee data');
}

export default quickCheck;