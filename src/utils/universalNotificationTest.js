/**
 * 범용 노티피케이션 테스트 도구
 * 모든 등록된 사용자에 대해 노티피케이션 시스템을 테스트
 */

import { supabase } from '../services/supabase';
import notificationService from '../services/notifications';
import UnifiedFollowService from '../services/UnifiedFollowService';

class UniversalNotificationTester {
  constructor() {
    this.testResults = {};
    this.allUsers = [];
  }

  /**
   * 현재 로그인된 사용자 정보 가져오기
   */
  getCurrentUser() {
    if (global.currentUser) {
      return {
        id: global.currentUser.id,
        email: global.currentUser.email,
        username: global.currentUser.username || global.currentUser.email?.split('@')[0]
      };
    }
    return null;
  }

  /**
   * 모든 사용자 목록 가져오기
   */
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, email')
        .order('username');
      
      if (error) {
        console.error('❌ Error fetching users:', error);
        return [];
      }
      
      this.allUsers = data;
      return data;
      
    } catch (error) {
      console.error('❌ Exception fetching users:', error);
      return [];
    }
  }

  /**
   * 범용 노티피케이션 시스템 테스트
   */
  async runUniversalTest() {
    console.log('🌍 UNIVERSAL NOTIFICATION SYSTEM TEST');
    console.log('====================================');
    
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.log('❌ No current user found. Please log in first.');
      return;
    }
    
    console.log(`👤 Current user: ${currentUser.username} (${currentUser.id})`);
    console.log('');
    
    // 1. 모든 사용자 목록 가져오기
    await this.loadAllUsers();
    
    // 2. 현재 사용자의 노티피케이션 확인
    await this.checkCurrentUserNotifications(currentUser);
    
    // 3. 노티피케이션 서비스 상태 확인
    await this.checkNotificationService();
    
    // 4. 다른 사용자와 팔로우 테스트
    await this.testWithOtherUsers(currentUser);
    
    // 5. 결과 요약
    this.summarizeResults();
  }

  /**
   * 모든 사용자 로드
   */
  async loadAllUsers() {
    console.log('👥 Loading all users...');
    
    const users = await this.getAllUsers();
    console.log(`✅ Found ${users.length} users in the system:`);
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username || user.email} (${user.user_id})`);
    });
    
    this.testResults.userCount = users.length;
    console.log('');
  }

  /**
   * 현재 사용자의 노티피케이션 확인
   */
  async checkCurrentUserNotifications(currentUser) {
    console.log('🔔 Checking current user notifications...');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(username, full_name)
        `)
        .eq('recipient_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.log('❌ Error fetching notifications:', error.message);
        this.testResults.notificationCheck = { success: false, error: error.message };
        return;
      }
      
      console.log(`📱 Found ${data.length} notifications for current user`);
      
      if (data.length > 0) {
        console.log('   Recent notifications:');
        data.slice(0, 5).forEach((notif, index) => {
          const sender = notif.sender?.username || 'Unknown';
          console.log(`   ${index + 1}. ${notif.type}: ${notif.message} from ${sender}`);
        });
      }
      
      this.testResults.notificationCheck = { success: true, count: data.length };
      console.log('');
      
    } catch (error) {
      console.log('❌ Exception checking notifications:', error.message);
      this.testResults.notificationCheck = { success: false, error: error.message };
    }
  }

  /**
   * 노티피케이션 서비스 상태 확인
   */
  async checkNotificationService() {
    console.log('🛠️ Checking notification service status...');
    
    try {
      const isInitialized = notificationService.isInitialized;
      const realtimeEnabled = notificationService.realtimeEnabled;
      const channelErrorCount = notificationService.channelErrorCount || 0;
      
      console.log(`   Initialized: ${isInitialized}`);
      console.log(`   Realtime enabled: ${realtimeEnabled}`);
      console.log(`   Channel errors: ${channelErrorCount}`);
      
      this.testResults.serviceStatus = {
        success: true,
        initialized: isInitialized,
        realtime: realtimeEnabled,
        errors: channelErrorCount
      };
      
      console.log('');
      
    } catch (error) {
      console.log('❌ Error checking service status:', error.message);
      this.testResults.serviceStatus = { success: false, error: error.message };
    }
  }

  /**
   * 다른 사용자와 팔로우 테스트
   */
  async testWithOtherUsers(currentUser) {
    console.log('🧪 Testing with other users...');
    
    // 현재 사용자가 아닌 다른 사용자 찾기
    const otherUsers = this.allUsers.filter(user => user.user_id !== currentUser.id);
    
    if (otherUsers.length === 0) {
      console.log('⚠️ No other users found for testing');
      this.testResults.followTest = { success: false, error: 'No other users' };
      return;
    }
    
    // 첫 번째 다른 사용자와 테스트
    const testTargetUser = otherUsers[0];
    console.log(`🎯 Testing with: ${testTargetUser.username} (${testTargetUser.user_id})`);
    
    try {
      // 1. 현재 팔로우 상태 확인
      const followStatus = await UnifiedFollowService.isFollowing(currentUser.id, testTargetUser.user_id);
      console.log(`   Current follow status: ${followStatus.data ? 'Following' : 'Not following'}`);
      
      // 2. 언팔로우부터 시작 (깨끗한 테스트)
      console.log('   Step 1: Unfollowing first...');
      const unfollowResult = await UnifiedFollowService.unfollowUser(currentUser.id, testTargetUser.user_id);
      console.log(`   Unfollow result: ${unfollowResult.success ? 'Success' : 'Failed'}`);
      
      // 3. 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. 팔로우 실행
      console.log('   Step 2: Following...');
      const followResult = await UnifiedFollowService.followUser(currentUser.id, testTargetUser.user_id);
      console.log(`   Follow result: ${followResult.success ? 'Success' : 'Failed'}`);
      
      if (followResult.success) {
        // 5. 노티피케이션 생성 대기
        console.log('   Step 3: Waiting for notification creation...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 6. 새 노티피케이션 확인
        console.log('   Step 4: Checking for new notification...');
        const { data: newNotifs, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', testTargetUser.user_id)
          .eq('sender_id', currentUser.id)
          .eq('type', 'follow')
          .gte('created_at', new Date(Date.now() - 120000).toISOString()) // 마지막 2분
          .order('created_at', { ascending: false });
        
        if (error) {
          console.log('❌ Error checking new notifications:', error.message);
          this.testResults.followTest = { success: false, error: error.message };
        } else if (newNotifs.length > 0) {
          console.log('✅ NEW NOTIFICATION FOUND!');
          console.log(`   Created: ${newNotifs[0].created_at}`);
          console.log(`   Message: ${newNotifs[0].message}`);
          this.testResults.followTest = { success: true, notification: newNotifs[0] };
        } else {
          console.log('❌ NO NEW NOTIFICATION FOUND');
          console.log('   This indicates notification creation is not working');
          this.testResults.followTest = { success: false, error: 'No notification created' };
        }
      } else {
        console.log('❌ Follow action failed:', followResult.error);
        this.testResults.followTest = { success: false, error: followResult.error };
      }
      
    } catch (error) {
      console.log('❌ Exception in follow test:', error.message);
      this.testResults.followTest = { success: false, error: error.message };
    }
    
    console.log('');
  }

  /**
   * 결과 요약
   */
  summarizeResults() {
    console.log('📋 UNIVERSAL TEST RESULTS');
    console.log('=========================');
    
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      console.log(`👤 Tested with user: ${currentUser.username}`);
    }
    
    console.log(`👥 Total users in system: ${this.testResults.userCount || 0}`);
    
    const tests = [
      { name: 'User Loading', result: { success: this.testResults.userCount > 0 } },
      { name: 'Notification Check', result: this.testResults.notificationCheck },
      { name: 'Service Status', result: this.testResults.serviceStatus },
      { name: 'Follow Test', result: this.testResults.followTest }
    ];
    
    let passedTests = 0;
    const totalTests = tests.length;
    
    tests.forEach(test => {
      const icon = test.result?.success ? '✅' : '❌';
      const status = test.result?.success ? 'PASS' : 'FAIL';
      console.log(`${icon} ${test.name}: ${status}`);
      
      if (test.result?.success) passedTests++;
      
      if (!test.result?.success && test.result?.error) {
        console.log(`   Error: ${test.result.error}`);
      }
    });
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Notification system works universally.');
    } else {
      console.log('⚠️ Some tests failed. Notification system needs fixes.');
    }
  }

  /**
   * 강제 노티피케이션 생성 (현재 사용자용)
   */
  async createTestNotification() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.log('❌ No current user for test notification');
      return;
    }
    
    const otherUsers = this.allUsers.filter(user => user.user_id !== currentUser.id);
    if (otherUsers.length === 0) {
      console.log('❌ No other users found for test notification');
      return;
    }
    
    const targetUser = otherUsers[0];
    
    console.log(`💪 Creating test notification: ${currentUser.username} → ${targetUser.username}`);
    
    try {
      const result = await notificationService.createFollowNotification(currentUser.id, targetUser.user_id);
      
      if (result.success) {
        console.log('✅ Test notification created successfully');
        console.log('   Notification data:', result.data);
      } else {
        console.log('❌ Test notification failed:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.log('❌ Exception creating test notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 현재 사용자의 최근 노티피케이션 빠른 확인
   */
  async quickCheckNotifications() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.log('❌ No current user');
      return;
    }
    
    console.log(`🔍 Quick check: ${currentUser.username} notifications`);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(username)
        `)
        .eq('recipient_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.log('❌ Error:', error.message);
        return;
      }
      
      console.log(`📱 ${data.length} recent notifications:`);
      data.forEach((notif, index) => {
        const sender = notif.sender?.username || 'Unknown';
        const time = new Date(notif.created_at).toLocaleString();
        console.log(`   ${index + 1}. ${notif.type}: ${notif.message} from ${sender} (${time})`);
      });
      
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
  }
}

// 싱글톤 인스턴스
const universalTester = new UniversalNotificationTester();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.testNotificationForAnyUser = () => universalTester.runUniversalTest();
  global.createTestNotificationNow = () => universalTester.createTestNotification();
  global.checkMyNotifications = () => universalTester.quickCheckNotifications();
  global.getCurrentUserInfo = () => universalTester.getCurrentUser();
  
  console.log('🌍 Universal notification tester ready!');
  console.log('💡 Works with ANY logged-in user:');
  console.log('   global.testNotificationForAnyUser() - Test with current user');
  console.log('   global.createTestNotificationNow() - Create test notification');
  console.log('   global.checkMyNotifications() - Check current user notifications');
  console.log('   global.getCurrentUserInfo() - Show current user info');
}

export default universalTester;