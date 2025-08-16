/**
 * 노티피케이션 테스트 유틸리티
 * David Lee → Alex Kim 팔로우 노티피케이션 생성 테스트
 */

import { supabase } from '../services/supabase';
import notificationService from '../services/notifications';
import UnifiedFollowService from '../services/UnifiedFollowService';

// 사용자 ID 상수
const ALEX_USER_ID = '10663749-9fba-4039-9f22-d6e7add9ea2d';
const DAVID_USER_ID = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';

class NotificationTester {
  constructor() {
    this.testResults = {};
  }

  /**
   * 전체 노티피케이션 시스템 테스트
   */
  async runFullTest() {
    console.log('🧪 NOTIFICATION SYSTEM TEST');
    console.log('===========================');
    console.log(`Testing: David Lee (${DAVID_USER_ID}) → Alex Kim (${ALEX_USER_ID})`);
    console.log('');

    // 1. 기본 연결 확인
    await this.testDatabaseConnection();
    
    // 2. 사용자 정보 확인
    await this.testUserProfiles();
    
    // 3. 노티피케이션 테이블 확인
    await this.testNotificationTable();
    
    // 4. 기존 노티피케이션 확인
    await this.checkExistingNotifications();
    
    // 5. 수동 노티피케이션 생성 테스트
    await this.testManualNotificationCreation();
    
    // 6. 팔로우 시스템 테스트
    await this.testFollowSystemIntegration();
    
    // 7. 결과 요약
    this.summarizeResults();
  }

