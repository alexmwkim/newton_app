/**
 * 팔로우 카운트 디버깅 도구
 * 실제 데이터베이스 vs UI 표시 값 비교
 */

import { supabase } from '../services/supabase';
import UnifiedFollowService from '../services/UnifiedFollowService';

class FollowCountDebugger {
  constructor() {
    this.alexKimId = '10663749-9fba-4039-9f22-d6e7add9ea2d';
    this.davidLeeId = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
  }

  /**
   * 전체 팔로우 상태 진단
   */
  async diagnoseFollowCounts() {
    console.log('🔍 FOLLOW COUNT DIAGNOSIS');
    console.log('========================');
    
    await this.checkDatabaseDirectly();
    await this.checkServiceMethods();
    await this.checkSpecificRelationship();
    await this.provideSolution();
  }

  /**
   * 데이터베이스 직접 확인
   */
  async checkDatabaseDirectly() {
    console.log('📊 1. Direct Database Check');
    console.log('---------------------------');
    
    try {
      // 전체 follows 테이블 확인
      const { data: allFollows, error: allError } = await supabase
        .from('follows')
        .select('*');
      
      if (allError) {
        console.error('❌ Error fetching all follows:', allError);
        return;
      }
      
      console.log(`📈 Total follow relationships: ${allFollows.length}`);
      
      if (allFollows.length > 0) {
        console.log('   All follow relationships:');
        allFollows.forEach((follow, index) => {
          console.log(`   ${index + 1}. ${follow.follower_id} → ${follow.following_id} (${follow.created_at})`);
        });
      }
      
      // Alex Kim 관련 확인
      const alexFollowers = allFollows.filter(f => f.following_id === this.alexKimId);
      const alexFollowing = allFollows.filter(f => f.follower_id === this.alexKimId);
      
      console.log(`\n👤 Alex Kim (${this.alexKimId}):`);
      console.log(`   Followers: ${alexFollowers.length}`);
      console.log(`   Following: ${alexFollowing.length}`);
      
      if (alexFollowers.length > 0) {
        console.log('   Who follows Alex:');
        alexFollowers.forEach(f => {
          console.log(`     - ${f.follower_id}`);
        });
      }
      
      // David Lee 관련 확인
      const davidFollowers = allFollows.filter(f => f.following_id === this.davidLeeId);
      const davidFollowing = allFollows.filter(f => f.follower_id === this.davidLeeId);
      
      console.log(`\n👤 David Lee (${this.davidLeeId}):`);
      console.log(`   Followers: ${davidFollowers.length}`);
      console.log(`   Following: ${davidFollowing.length}`);
      
      if (davidFollowing.length > 0) {
        console.log('   David follows:');
        davidFollowing.forEach(f => {
          console.log(`     - ${f.following_id}`);
        });
      }
      
      // David → Alex 관계 확인
      const davidFollowsAlex = allFollows.find(f => 
        f.follower_id === this.davidLeeId && f.following_id === this.alexKimId
      );
      
      console.log(`\n🔗 David → Alex relationship: ${davidFollowsAlex ? 'EXISTS' : 'NOT FOUND'}`);
      if (davidFollowsAlex) {
        console.log(`   Created: ${davidFollowsAlex.created_at}`);
      }
      
    } catch (error) {
      console.error('❌ Database check failed:', error);
    }
  }

  /**
   * 서비스 메소드 확인
   */
  async checkServiceMethods() {
    console.log('\n🛠️ 2. Service Methods Check');
    console.log('----------------------------');
    
    try {
      // Alex Kim의 팔로워 수 확인
      console.log('📊 Checking Alex Kim followers count...');
      const alexFollowersResult = await UnifiedFollowService.getFollowersCount(this.alexKimId);
      console.log('   Service result:', alexFollowersResult);
      
      // Alex Kim의 팔로잉 수 확인
      console.log('📊 Checking Alex Kim following count...');
      const alexFollowingResult = await UnifiedFollowService.getFollowingCount(this.alexKimId);
      console.log('   Service result:', alexFollowingResult);
      
      // David → Alex 팔로우 상태 확인
      console.log('🔗 Checking David → Alex follow status...');
      const isFollowingResult = await UnifiedFollowService.isFollowing(this.davidLeeId, this.alexKimId);
      console.log('   Service result:', isFollowingResult);
      
      // 캐시 상태 확인
      console.log('💾 Checking cache status...');
      const cacheStats = UnifiedFollowService.getCacheStats();
      console.log('   Cache stats:', cacheStats);
      
    } catch (error) {
      console.error('❌ Service methods check failed:', error);
    }
  }

