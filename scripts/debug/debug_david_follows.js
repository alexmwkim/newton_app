/**
 * David Lee 팔로우 데이터 긴급 디버깅
 */

import UnifiedFollowService from './src/services/UnifiedFollowService.js';

const DAVID_LEE_ID = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
const ALEX_KIM_ID = '10663749-9fba-4039-9f22-d6e7a7b8e8ad'; // 추정

async function debugDavidFollows() {
  console.log('🔍 DEBUGGING DAVID LEE FOLLOWS DATA');
  console.log('=====================================');
  
  try {
    // 1. David Lee가 팔로우하는 사람들 확인
    console.log('\n1. David Lee가 팔로우하는 사람들:');
    const following = await UnifiedFollowService.getFollowing(DAVID_LEE_ID);
    console.log('Following result:', following);
    
    // 2. David Lee를 팔로우하는 사람들 확인
    console.log('\n2. David Lee를 팔로우하는 사람들:');
    const followers = await UnifiedFollowService.getFollowers(DAVID_LEE_ID);
    console.log('Followers result:', followers);
    
    // 3. David Lee → Alex Kim 팔로우 상태 확인
    console.log('\n3. David Lee → Alex Kim 팔로우 상태:');
    const isFollowingAlex = await UnifiedFollowService.isFollowing(DAVID_LEE_ID, ALEX_KIM_ID);
    console.log('Is following Alex:', isFollowingAlex);
    
    // 4. Alex Kim → David Lee 팔로우 상태 확인
    console.log('\n4. Alex Kim → David Lee 팔로우 상태:');
    const alexFollowsDavid = await UnifiedFollowService.isFollowing(ALEX_KIM_ID, DAVID_LEE_ID);
    console.log('Alex follows David:', alexFollowsDavid);
    
    // 5. 캐시 상태 확인
    console.log('\n5. 캐시 상태:');
    const cacheStats = UnifiedFollowService.getCacheStats();
    console.log('Cache stats:', cacheStats);
    
    // 6. 디버그 함수 사용
    console.log('\n6. David Lee 전체 팔로우 상태:');
    const debugResult = await UnifiedFollowService.debugUserFollowStatus(DAVID_LEE_ID);
    console.log('Debug result:', debugResult);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Node.js 환경에서 실행
if (typeof module !== 'undefined') {
  debugDavidFollows();
}

// React Native 환경에서 실행
if (typeof global !== 'undefined') {
  global.debugDavidFollows = debugDavidFollows;
}

export { debugDavidFollows };