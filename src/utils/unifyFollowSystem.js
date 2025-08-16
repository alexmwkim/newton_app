/**
 * 팔로우 시스템 통합 및 동기화
 * 모든 팔로우 서비스와 캐시를 통합하여 데이터 일관성 보장
 */

import UnifiedFollowService from '../services/UnifiedFollowService';
import FollowClientService from '../services/followClient';
import followCacheStore from '../store/FollowCacheStore';
import { supabase } from '../services/supabase';

class FollowSystemUnifier {
  constructor() {
    this.davidLeeId = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
    this.alexKimId = '10663749-9fba-4039-9f22-d6e7add9ea2d';
  }

  /**
   * 전체 팔로우 시스템 동기화 및 통합
   */
  async unifyFollowSystem() {
    console.log('🔧 UNIFYING FOLLOW SYSTEM');
    console.log('=========================');
    
    try {
      // 1. 모든 캐시 클리어
      console.log('🗑️ Step 1: Clearing all caches...');
      UnifiedFollowService.clearAllCache();
      followCacheStore.clearAll();
      
      // 2. 데이터베이스에서 실제 상태 확인
      console.log('📊 Step 2: Checking database truth...');
      const { data: allFollows, error } = await supabase
        .from('follows')
        .select('follower_id, following_id, created_at');
        
      if (error) {
        console.error('❌ Database query failed:', error);
        return;
      }
      
      console.log(`📈 Database truth: ${allFollows?.length || 0} follow relationships`);
      allFollows?.forEach(follow => {
        console.log(`   ${follow.follower_id} → ${follow.following_id}`);
      });
      
      // 3. David Lee 데이터 정확히 계산
      const davidFollowing = allFollows?.filter(f => f.follower_id === this.davidLeeId) || [];
      const davidFollowers = allFollows?.filter(f => f.following_id === this.davidLeeId) || [];
      const davidFollowsAlex = davidFollowing.some(f => f.following_id === this.alexKimId);
      
      console.log('\n👤 David Lee Database Truth:');
      console.log(`   Following: ${davidFollowing.length} users`);
      console.log(`   Followers: ${davidFollowers.length} users`);
      console.log(`   Follows Alex: ${davidFollowsAlex ? 'YES' : 'NO'}`);
      
      // 4. Alex Kim 데이터 정확히 계산
      const alexFollowing = allFollows?.filter(f => f.follower_id === this.alexKimId) || [];
      const alexFollowers = allFollows?.filter(f => f.following_id === this.alexKimId) || [];
      
      console.log('\n👤 Alex Kim Database Truth:');
      console.log(`   Following: ${alexFollowing.length} users`);
      console.log(`   Followers: ${alexFollowers.length} users`);
      
      // 5. UnifiedFollowService에 정확한 데이터 캐싱
      console.log('\n🔄 Step 3: Syncing UnifiedFollowService...');
      
      // 강제로 정확한 데이터 설정
      const davidCorrectData = {
        followingCount: davidFollowing.length,
        followersCount: davidFollowers.length,
        isFollowing: false // David 자신의 프로필이므로
      };
      
      const alexCorrectData = {
        followingCount: alexFollowing.length,
        followersCount: alexFollowers.length,
        isFollowing: davidFollowsAlex // David가 Alex를 팔로우하는지
      };
      
      // UnifiedFollowService 캐시에 직접 설정
      UnifiedFollowService.setCache(this.davidLeeId, davidCorrectData);
      UnifiedFollowService.setCache(this.alexKimId, alexCorrectData);
      
      console.log(`✅ David Lee cache set: Following=${davidCorrectData.followingCount}, Followers=${davidCorrectData.followersCount}`);
      console.log(`✅ Alex Kim cache set: Following=${alexCorrectData.followingCount}, Followers=${alexCorrectData.followersCount}`);
      
      // 6. FollowCacheStore에도 동일한 데이터 설정
      console.log('\n🔄 Step 4: Syncing FollowCacheStore...');
      followCacheStore.setCache(this.davidLeeId, davidCorrectData);
      followCacheStore.setCache(this.alexKimId, alexCorrectData);
      
      // 7. FollowClientService로 검증
      console.log('\n✅ Step 5: Validating with FollowClientService...');
      const clientValidation = await FollowClientService.getBatchFollowData(this.davidLeeId, this.alexKimId);
      
      console.log('📊 FollowClientService validation:');
      console.log(`   David Following: ${clientValidation.followingCount}`);
      console.log(`   David Followers: ${clientValidation.followersCount}`);
      console.log(`   David follows Alex: ${clientValidation.isFollowing}`);
      
      // 8. 최종 상태 확인
      console.log('\n📋 FINAL UNIFIED STATE');
      console.log('======================');
      console.log(`🎯 David Lee:`);
      console.log(`   Database: Following=${davidFollowing.length}, Followers=${davidFollowers.length}`);
      console.log(`   UnifiedService: Following=${davidCorrectData.followingCount}, Followers=${davidCorrectData.followersCount}`);
      console.log(`   ClientService: Following=${clientValidation.followingCount}, Followers=${clientValidation.followersCount}`);
      console.log(`   Follows Alex: Database=${davidFollowsAlex}, Client=${clientValidation.isFollowing}`);
      
      // 9. 불일치 체크
      const isConsistent = (
        davidFollowing.length === davidCorrectData.followingCount &&
        davidFollowing.length === clientValidation.followingCount &&
        davidFollowers.length === davidCorrectData.followersCount &&
        davidFollowers.length === clientValidation.followersCount &&
        davidFollowsAlex === clientValidation.isFollowing
      );
      
      if (isConsistent) {
        console.log('\n🎉 SUCCESS: All systems are now consistent!');
        console.log('💡 Profile page should now show correct counts');
        console.log('💡 Try refreshing the profile page or navigating away and back');
      } else {
        console.log('\n⚠️ WARNING: Some inconsistencies remain');
        console.log('💡 Check individual service implementations');
      }
      
      return {
        success: true,
        davidData: davidCorrectData,
        alexData: alexCorrectData,
        isConsistent
      };
      
    } catch (error) {
      console.error('❌ Unification failed:', error);
      return { success: false, error };
    }
  }

