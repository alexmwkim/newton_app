/**
 * 두 개의 팔로우 서비스 간 데이터 불일치 디버깅
 */

import FollowClientService from '../services/followClient';
import UnifiedFollowService from '../services/UnifiedFollowService';
import { supabase } from '../services/supabase';

class FollowServicesConflictDebugger {
  constructor() {
    this.davidLeeId = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
    this.alexKimId = '10663749-9fba-4039-9f22-d6e7add9ea2d';
  }

  /**
   * 두 서비스의 결과 비교
   */
  async compareServices() {
    console.log('🔍 COMPARING FOLLOW SERVICES');
    console.log('============================');
    
    try {
      // 1. 직접 데이터베이스 쿼리
      console.log('📊 1. Direct Database Query:');
      const { count: directFollowing, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', this.davidLeeId);
        
      const { count: directFollowers, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', this.davidLeeId);
        
      console.log(`   David Lee - Direct DB Following: ${directFollowing || 0}`);
      console.log(`   David Lee - Direct DB Followers: ${directFollowers || 0}`);
      
      // 2. FollowClientService (UserProfileScreen에서 사용)
      console.log('\n📊 2. FollowClientService (UserProfileScreen):');
      const clientResult = await FollowClientService.getBatchFollowData(this.davidLeeId, this.alexKimId);
      console.log(`   David Lee - Client Following: ${clientResult.followingCount}`);
      console.log(`   David Lee - Client Followers: ${clientResult.followersCount}`);
      console.log(`   Client Success: ${clientResult.success}`);
      console.log(`   Client Error: ${clientResult.error || 'None'}`);
      
      // 3. UnifiedFollowService (테스트에서 사용)
      console.log('\n📊 3. UnifiedFollowService (Tests):');
      const unifiedFollowing = await UnifiedFollowService.getFollowingCount(this.davidLeeId);
      const unifiedFollowers = await UnifiedFollowService.getFollowersCount(this.davidLeeId);
      console.log(`   David Lee - Unified Following: ${unifiedFollowing.count}`);
      console.log(`   David Lee - Unified Followers: ${unifiedFollowers.count}`);
      console.log(`   Unified Following Success: ${unifiedFollowing.success}`);
      console.log(`   Unified Followers Success: ${unifiedFollowers.success}`);
      
      // 4. 팔로우 상태 확인
      console.log('\n🔗 4. Follow Status Check:');
      const clientFollowStatus = clientResult.isFollowing;
      const unifiedFollowStatus = await UnifiedFollowService.isFollowing(this.davidLeeId, this.alexKimId);
      console.log(`   Client: David follows Alex = ${clientFollowStatus}`);
      console.log(`   Unified: David follows Alex = ${unifiedFollowStatus.isFollowing}`);
      
      // 5. 불일치 분석
      console.log('\n⚖️ 5. Inconsistency Analysis:');
      const followingMatch = directFollowing === clientResult.followingCount && directFollowing === unifiedFollowing.count;
      const followersMatch = directFollowers === clientResult.followersCount && directFollowers === unifiedFollowers.count;
      const statusMatch = clientFollowStatus === unifiedFollowStatus.isFollowing;
      
      console.log(`   Following counts match: ${followingMatch ? '✅' : '❌'}`);
      console.log(`   Followers counts match: ${followersMatch ? '✅' : '❌'}`);
      console.log(`   Follow status match: ${statusMatch ? '✅' : '❌'}`);
      
      if (!followingMatch) {
        console.log(`   ⚠️ Following mismatch: DB=${directFollowing}, Client=${clientResult.followingCount}, Unified=${unifiedFollowing.count}`);
      }
      if (!followersMatch) {
        console.log(`   ⚠️ Followers mismatch: DB=${directFollowers}, Client=${clientResult.followersCount}, Unified=${unifiedFollowers.count}`);
      }
      if (!statusMatch) {
        console.log(`   ⚠️ Status mismatch: Client=${clientFollowStatus}, Unified=${unifiedFollowStatus.isFollowing}`);
      }
      
      // 6. 해결책 제시
      if (!followingMatch || !followersMatch || !statusMatch) {
        console.log('\n💡 6. Solution:');
        console.log('   The issue is that UserProfileScreen uses FollowClientService');
        console.log('   while tests use UnifiedFollowService. They have different caching.');
        console.log('   ');
        console.log('   To fix: Update UserProfileScreen to use UnifiedFollowService');
        console.log('   or synchronize the cache between both services.');
      } else {
        console.log('\n✅ 6. All services are in sync!');
      }
      
    } catch (error) {
      console.error('❌ Comparison failed:', error);
    }
  }

  /**
   * UserProfileScreen이 사용하는 데이터 강제 새로고침
   */
  async forceRefreshUserProfileData() {
    console.log('🔄 FORCE REFRESH USER PROFILE DATA');
    console.log('===================================');
    
    try {
      // FollowClientService 캐시 클리어 (있다면)
      console.log('🗑️ Clearing FollowClientService data...');
      
      // UnifiedFollowService 캐시도 클리어
      console.log('🗑️ Clearing UnifiedFollowService cache...');
      UnifiedFollowService.clearCache(this.davidLeeId);
      
      // FollowClientService로 새 데이터 로드
      console.log('📊 Loading fresh data with FollowClientService...');
      const freshData = await FollowClientService.getBatchFollowData(this.davidLeeId, this.alexKimId);
      
      console.log('✅ Fresh UserProfile data:');
      console.log(`   Following: ${freshData.followingCount}`);
      console.log(`   Followers: ${freshData.followersCount}`);
      console.log(`   Is Following Alex: ${freshData.isFollowing}`);
      console.log(`   Success: ${freshData.success}`);
      
      if (freshData.success) {
        console.log('💡 This data should now appear in UserProfileScreen');
        console.log('💡 Try refreshing the profile page or navigating away and back');
      } else {
        console.log('❌ FollowClientService failed to load data');
        console.log('❌ Error:', freshData.error);
      }
      
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
    }
  }
}

// 싱글톤 인스턴스
const followServicesDebugger = new FollowServicesConflictDebugger();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.compareFollowServices = () => followServicesDebugger.compareServices();
  global.forceRefreshUserProfileData = () => followServicesDebugger.forceRefreshUserProfileData();
  
  console.log('🔍 Follow services conflict debugger ready!');
  console.log('💡 Commands:');
  console.log('   global.compareFollowServices() - Compare all follow services');
  console.log('   global.forceRefreshUserProfileData() - Force refresh UserProfile data');
}

export default followServicesDebugger;