/**
 * 간단한 노티피케이션 테스트
 * 외래 키 의존성 없이 기본 기능만 테스트
 */

import { supabase } from '../services/supabase';
import notificationService from '../services/notifications';

class SimpleNotificationTest {
  constructor() {
    this.alexKimId = '10663749-9fba-4039-9f22-d6e7add9ea2d';
    this.davidLeeId = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22';
  }

  /**
   * 기본 노티피케이션 생성 테스트 (외래 키 없이)
   */
  async testBasicNotification() {
    console.log('🧪 BASIC NOTIFICATION TEST (No Foreign Keys)');
    console.log('============================================');
    
    try {
      // 직접 notifications 테이블에 삽입
      const notification = {
        id: `test_${Date.now()}`,
        recipient_id: this.alexKimId,
        sender_id: this.davidLeeId,
        type: 'follow',
        title: 'You have a new follower',
        message: 'Someone started following you',
        data: JSON.stringify({
          sender_id: this.davidLeeId,
          action: 'follow'
        }),
        priority: 'high',
        related_user_id: this.davidLeeId,
        is_read: false,
        created_at: new Date().toISOString()
      };

      console.log('📝 Inserting notification directly...');
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Direct insert failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Direct insert successful!');
      console.log('   Notification ID:', data.id);
      console.log('   Created at:', data.created_at);
      
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Basic test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 서비스 메소드를 통한 테스트
   */
  async testServiceMethod() {
    console.log('🔧 SERVICE METHOD TEST');
    console.log('======================');
    
    try {
      console.log('📞 Calling createFollowNotification...');
      const result = await notificationService.createFollowNotification(
        this.davidLeeId,
        this.alexKimId
      );
      
      console.log('📱 Service result:', result);
      
      if (result.success) {
        console.log('✅ Service method successful!');
        console.log('   Notification data:', result.data);
      } else {
        console.log('❌ Service method failed:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Service test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 노티피케이션 조회 테스트
   */
  async testNotificationFetch() {
    console.log('📱 NOTIFICATION FETCH TEST');
    console.log('==========================');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', this.alexKimId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('❌ Fetch failed:', error);
        return;
      }
      
      console.log(`📬 Found ${data.length} notifications for Alex Kim:`);
      data.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.type}: "${notif.message}" (${notif.created_at})`);
      });
      
    } catch (error) {
      console.error('❌ Fetch test failed:', error);
    }
  }

  /**
   * 전체 테스트 실행
   */
  async runAllTests() {
    console.log('🚀 RUNNING ALL SIMPLE TESTS');
    console.log('===========================');
    
    // 1. 기본 직접 삽입 테스트
    const basicResult = await this.testBasicNotification();
    
    await this.wait(1000);
    
    // 2. 서비스 메소드 테스트
    const serviceResult = await this.testServiceMethod();
    
    await this.wait(1000);
    
    // 3. 조회 테스트
    await this.testNotificationFetch();
    
    // 4. 결과 요약
    console.log('\n📋 TEST SUMMARY');
    console.log('================');
    console.log(`Direct insert: ${basicResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Service method: ${serviceResult.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (basicResult.success && serviceResult.success) {
      console.log('🎉 ALL TESTS PASSED! Notification system is working!');
    } else {
      console.log('⚠️ Some tests failed. Check the errors above.');
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 싱글톤 인스턴스
const simpleTest = new SimpleNotificationTest();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.simpleNotificationTest = () => simpleTest.runAllTests();
  global.testBasicNotification = () => simpleTest.testBasicNotification();
  global.testServiceMethod = () => simpleTest.testServiceMethod();
  global.checkNotifications = () => simpleTest.testNotificationFetch();
  
  console.log('🔧 Simple notification test ready!');
  console.log('💡 Commands:');
  console.log('   global.simpleNotificationTest() - Run all tests');
  console.log('   global.testBasicNotification() - Test direct insert');
  console.log('   global.testServiceMethod() - Test service method');
  console.log('   global.checkNotifications() - Check notifications');
}

export default simpleTest;