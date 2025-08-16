/**
 * RLS 수정 후 빠른 노티피케이션 테스트
 */

import notificationService from '../services/notifications';

const quickTest = async () => {
  console.log('🧪 QUICK NOTIFICATION TEST AFTER RLS FIX');
  console.log('=========================================');
  
  try {
    // 노티피케이션 서비스 초기화
    console.log('🔧 Initializing notification service...');
    const initResult = await notificationService.initialize('10663749-9fba-4039-9f22-d6e7add9ea2d');
    console.log('Init result:', initResult.success ? 'SUCCESS' : 'FAILED');

    // 팔로우 노티피케이션 생성 테스트
    console.log('\n📝 Creating follow notification...');
    const result = await notificationService.createFollowNotification(
      'e7cc75eb-9ed4-42b9-95d6-88ff615aac22', // David Lee (sender)
      '10663749-9fba-4039-9f22-d6e7add9ea2d'  // Alex Kim (recipient)
    );

    if (result.success) {
      console.log('✅ SUCCESS! Notification created');
      console.log('   ID:', result.data?.id);
      console.log('   Type:', result.data?.type);
      console.log('   Message:', result.data?.message);
      
      // 노티피케이션 목록 확인
      console.log('\n📬 Checking notifications...');
      const notifications = await notificationService.getUserNotifications('10663749-9fba-4039-9f22-d6e7add9ea2d', 3, 0);
      
      if (notifications.success) {
        console.log(`📨 Found ${notifications.data.length} notifications:`);
        notifications.data.forEach((notif, i) => {
          console.log(`   ${i+1}. ${notif.type}: "${notif.message}" (${notif.created_at})`);
        });
      }
      
    } else {
      console.log('❌ FAILED:', result.error);
    }

  } catch (error) {
    console.error('❌ Test exception:', error);
  }
};

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.quickNotificationTest = quickTest;
  console.log('⚡ Quick notification test ready: global.quickNotificationTest()');
}

export default quickTest;