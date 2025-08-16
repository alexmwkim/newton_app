/**
 * 커밋 당시 작동했던 패턴으로 복원
 * 복잡한 시스템을 단순하고 안정적인 구조로 되돌림
 */

import followCacheStore from '../store/FollowCacheStore';

class WorkingPatternRestorer {
  constructor() {
    this.davidLeeId = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
    this.alexKimId = '10663749-9fba-4039-9f22-d6e7add9ea2d';
  }

  /**
   * 커밋 당시의 성공적인 패턴으로 복원
   */
  async revertToWorkingPattern() {
    console.log('🔄 REVERTING TO WORKING PATTERN');
    console.log('===============================');
    console.log('Based on commit b57608d analysis');
    
    try {
      // 1. 모든 복잡한 캐시 시스템 클리어
      console.log('🗑️ Step 1: Clearing complex cache systems...');
      
      // UnifiedFollowService 캐시 클리어 (이것이 문제를 일으키고 있음)
      if (typeof global !== 'undefined' && global.clearUnifiedFollowCache) {
        global.clearUnifiedFollowCache();
      }
      
      // FollowCacheStore만 남기고 클리어
      followCacheStore.clearAll();
      console.log('✅ Cleared all caches');

      // 2. 커밋 당시 방식으로 FollowClientService 직접 호출
      console.log('📊 Step 2: Loading data using commit-time pattern...');
      
      // require().default 방식으로 서비스 로드 (커밋 당시 방식)
      const FollowClientService = require('../services/followClient').default;
      
      // David Lee 데이터 로드
      const davidResult = await FollowClientService.getBatchFollowData(this.davidLeeId, this.alexKimId);
      console.log('📊 David Lee data from FollowClientService:', davidResult);
      
      if (davidResult.success) {
        // 3. 커밋 당시 방식으로 캐시에 저장
        console.log('💾 Step 3: Caching data in commit-time pattern...');
        
        const cacheData = {
          followersCount: davidResult.followersCount || 0,
          followingCount: davidResult.followingCount || 0,
          isFollowing: davidResult.isFollowing || false
        };
        
        // FollowCacheStore에만 저장 (단순하게)
        followCacheStore.setCache(this.davidLeeId, cacheData);
        
        console.log(`✅ Cached David Lee data: Following=${cacheData.followingCount}, Followers=${cacheData.followersCount}`);
        
        // 4. Alex Kim 데이터도 동일하게 처리
        const alexResult = await FollowClientService.getBatchFollowData(this.alexKimId, this.davidLeeId);
        if (alexResult.success) {
          const alexCacheData = {
            followersCount: alexResult.followersCount || 0,
            followingCount: alexResult.followingCount || 0,
            isFollowing: alexResult.isFollowing || false
          };
          followCacheStore.setCache(this.alexKimId, alexCacheData);
          console.log(`✅ Cached Alex Kim data: Following=${alexCacheData.followingCount}, Followers=${alexCacheData.followersCount}`);
        }
        
        // 5. 검증 - 캐시에서 데이터 확인
        console.log('\n✅ Step 4: Verification...');
        const davidCached = followCacheStore.getFromCache(this.davidLeeId);
        const alexCached = followCacheStore.getFromCache(this.alexKimId);
        
        console.log('📋 Current cached states:');
        console.log(`   David Lee: ${JSON.stringify(davidCached)}`);
        console.log(`   Alex Kim: ${JSON.stringify(alexCached)}`);
        
        // 6. 성공 메시지
        console.log('\n🎉 SUCCESS: Reverted to working pattern!');
        console.log('💡 This follows the exact pattern from commit b57608d');
        console.log('💡 ProfileScreen should now show correct data');
        console.log('💡 Try refreshing the profile page');
        
        return {
          success: true,
          pattern: 'commit_b57608d',
          davidData: davidCached,
          alexData: alexCached
        };
        
      } else {
        console.error('❌ FollowClientService failed:', davidResult.error);
        return { success: false, error: davidResult.error };
      }
      
    } catch (error) {
      console.error('❌ Pattern revert failed:', error);
      return { success: false, error };
    }
  }

  /**
   * 커밋 당시 방식으로 특정 사용자 데이터 새로고침
   */
  async refreshUserDataCommitStyle(userId) {
    console.log(`🔄 REFRESHING USER DATA (COMMIT STYLE): ${userId}`);
    console.log('====================================================');
    
    try {
      // 커밋 당시 방식: require().default
      const FollowClientService = require('../services/followClient').default;
      
      // 해당 사용자 캐시 클리어
      followCacheStore.invalidateUser(userId);
      
      // 새 데이터 로드
      const otherUserId = userId === this.davidLeeId ? this.alexKimId : this.davidLeeId;
      const result = await FollowClientService.getBatchFollowData(userId, otherUserId);
      
      if (result.success) {
        // 캐시에 저장
        const cacheData = {
          followersCount: result.followersCount || 0,
          followingCount: result.followingCount || 0,
          isFollowing: result.isFollowing || false
        };
        
        followCacheStore.setCache(userId, cacheData);
        
        console.log(`✅ Refreshed ${userId}:`);
        console.log(`   Following: ${cacheData.followingCount}`);
        console.log(`   Followers: ${cacheData.followersCount}`);
        console.log(`   Is Following: ${cacheData.isFollowing}`);
        
        return cacheData;
      } else {
        console.error('❌ Refresh failed:', result.error);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Refresh exception:', error);
      return null;
    }
  }

  /**
   * 커밋 당시 패턴 검증
   */
  async validateCommitPattern() {
    console.log('🔍 VALIDATING COMMIT PATTERN');
    console.log('============================');
    
    try {
      // 1. FollowClientService가 제대로 로드되는지 확인
      const FollowClientService = require('../services/followClient').default;
      console.log('✅ FollowClientService loaded successfully');
      
      // 2. getBatchFollowData 메서드 존재 확인
      if (typeof FollowClientService.getBatchFollowData === 'function') {
        console.log('✅ getBatchFollowData method exists');
      } else {
        console.error('❌ getBatchFollowData method missing');
        return false;
      }
      
      // 3. FollowCacheStore 상태 확인
      console.log('📊 FollowCacheStore cache size:', followCacheStore.cache?.size || 0);
      
      // 4. 테스트 호출
      console.log('🧪 Testing getBatchFollowData...');
      const testResult = await FollowClientService.getBatchFollowData(this.davidLeeId, this.alexKimId);
      console.log('📊 Test result:', testResult);
      
      if (testResult.success) {
        console.log('✅ Commit pattern validation PASSED');
        return true;
      } else {
        console.error('❌ Commit pattern validation FAILED');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
const workingPatternRestorer = new WorkingPatternRestorer();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.revertToWorkingPattern = () => workingPatternRestorer.revertToWorkingPattern();
  global.refreshUserDataCommitStyle = (userId) => workingPatternRestorer.refreshUserDataCommitStyle(userId || 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22');
  global.validateCommitPattern = () => workingPatternRestorer.validateCommitPattern();
  
  console.log('🔄 Working pattern restorer ready!');
  console.log('💡 Commands:');
  console.log('   global.revertToWorkingPattern() - Revert to commit b57608d pattern');
  console.log('   global.refreshUserDataCommitStyle(userId) - Refresh using commit pattern');
  console.log('   global.validateCommitPattern() - Validate commit pattern works');
}

export default workingPatternRestorer;