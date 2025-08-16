/**
 * 전체 시스템 통합 테스트
 * 노티피케이션 시스템, 팔로우 시스템, UI 반응성 등을 종합적으로 테스트
 */

import { supabase } from '../services/supabase';
import notificationService from '../services/notifications';
import UnifiedFollowService from '../services/UnifiedFollowService';

const ALEX_USER_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';
const DAVID_USER_ID = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';

/**
 * 전체 시스템 상태 점검
 */
export const systemHealthCheck = async () => {
  console.log('🏥 SYSTEM HEALTH CHECK');
  console.log('=====================');
  
  const results = {
    database: false,
    notifications: false,
    followSystem: false,
    cache: false,
    ui: false
  };
  
  try {
    // 1. 데이터베이스 연결 테스트
    console.log('📊 1. Database Connection Test...');
    const { data: profiles, error: dbError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .limit(1);
    
    if (!dbError && profiles) {
      console.log('✅ Database connection: OK');
      results.database = true;
    } else {
      console.log('❌ Database connection: FAILED', dbError?.message);
    }
    
    // 2. 노티피케이션 시스템 테스트
    console.log('🔔 2. Notification System Test...');
    try {
      const initResult = await notificationService.initialize(ALEX_USER_ID);
      if (initResult.success) {
        console.log('✅ Notification system: OK');
        results.notifications = true;
      } else {
        console.log('❌ Notification system: FAILED', initResult.error);
      }
    } catch (notifError) {
      console.log('❌ Notification system: EXCEPTION', notifError.message);
    }
    
    // 3. 팔로우 시스템 테스트
    console.log('👥 3. Follow System Test...');
    try {
      const followersResult = await UnifiedFollowService.getFollowersCount(ALEX_USER_ID);
      const followingResult = await UnifiedFollowService.getFollowingCount(ALEX_USER_ID);
      
      if (followersResult.success && followingResult.success) {
        console.log('✅ Follow system: OK');
        console.log(`   Alex Kim: ${followersResult.count} followers, ${followingResult.count} following`);
        results.followSystem = true;
      } else {
        console.log('❌ Follow system: FAILED', followersResult.error || followingResult.error);
      }
    } catch (followError) {
      console.log('❌ Follow system: EXCEPTION', followError.message);
    }
    
    // 4. 캐시 시스템 테스트
    console.log('💾 4. Cache System Test...');
    try {
      // UnifiedFollowService 내부 캐시 테스트
      const cacheStats = UnifiedFollowService.getCacheStats();
      if (cacheStats) {
        console.log('✅ Cache system: OK');
        console.log(`   Cache stats: ${cacheStats.size}/${cacheStats.maxSize} entries`);
        results.cache = true;
      } else {
        console.log('⚠️ Cache system: No stats available');
      }
    } catch (cacheError) {
      console.log('❌ Cache system: EXCEPTION', cacheError.message);
    }
    
    // 5. UI 컴포넌트 상태 체크 (글로벌 함수 확인)
    console.log('🎨 5. UI System Test...');
    if (typeof global !== 'undefined') {
      if (global.forceRefreshFollowCounts && global.debugFollowState) {
        console.log('✅ UI debug functions: OK');
        results.ui = true;
      } else {
        console.log('⚠️ UI debug functions: Not available (ProfileScreen not loaded)');
      }
    }
    
    // 전체 결과 요약
    console.log('\n📋 HEALTH CHECK SUMMARY');
    console.log('=======================');
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    Object.entries(results).forEach(([system, status]) => {
      const icon = status ? '✅' : '❌';
      console.log(`${icon} ${system.toUpperCase()}: ${status ? 'HEALTHY' : 'NEEDS ATTENTION'}`);
    });
    
    console.log(`\n🎯 Overall Health: ${passedTests}/${totalTests} systems healthy`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL SYSTEMS OPERATIONAL!');
    } else {
      console.log('⚠️ Some systems need attention');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ System health check failed:', error);
    return results;
  }
};

/**
 * 성능 테스트 - 팔로우/언팔로우 반응 속도 측정
 */
export const performanceTest = async () => {
  console.log('\n⚡ PERFORMANCE TEST');
  console.log('==================');
  
  const measurements = {
    followAction: 0,
    unfollowAction: 0,
    cacheAccess: 0,
    dataLoad: 0
  };
  
  try {
    // 1. 팔로우 액션 성능 측정
    console.log('📊 1. Follow Action Performance...');
    const followStart = performance.now();
    
    const followResult = await UnifiedFollowService.followUser(DAVID_USER_ID, ALEX_USER_ID);
    
    const followEnd = performance.now();
    measurements.followAction = followEnd - followStart;
    
    console.log(`✅ Follow action: ${measurements.followAction.toFixed(2)}ms`);
    
    // 2. 언팔로우 액션 성능 측정
    console.log('📊 2. Unfollow Action Performance...');
    const unfollowStart = performance.now();
    
    const unfollowResult = await UnifiedFollowService.unfollowUser(DAVID_USER_ID, ALEX_USER_ID);
    
    const unfollowEnd = performance.now();
    measurements.unfollowAction = unfollowEnd - unfollowStart;
    
    console.log(`✅ Unfollow action: ${measurements.unfollowAction.toFixed(2)}ms`);
    
    // 3. 캐시 접근 성능 측정
    console.log('📊 3. Cache Access Performance...');
    const cacheStart = performance.now();
    
    // 여러 번 캐시 접근
    for (let i = 0; i < 10; i++) {
      await UnifiedFollowService.getFollowersCount(ALEX_USER_ID);
    }
    
    const cacheEnd = performance.now();
    measurements.cacheAccess = (cacheEnd - cacheStart) / 10;
    
    console.log(`✅ Average cache access: ${measurements.cacheAccess.toFixed(2)}ms`);
    
    // 4. 데이터 로딩 성능 측정
    console.log('📊 4. Data Loading Performance...');
    const dataStart = performance.now();
    
    // 캐시 클리어 후 데이터 로드
    UnifiedFollowService.clearAllCache();
    const dataResult = await UnifiedFollowService.getFollowersCount(ALEX_USER_ID);
    
    const dataEnd = performance.now();
    measurements.dataLoad = dataEnd - dataStart;
    
    console.log(`✅ Fresh data load: ${measurements.dataLoad.toFixed(2)}ms`);
    
    // 성능 요약
    console.log('\n⚡ PERFORMANCE SUMMARY');
    console.log('=====================');
    
    Object.entries(measurements).forEach(([action, time]) => {
      const status = time < 100 ? '🚀' : time < 500 ? '⚡' : time < 1000 ? '⚠️' : '🐌';
      console.log(`${status} ${action}: ${time.toFixed(2)}ms`);
    });
    
    const averageTime = Object.values(measurements).reduce((a, b) => a + b, 0) / Object.values(measurements).length;
    console.log(`\n📊 Average response time: ${averageTime.toFixed(2)}ms`);
    
    if (averageTime < 200) {
      console.log('🎉 EXCELLENT PERFORMANCE!');
    } else if (averageTime < 500) {
      console.log('✅ Good performance');
    } else {
      console.log('⚠️ Performance could be improved');
    }
    
    return measurements;
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return measurements;
  }
};

/**
 * 전체 통합 테스트 실행
 */
export const runFullIntegrationTest = async () => {
  console.log('🧪 NEWTON APP INTEGRATION TEST');
  console.log('==============================');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');
  
  try {
    // 1. 시스템 상태 확인
    const healthResults = await systemHealthCheck();
    
    // 2. 성능 테스트
    const performanceResults = await performanceTest();
    
    // 3. 최종 결과
    console.log('\n🏁 INTEGRATION TEST COMPLETE');
    console.log('============================');
    
    const healthySystemsCount = Object.values(healthResults).filter(Boolean).length;
    const totalSystems = Object.keys(healthResults).length;
    
    console.log(`🏥 Health: ${healthySystemsCount}/${totalSystems} systems healthy`);
    
    const avgPerformance = Object.values(performanceResults).reduce((a, b) => a + b, 0) / Object.values(performanceResults).length;
    console.log(`⚡ Performance: ${avgPerformance.toFixed(2)}ms average`);
    
    const overallScore = (healthySystemsCount / totalSystems) * 100;
    console.log(`🎯 Overall Score: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 90) {
      console.log('🎉 SYSTEM STATUS: EXCELLENT!');
    } else if (overallScore >= 70) {
      console.log('✅ SYSTEM STATUS: Good');
    } else {
      console.log('⚠️ SYSTEM STATUS: Needs improvement');
    }
    
    return {
      health: healthResults,
      performance: performanceResults,
      score: overallScore
    };
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return null;
  }
};

// 글로벌 함수로 등록 (개발 모드에서 콘솔로 실행 가능)
if (__DEV__ && typeof global !== 'undefined') {
  global.runSystemHealthCheck = systemHealthCheck;
  global.runPerformanceTest = performanceTest;
  global.runFullIntegrationTest = runFullIntegrationTest;
}

export default {
  systemHealthCheck,
  performanceTest,
  runFullIntegrationTest
};