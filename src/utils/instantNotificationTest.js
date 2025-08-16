/**
 * 즉시 노티피케이션 테스트 도구
 * 콘솔에서 바로 실행 가능한 간단한 테스트
 */

import { supabase } from '../services/supabase';
import notificationService from '../services/notifications';
import UnifiedFollowService from '../services/UnifiedFollowService';

class InstantNotificationTest {
  constructor() {
    this.testUserId1 = '10663749-9fba-4039-9f22-d6e7add9ea2d'; // Alex Kim
    this.testUserId2 = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22'; // David Lee
  }

  /**
   * 즉시 팔로우 노티피케이션 테스트
   */
  async quickFollowTest() {
    console.log('🧪 QUICK FOLLOW NOTIFICATION TEST');
    console.log('=================================');
    
    try {
      // 1. 언팔로우부터 (깨끗한 테스트)
      console.log('Step 1: Unfollowing first...');
      await UnifiedFollowService.unfollowUser(this.testUserId2, this.testUserId1);
      
      await this.wait(1000);
      
      // 2. 팔로우 실행
      console.log('Step 2: Following and creating notification...');
      const followResult = await UnifiedFollowService.followUser(this.testUserId2, this.testUserId1);
      
      console.log('Follow result:', followResult);
      
      if (followResult.success) {
        console.log('✅ Follow successful - notification should be creating...');
        
        // 3. 노티피케이션 생성 대기
        console.log('Step 3: Waiting for notification...');
        await this.wait(3000);
        
        // 4. 노티피케이션 확인
        await this.checkRecentNotifications();
      } else {
        console.log('❌ Follow failed:', followResult.error);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * 직접 노티피케이션 생성 테스트
   */
  async directNotificationTest() {
    console.log('🔔 DIRECT NOTIFICATION CREATE TEST');
    console.log('==================================');
    
    try {
      const result = await notificationService.createFollowNotification(
        this.testUserId2, // David Lee (sender)
        this.testUserId1  // Alex Kim (recipient)
      );
      
      console.log('Direct notification result:', result);
      
      if (result.success) {
        console.log('✅ Direct notification created successfully!');
        console.log('Notification data:', result.data);
        
        // 즉시 확인
        await this.wait(1000);
        await this.checkRecentNotifications();
      } else {
        console.log('❌ Direct notification failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Direct test failed:', error);
    }
  }

  /**
   * 최근 노티피케이션 확인
   */
  async checkRecentNotifications() {
    console.log('📱 Checking recent notifications...');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(username)
        `)
        .eq('recipient_id', this.testUserId1) // Alex Kim의 노티피케이션
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return;
      }
      
      console.log(`📬 Found ${data.length} recent notifications:`);
      
      if (data.length === 0) {
        console.log('❌ NO NOTIFICATIONS FOUND!');
        console.log('💡 This means notification creation is not working');
      } else {
        data.forEach((notif, index) => {
          const sender = notif.sender?.username || 'Unknown';
          const time = new Date(notif.created_at).toLocaleString();
          console.log(`   ${index + 1}. ${notif.type}: "${notif.message}" from ${sender} (${time})`);
        });
      }
      
    } catch (error) {
      console.error('❌ Exception checking notifications:', error);
    }
  }

  /**
   * 현재 사용자로 테스트 (로그인된 사용자 사용)
   */
  async testWithCurrentUser() {
    const currentUser = global.currentUser;
    if (!currentUser) {
      console.log('❌ No current user found. Please log in first.');
      return;
    }
    
    console.log(`👤 Testing with current user: ${currentUser.email} (${currentUser.id})`);
    
    // 현재 사용자가 아닌 다른 사용자 찾기
    try {
      const { data: otherUsers, error } = await supabase
        .from('profiles')
        .select('user_id, username, email')
        .neq('user_id', currentUser.id)
        .limit(1);
      
      if (error || otherUsers.length === 0) {
        console.log('❌ No other users found for testing');
        return;
      }
      
      const otherUser = otherUsers[0];
      console.log(`🎯 Testing: ${currentUser.email} → ${otherUser.username || otherUser.email}`);
      
      // 1. 언팔로우
      console.log('Step 1: Unfollowing...');
      await UnifiedFollowService.unfollowUser(currentUser.id, otherUser.user_id);
      
      await this.wait(1000);
      
      // 2. 팔로우 및 노티피케이션 생성
      console.log('Step 2: Following...');
      const result = await UnifiedFollowService.followUser(currentUser.id, otherUser.user_id);
      
      console.log('Follow result:', result);
      
      if (result.success) {
        console.log('✅ Follow successful');
        
        await this.wait(3000);
        
        // 3. 대상 사용자의 노티피케이션 확인
        console.log(`Step 3: Checking notifications for ${otherUser.username}...`);
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', otherUser.user_id)
          .eq('sender_id', currentUser.id)
          .eq('type', 'follow')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) {
          console.error('❌ Error checking notifications:', error);
        } else if (data.length > 0) {
          console.log('✅ NEW NOTIFICATION FOUND!');
          console.log('   Message:', data[0].message);
          console.log('   Created:', data[0].created_at);
        } else {
          console.log('❌ NO NEW NOTIFICATION FOUND');
        }
      }
      
    } catch (error) {
      console.error('❌ Test with current user failed:', error);
    }
  }

  /**
   * 대기 함수
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 노티피케이션 서비스 상태 확인
   */
  checkServiceStatus() {
    console.log('🛠️ NOTIFICATION SERVICE STATUS');
    console.log('==============================');
    console.log('Initialized:', notificationService.isInitialized);
    console.log('Realtime enabled:', notificationService.realtimeEnabled);
    console.log('Channel errors:', notificationService.channelErrorCount || 0);
  }
}

// 싱글톤 인스턴스
const instantTest = new InstantNotificationTest();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.quickFollowTest = () => instantTest.quickFollowTest();
  global.directNotificationTest = () => instantTest.directNotificationTest();
  global.testWithCurrentUser = () => instantTest.testWithCurrentUser();
  global.checkRecentNotifications = () => instantTest.checkRecentNotifications();
  global.checkNotificationServiceStatus = () => instantTest.checkServiceStatus();
  
  console.log('⚡ Instant notification test ready!');
  console.log('💡 Quick commands:');
  console.log('   global.quickFollowTest() - Full follow test');
  console.log('   global.directNotificationTest() - Direct notification test');
  console.log('   global.testWithCurrentUser() - Test with current user');
  console.log('   global.checkRecentNotifications() - Check recent notifications');
}

export default instantTest;