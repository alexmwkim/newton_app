/**
 * SQL 수정 후 종합 테스트
 */

import notificationService from '../services/notifications';
import UnifiedFollowService from '../services/UnifiedFollowService';

const testAfterSQLFix = async () => {
  console.log('🧪 COMPREHENSIVE TEST AFTER SQL FIX');
  console.log('===================================');
  
  try {
    // 1. 캐시 클리어
    console.log('🗑️ Clearing all caches...');
    UnifiedFollowService.clearAllCache();
    
    // 2. 팔로우 관계 확인
    console.log('\n📊 Checking follow relationships...');
    const davidFollowsAlex = await UnifiedFollowService.isFollowing(
      'e7cc75eb-9ed4-42b9-95d6-88ff615aac22', // David Lee
      '10663749-9fba-4039-9f22-d6e7add9ea2d'  // Alex Kim
    );
    console.log(`🔗 David follows Alex: ${davidFollowsAlex.isFollowing ? 'YES' : 'NO'}`);
    
    // 3. 카운트 확인
    const davidFollowing = await UnifiedFollowService.getFollowingCount('e7cc75eb-9ed4-42b9-95d6-88ff615aac22');
    const alexFollowers = await UnifiedFollowService.getFollowersCount('10663749-9fba-4039-9f22-d6e7add9ea2d');
    
    console.log('📊 Follow counts:');
    console.log(`   David Lee following: ${davidFollowing.count}`);
    console.log(`   Alex Kim followers: ${alexFollowers.count}`);
    
    // 4. 노티피케이션 생성 테스트
    console.log('\n🔔 Testing notification creation...');
    const notifResult = await notificationService.createFollowNotification(
      'e7cc75eb-9ed4-42b9-95d6-88ff615aac22', // David Lee
      '10663749-9fba-4039-9f22-d6e7add9ea2d'  // Alex Kim
    );
    
    if (notifResult.success) {
      console.log('✅ SUCCESS! Notification created successfully');
      console.log('   ID:', notifResult.data?.id);
      console.log('   Type:', notifResult.data?.type);
      console.log('   Message:', notifResult.data?.message);
      
      // 5. 노티피케이션 목록 확인
      console.log('\n📬 Checking notifications for Alex Kim...');
      const notifications = await notificationService.getUserNotifications(
        '10663749-9fba-4039-9f22-d6e7add9ea2d', 5, 0
      );
      
      if (notifications.success) {
        console.log(`📨 Found ${notifications.data.length} notifications:`);
        notifications.data.forEach((notif, i) => {
          const time = new Date(notif.created_at).toLocaleTimeString();
          console.log(`   ${i+1}. ${notif.type}: "${notif.message}" (${time})`);
        });
        
        // 최근 팔로우 노티피케이션 찾기
        const recentFollow = notifications.data.find(n => 
          n.type === 'follow' && 
          n.sender_id === 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22' &&
          Date.now() - new Date(n.created_at).getTime() < 300000 // 5분 이내
        );
        
        if (recentFollow) {
          console.log('🎉 FOUND RECENT FOLLOW NOTIFICATION!');
          console.log('   From David Lee to Alex Kim');
          console.log('   Created:', recentFollow.created_at);
        }
      } else {
        console.log('❌ Failed to fetch notifications:', notifications.error);
      }
      
    } else {
      console.log('❌ NOTIFICATION FAILED:', notifResult.error);
    }
    
    // 6. 전체 상태 요약
    console.log('\n📋 FINAL STATUS SUMMARY:');
    console.log('========================');
    console.log(`✅ David → Alex follow: ${davidFollowsAlex.isFollowing ? 'EXISTS' : 'MISSING'}`);
    console.log(`📊 David following count: ${davidFollowing.count}`);
    console.log(`📊 Alex followers count: ${alexFollowers.count}`);
    console.log(`🔔 Notification creation: ${notifResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (davidFollowsAlex.isFollowing && davidFollowing.count > 0 && alexFollowers.count > 0 && notifResult.success) {
      console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
    } else {
      console.log('\n⚠️ Some issues remain. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
};

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.testAfterSQLFix = testAfterSQLFix;
  console.log('🧪 SQL fix test ready: global.testAfterSQLFix()');
}

export default testAfterSQLFix;