  /**
   * 특정 관계 상세 확인
   */
  async checkSpecificRelationship() {
    console.log('\n🔍 3. Specific Relationship Check');
    console.log('----------------------------------');
    
    try {
      // David → Alex 관계를 여러 방법으로 확인
      
      // 방법 1: 직접 쿼리
      const { data: directQuery, error: directError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', this.davidLeeId)
        .eq('following_id', this.alexKimId);
      
      console.log('🔍 Method 1 - Direct query:');
      console.log(`   Result: ${directQuery?.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
      if (directQuery?.length > 0) {
        console.log('   Data:', directQuery[0]);
      }
      if (directError) {
        console.log('   Error:', directError);
      }
      
      // 방법 2: Alex의 팔로워 목록에서 David 찾기
      const { data: alexFollowers, error: followersError } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', this.alexKimId);
      
      console.log('\n🔍 Method 2 - Alex followers list:');
      if (followersError) {
        console.log('   Error:', followersError);
      } else {
        console.log(`   Total followers: ${alexFollowers.length}`);
        const davidInList = alexFollowers.find(f => f.follower_id === this.davidLeeId);
        console.log(`   David in list: ${davidInList ? 'YES' : 'NO'}`);
        if (davidInList) {
          console.log('   David follow data:', davidInList);
        }
      }
      
      // 방법 3: David의 팔로잉 목록에서 Alex 찾기
      const { data: davidFollowing, error: followingError } = await supabase
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', this.davidLeeId);
      
      console.log('\n🔍 Method 3 - David following list:');
      if (followingError) {
        console.log('   Error:', followingError);
      } else {
        console.log(`   Total following: ${davidFollowing.length}`);
        const alexInList = davidFollowing.find(f => f.following_id === this.alexKimId);
        console.log(`   Alex in list: ${alexInList ? 'YES' : 'NO'}`);
        if (alexInList) {
          console.log('   Alex follow data:', alexInList);
        }
      }
      
    } catch (error) {
      console.error('❌ Specific relationship check failed:', error);
    }
  }

  /**
   * 해결책 제시
   */
  async provideSolution() {
    console.log('\n💡 4. Solution & Cache Management');
    console.log('----------------------------------');
    
    try {
      // 캐시 클리어
      console.log('🗑️ Clearing all caches...');
      UnifiedFollowService.clearAllCache();
      
      // 강제 새로고침
      console.log('🔄 Force refreshing counts...');
      
      const freshAlexFollowers = await UnifiedFollowService.getFollowersCount(this.alexKimId);
      const freshAlexFollowing = await UnifiedFollowService.getFollowingCount(this.alexKimId);
      
      console.log('📊 Fresh counts for Alex Kim:');
      console.log(`   Followers: ${freshAlexFollowers.success ? freshAlexFollowers.count : 'ERROR'}`);
      console.log(`   Following: ${freshAlexFollowing.success ? freshAlexFollowing.count : 'ERROR'}`);
      
      // UI 새로고침 함수 호출 (if available)
      if (typeof global !== 'undefined' && global.forceRefreshFollowCounts) {
        console.log('🔄 Triggering UI refresh...');
        global.forceRefreshFollowCounts();
      }
      
    } catch (error) {
      console.error('❌ Solution application failed:', error);
    }
  }

  /**
   * 빠른 카운트 확인
   */
  async quickCountCheck() {
    console.log('⚡ QUICK COUNT CHECK');
    console.log('===================');
    
    try {
      // 직접 카운트
      const { count: alexFollowersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', this.alexKimId);
      
      const { count: alexFollowingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', this.alexKimId);
      
      console.log('📊 Direct database counts:');
      console.log(`   Alex followers: ${followersError ? 'ERROR' : alexFollowersCount}`);
      console.log(`   Alex following: ${followingError ? 'ERROR' : alexFollowingCount}`);
      
      // 서비스 메소드 카운트
      const serviceFollowers = await UnifiedFollowService.getFollowersCount(this.alexKimId);
      const serviceFollowing = await UnifiedFollowService.getFollowingCount(this.alexKimId);
      
      console.log('🛠️ Service method counts:');
      console.log(`   Alex followers: ${serviceFollowers.success ? serviceFollowers.count : 'ERROR'}`);
      console.log(`   Alex following: ${serviceFollowing.success ? serviceFollowing.count : 'ERROR'}`);
      
      // 불일치 검사
      const followersMatch = alexFollowersCount === (serviceFollowers.success ? serviceFollowers.count : -1);
      const followingMatch = alexFollowingCount === (serviceFollowing.success ? serviceFollowing.count : -1);
      
      console.log('\n🔍 Consistency check:');
      console.log(`   Followers match: ${followersMatch ? '✅' : '❌'}`);
      console.log(`   Following match: ${followingMatch ? '✅' : '❌'}`);
      
      if (!followersMatch || !followingMatch) {
        console.log('⚠️ INCONSISTENCY DETECTED! UI may be showing cached/old data.');
        console.log('💡 Try refreshing the profile screen or clearing app cache.');
      }
      
    } catch (error) {
      console.error('❌ Quick check failed:', error);
    }
  }
}

// 싱글톤 인스턴스
const followCountDebugger = new FollowCountDebugger();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.diagnoseFollowCounts = () => followCountDebugger.diagnoseFollowCounts();
  global.quickCountCheck = () => followCountDebugger.quickCountCheck();
  global.fixFollowCounts = async () => {
    console.log('🔧 FIXING FOLLOW COUNTS...');
    UnifiedFollowService.clearAllCache();
    await followCountDebugger.quickCountCheck();
    console.log('💡 Try refreshing the profile page now');
  };
  
  console.log('🔍 Follow count debugger ready!');
  console.log('💡 Commands:');
  console.log('   global.diagnoseFollowCounts() - Full diagnosis');
  console.log('   global.quickCountCheck() - Quick count check');
}

export default followCountDebugger;