  /**
   * ProfileScreen 전용 강제 새로고침
   */
  async forceRefreshProfileScreen() {
    console.log('🔄 FORCE REFRESH PROFILE SCREEN');
    console.log('================================');
    
    try {
      // ProfileScreen이 사용하는 모든 데이터 소스 새로고침
      
      // 1. FollowCacheStore 클리어
      followCacheStore.clearCache(this.davidLeeId);
      console.log('✅ Cleared FollowCacheStore for David Lee');
      
      // 2. FollowClientService로 새 데이터 로드
      const freshData = await FollowClientService.getBatchFollowData(this.davidLeeId, this.alexKimId);
      console.log('📊 Fresh FollowClientService data:', freshData);
      
      // 3. FollowCacheStore에 새 데이터 설정
      if (freshData.success) {
        followCacheStore.setCache(this.davidLeeId, {
          followersCount: freshData.followersCount,
          followingCount: freshData.followingCount,
          isFollowing: freshData.isFollowing
        });
        console.log('✅ Updated FollowCacheStore with fresh data');
      }
      
      // 4. ProfileScreen 상태 강제 업데이트 (글로벌 이벤트 발생)
      if (typeof global !== 'undefined') {
        // ProfileScreen이 리스닝할 수 있는 글로벌 이벤트 발생
        global.followDataUpdated = {
          userId: this.davidLeeId,
          data: freshData,
          timestamp: Date.now()
        };
        console.log('📡 Broadcasted follow data update event');
      }
      
      console.log('\n💡 ProfileScreen should now reflect updated data');
      console.log('💡 If not, the issue may be in ProfileScreen\'s data loading logic');
      
    } catch (error) {
      console.error('❌ Profile refresh failed:', error);
    }
  }

  /**
   * 캐시 상태 진단
   */
  async diagnoseCacheState() {
    console.log('🔍 CACHE STATE DIAGNOSIS');
    console.log('========================');
    
    try {
      // UnifiedFollowService 캐시
      const unifiedCache = UnifiedFollowService.getCacheStats();
      console.log('📊 UnifiedFollowService cache:', unifiedCache);
      
      // FollowCacheStore
      const followCacheData = followCacheStore.getFromCache(this.davidLeeId);
      console.log('📊 FollowCacheStore data:', followCacheData);
      
      // FollowClientService 테스트
      const clientData = await FollowClientService.getBatchFollowData(this.davidLeeId, this.alexKimId);
      console.log('📊 FollowClientService live data:', clientData);
      
      console.log('\n💡 Compare these values to identify cache inconsistencies');
      
    } catch (error) {
      console.error('❌ Cache diagnosis failed:', error);
    }
  }
}

// 싱글톤 인스턴스
const followSystemUnifier = new FollowSystemUnifier();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.unifyFollowSystem = () => followSystemUnifier.unifyFollowSystem();
  global.forceRefreshProfileScreen = () => followSystemUnifier.forceRefreshProfileScreen();
  global.diagnoseCacheState = () => followSystemUnifier.diagnoseCacheState();
  
  console.log('🔧 Follow system unifier ready!');
  console.log('💡 Commands:');
  console.log('   global.unifyFollowSystem() - Unify all follow systems');
  console.log('   global.forceRefreshProfileScreen() - Force refresh ProfileScreen');
  console.log('   global.diagnoseCacheState() - Diagnose cache inconsistencies');
}

export default followSystemUnifier;