/**
 * RLS 정책 수정 후 노티피케이션 테스트
 */

import notificationService from '../services/notifications';
import UnifiedFollowService from '../services/UnifiedFollowService';

class NotificationTestAfterRLS {
  constructor() {
    this.alexKimId = '10663749-9fba-4039-9f22-d6e7add9ea2d';
    this.davidLeeId = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
  }

  /**
   * 노티피케이션 생성 테스트
   */
  async testNotificationCreation() {
    console.log('🧪 TESTING NOTIFICATION CREATION AFTER RLS FIX');
    console.log('===============================================');
    
    try {
      console.log('📝 Attempting to create follow notification...');
      console.log(`   Sender: David Lee (${this.davidLeeId})`);
      console.log(`   Recipient: Alex Kim (${this.alexKimId})`);
      
      const result = await notificationService.createFollowNotification(
        this.davidLeeId,
        this.alexKimId
      );
      
      console.log('📱 Notification creation result:', result);
      
      if (result.success) {
        console.log('✅ SUCCESS! Notification created successfully');
        console.log('   Notification ID:', result.data?.id);
        console.log('   Created at:', result.data?.created_at);
        return true;
      } else {
        console.log('❌ FAILED! Notification creation failed');
        console.log('   Error:', result.error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ EXCEPTION during notification test:', error);
      return false;
    }
  }

  /**
   * 전체 팔로우 + 노티피케이션 테스트
   */
  async testCompleteFollowFlow() {
    console.log('\n🚀 TESTING COMPLETE FOLLOW + NOTIFICATION FLOW');
    console.log('===============================================');
    
    try {
      // 1. 언팔로우부터 시작 (깨끗한 테스트)
      console.log('Step 1: Unfollowing first...');
      const unfollowResult = await UnifiedFollowService.unfollowUser(this.davidLeeId, this.alexKimId);
      console.log('   Unfollow result:', unfollowResult.success ? 'Success' : 'Failed');
      
      await this.wait(1000);
      
      // 2. 팔로우 실행 (노티피케이션 생성 포함)
      console.log('Step 2: Following (should create notification)...');
      const followResult = await UnifiedFollowService.followUser(this.davidLeeId, this.alexKimId);
      console.log('   Follow result:', followResult.success ? 'Success' : 'Failed');
      
      if (followResult.success) {
        console.log('✅ Follow successful - notification should be created automatically');
        
        // 3. 노티피케이션 생성 대기
        console.log('Step 3: Waiting for notification creation...');
        await this.wait(3000);
        
        // 4. 노티피케이션 확인
        console.log('Step 4: Checking for created notification...');
        await this.checkRecentNotifications();
      } else {
        console.log('❌ Follow failed:', followResult.error);
      }
      
    } catch (error) {
      console.error('❌ Complete flow test failed:', error);
    }
  }

  /**
   * 최근 노티피케이션 확인
   */
  async checkRecentNotifications() {
    try {
      const result = await notificationService.getUserNotifications(this.alexKimId, 5, 0);
      
      if (result.success) {
        console.log(`📬 Found ${result.data.length} recent notifications for Alex Kim:`);
        
        if (result.data.length > 0) {
          result.data.forEach((notif, index) => {
            const time = new Date(notif.created_at).toLocaleString();
            console.log(`   ${index + 1}. ${notif.type}: "${notif.message}" (${time})`);
          });
          
          // 최근 팔로우 노티피케이션 찾기
          const recentFollowNotif = result.data.find(n => 
            n.type === 'follow' && 
            n.sender_id === this.davidLeeId &&
            Date.now() - new Date(n.created_at).getTime() < 60000 // 최근 1분 내
          );
          
          if (recentFollowNotif) {
            console.log('🎉 FOUND RECENT FOLLOW NOTIFICATION!');
            console.log('   Message:', recentFollowNotif.message);
            console.log('   Created:', recentFollowNotif.created_at);
          } else {
            console.log('⚠️ No recent follow notification found');
          }
        } else {
          console.log('📭 No notifications found');
        }
      } else {
        console.log('❌ Failed to fetch notifications:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Failed to check notifications:', error);
    }
  }

  /**
   * 대기 함수
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 싱글톤 인스턴스
const notificationTest = new NotificationTestAfterRLS();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.testNotificationAfterRLS = () => notificationTest.testNotificationCreation();
  global.testCompleteFollowFlow = () => notificationTest.testCompleteFollowFlow();
  global.checkRecentNotifications = () => notificationTest.checkRecentNotifications();
  
  console.log('🧪 Notification test after RLS fix ready!');
  console.log('💡 Commands:');
  console.log('   global.testNotificationAfterRLS() - Test notification creation');
  console.log('   global.testCompleteFollowFlow() - Test complete follow flow');
  console.log('   global.checkRecentNotifications() - Check recent notifications');
}

export default notificationTest;