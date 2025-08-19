/**
 * 긴급 데이터 복구 및 원인 파악
 */

import { supabase } from './src/services/supabase.js';
import UnifiedFollowService from './src/services/UnifiedFollowService.js';

const DAVID_LEE_ID = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
const ALEX_KIM_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d'; // 로그에서 확인된 정확한 ID

async function emergencyRestore() {
  console.log('🚨 EMERGENCY RESTORE - David Lee → Alex Kim Follow');
  console.log('====================================================');
  
  try {
    // 1. 현재 상태 재확인
    console.log('\n1. 현재 데이터베이스 상태 재확인:');
    const { data: currentFollows, error: fetchError } = await supabase
      .from('follows')
      .select('*')
      .or(`follower_id.eq.${DAVID_LEE_ID},following_id.eq.${DAVID_LEE_ID}`);
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
    } else {
      console.log('📊 David Lee 관련 모든 팔로우:', currentFollows);
    }
    
    // 2. David Lee → Alex Kim 팔로우 관계 복구
    console.log('\n2. David Lee → Alex Kim 팔로우 관계 복구:');
    const followResult = await UnifiedFollowService.followUser(DAVID_LEE_ID, ALEX_KIM_ID);
    console.log('Follow result:', followResult);
    
    if (followResult.success) {
      console.log('✅ 팔로우 관계 복구 성공!');
      
      // 3. 복구 후 상태 확인
      console.log('\n3. 복구 후 상태 확인:');
      const afterRestore = await supabase
        .from('follows')
        .select('*')
        .or(`follower_id.eq.${DAVID_LEE_ID},following_id.eq.${DAVID_LEE_ID}`);
      
      console.log('📊 복구 후 David Lee 관련 팔로우:', afterRestore.data);
    } else {
      console.error('❌ 팔로우 관계 복구 실패:', followResult.error);
    }
    
    // 4. 삭제 로그 추적 (가능하다면)
    console.log('\n4. 최근 활동 로그 확인:');
    console.log('🔍 unfollowUser 호출 추적을 위해 앱 사용 중 로그를 모니터링하세요');
    
  } catch (error) {
    console.error('❌ Emergency restore failed:', error);
  }
}

// React Native 전역에 등록
if (typeof global !== 'undefined') {
  global.emergencyRestore = emergencyRestore;
  console.log('💡 사용법: emergencyRestore()를 콘솔에서 실행하세요');
}

export { emergencyRestore };