  /**
   * 1. 기본 데이터베이스 연결 테스트
   */
  async testDatabaseConnection() {
    console.log('📊 1. Testing database connection...');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        this.testResults.connection = { success: false, error: error.message };
        console.log('❌ Database connection failed:', error.message);
      } else {
        this.testResults.connection = { success: true };
        console.log('✅ Database connection successful');
      }
    } catch (error) {
      this.testResults.connection = { success: false, error: error.message };
      console.log('❌ Database connection exception:', error.message);
    }
  }

  /**
   * 2. 사용자 프로필 확인
   */
  async testUserProfiles() {
    console.log('👤 2. Testing user profiles...');
    
    try {
      // Alex Kim 프로필 확인
      const { data: alexProfile, error: alexError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .eq('user_id', ALEX_USER_ID)
        .single();
      
      // David Lee 프로필 확인
      const { data: davidProfile, error: davidError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .eq('user_id', DAVID_USER_ID)
        .single();
      
      if (alexError || davidError) {
        this.testResults.profiles = { 
          success: false, 
          error: `Alex: ${alexError?.message}, David: ${davidError?.message}` 
        };
        console.log('❌ User profile errors:', { alexError, davidError });
      } else {
        this.testResults.profiles = { 
          success: true, 
          alex: alexProfile, 
          david: davidProfile 
        };
        console.log('✅ User profiles found:');
        console.log(`   Alex Kim: ${alexProfile.username} (${alexProfile.user_id})`);
        console.log(`   David Lee: ${davidProfile.username} (${davidProfile.user_id})`);
      }
    } catch (error) {
      this.testResults.profiles = { success: false, error: error.message };
      console.log('❌ User profile exception:', error.message);
    }
  }

  /**
   * 3. 노티피케이션 테이블 확인
   */
  async testNotificationTable() {
    console.log('📋 3. Testing notifications table...');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          this.testResults.table = { success: false, error: 'notifications table does not exist' };
          console.log('❌ notifications table does not exist');
        } else {
          this.testResults.table = { success: false, error: error.message };
          console.log('❌ Error accessing notifications table:', error.message);
        }
      } else {
        this.testResults.table = { success: true };
        console.log('✅ notifications table exists and accessible');
      }
    } catch (error) {
      this.testResults.table = { success: false, error: error.message };
      console.log('❌ notifications table exception:', error.message);
    }
  }

  /**
   * 4. 기존 노티피케이션 확인
   */
  async checkExistingNotifications() {
    console.log('🔔 4. Checking existing notifications for Alex Kim...');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', ALEX_USER_ID)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        this.testResults.existing = { success: false, error: error.message };
        console.log('❌ Error checking existing notifications:', error.message);
      } else {
        this.testResults.existing = { success: true, count: data.length, data };
        console.log(`✅ Found ${data.length} existing notifications for Alex Kim`);
        
        if (data.length > 0) {
          console.log('   Recent notifications:');
          data.slice(0, 3).forEach(notif => {
            console.log(`   - ${notif.type}: ${notif.message} (${notif.created_at})`);
          });
        }
      }
    } catch (error) {
      this.testResults.existing = { success: false, error: error.message };
      console.log('❌ Exception checking existing notifications:', error.message);
    }
  }

  /**
   * 5. 수동 노티피케이션 생성 테스트
   */
  async testManualNotificationCreation() {
    console.log('🧪 5. Testing manual notification creation...');
    
    try {
      const result = await notificationService.createFollowNotification(DAVID_USER_ID, ALEX_USER_ID);
      
      if (result.success) {
        this.testResults.manual = { success: true, notification: result.data };
        console.log('✅ Manual notification created successfully');
        console.log(`   Notification ID: ${result.data?.id}`);
      } else if (result.isSelfFollow) {
        this.testResults.manual = { success: true, skipped: true };
        console.log('ℹ️ Self-follow notification skipped (as expected)');
      } else {
        this.testResults.manual = { success: false, error: result.error };
        console.log('❌ Manual notification creation failed:', result.error);
      }
    } catch (error) {
      this.testResults.manual = { success: false, error: error.message };
      console.log('❌ Manual notification creation exception:', error.message);
    }
  }

  /**
   * 6. 팔로우 시스템 통합 테스트
   */
  async testFollowSystemIntegration() {
    console.log('👥 6. Testing follow system integration...');
    
    try {
      // 먼저 언팔로우 (테스트 준비)
      console.log('   Preparing test: unfollowing first...');
      await UnifiedFollowService.unfollowUser(DAVID_USER_ID, ALEX_USER_ID);
      
      // 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 팔로우 실행 (노티피케이션 생성 포함)
      console.log('   Executing follow action...');
      const followResult = await UnifiedFollowService.followUser(DAVID_USER_ID, ALEX_USER_ID);
      
      if (followResult.success) {
        this.testResults.followIntegration = { success: true };
        console.log('✅ Follow action successful');
        
        // 노티피케이션 생성 대기 (비동기이므로)
        console.log('   Waiting for notification creation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 새 노티피케이션 확인
        const { data: newNotifs, error: checkError } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', ALEX_USER_ID)
          .eq('sender_id', DAVID_USER_ID)
          .eq('type', 'follow')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (checkError) {
          console.log('❌ Error checking for new notification:', checkError.message);
        } else if (newNotifs.length > 0) {
          console.log('✅ New follow notification found!');
          console.log(`   Created: ${newNotifs[0].created_at}`);
          console.log(`   Message: ${newNotifs[0].message}`);
        } else {
          console.log('❌ No new follow notification found');
        }
      } else {
        this.testResults.followIntegration = { success: false, error: followResult.error };
        console.log('❌ Follow action failed:', followResult.error);
      }
    } catch (error) {
      this.testResults.followIntegration = { success: false, error: error.message };
      console.log('❌ Follow system integration exception:', error.message);
    }
  }

  /**
   * 7. 결과 요약
   */
  summarizeResults() {
    console.log('\n📋 TEST RESULTS SUMMARY');
    console.log('======================');
    
    const tests = [
      { name: 'Database Connection', result: this.testResults.connection },
      { name: 'User Profiles', result: this.testResults.profiles },
      { name: 'Notifications Table', result: this.testResults.table },
      { name: 'Existing Notifications', result: this.testResults.existing },
      { name: 'Manual Notification', result: this.testResults.manual },
      { name: 'Follow Integration', result: this.testResults.followIntegration }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
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
      console.log('🎉 ALL TESTS PASSED! Notification system should work.');
    } else {
      console.log('⚠️ Some tests failed. Check the issues above.');
    }
  }

  /**
   * 빠른 Alex Kim 노티피케이션 확인
   */
  async quickCheckAlexNotifications() {
    console.log('🔍 Quick check: Alex Kim notifications');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(username)
        `)
        .eq('recipient_id', ALEX_USER_ID)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.log('❌ Error:', error.message);
      } else {
        console.log(`📱 ${data.length} notifications found:`);
        data.forEach(notif => {
          const sender = notif.sender?.username || 'Unknown';
          console.log(`   ${notif.type}: ${notif.message} from ${sender} (${notif.created_at})`);
        });
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
  }
}

// 싱글톤 인스턴스
const notificationTester = new NotificationTester();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.testNotificationSystem = () => notificationTester.runFullTest();
  global.checkAlexNotifications = () => notificationTester.quickCheckAlexNotifications();
  global.createTestNotification = () => notificationTester.testManualNotificationCreation();
  
  console.log('🧪 Notification test tools ready!');
  console.log('💡 Run global.testNotificationSystem() to run full test');
  console.log('💡 Run global.checkAlexNotifications() to quickly check Alex notifications');
}

export default notificationTester;