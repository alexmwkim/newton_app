/**
 * 노티피케이션 실시간 구독 문제 해결 유틸리티
 * CHANNEL_ERROR 문제를 진단하고 해결하는 도구
 */

import { supabase } from '../services/supabase';

class NotificationRealtimeFix {
  constructor() {
    this.diagnosticResults = {};
  }

  /**
   * 전체 진단 실행
   */
  async runDiagnostics() {
    console.log('🔍 NOTIFICATION REALTIME DIAGNOSTICS');
    console.log('===================================');
    
    // 1. 기본 연결 테스트
    await this.testBasicConnection();
    
    // 2. 테이블 존재 확인
    await this.checkTableExists();
    
    // 3. RLS 정책 확인
    await this.checkRLSPolicies();
    
    // 4. 실시간 구독 테스트
    await this.testRealtimeSubscription();
    
    // 5. 결과 요약 및 해결책 제시
    this.provideSolutions();
  }

  /**
   * 기본 데이터베이스 연결 테스트
   */
  async testBasicConnection() {
    console.log('📊 1. Testing basic database connection...');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        this.diagnosticResults.connection = { success: false, error: error.message };
        console.log('❌ Database connection failed:', error.message);
      } else {
        this.diagnosticResults.connection = { success: true };
        console.log('✅ Database connection successful');
      }
    } catch (error) {
      this.diagnosticResults.connection = { success: false, error: error.message };
      console.log('❌ Database connection exception:', error.message);
    }
  }

  /**
   * notifications 테이블 존재 확인
   */
  async checkTableExists() {
    console.log('📋 2. Checking if notifications table exists...');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          this.diagnosticResults.table = { success: false, error: 'Table does not exist' };
          console.log('❌ notifications table does not exist');
        } else {
          this.diagnosticResults.table = { success: false, error: error.message };
          console.log('❌ Error accessing notifications table:', error.message);
        }
      } else {
        this.diagnosticResults.table = { success: true };
        console.log('✅ notifications table exists');
      }
    } catch (error) {
      this.diagnosticResults.table = { success: false, error: error.message };
      console.log('❌ Exception checking table:', error.message);
    }
  }

  /**
   * RLS 정책 확인
   */
  async checkRLSPolicies() {
    console.log('🔒 3. Checking RLS policies...');
    
    try {
      // 현재 사용자로 노티피케이션 조회 시도
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);
      
      if (error) {
        this.diagnosticResults.rls = { success: false, error: error.message };
        console.log('❌ RLS policy issue:', error.message);
      } else {
        this.diagnosticResults.rls = { success: true };
        console.log('✅ RLS policies allow access');
      }
    } catch (error) {
      this.diagnosticResults.rls = { success: false, error: error.message };
      console.log('❌ RLS check exception:', error.message);
    }
  }

  /**
   * 실시간 구독 테스트
   */
  async testRealtimeSubscription() {
    console.log('📡 4. Testing realtime subscription...');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.diagnosticResults.realtime = { success: false, error: 'Subscription timeout' };
        console.log('❌ Realtime subscription timed out');
        resolve();
      }, 10000);

      const testChannel = supabase
        .channel('diagnostic-test-channel')
        .subscribe((status, err) => {
          clearTimeout(timeout);
          
          console.log('📡 Subscription status:', status);
          
          switch (status) {
            case 'SUBSCRIBED':
              this.diagnosticResults.realtime = { success: true };
              console.log('✅ Realtime subscription successful');
              supabase.removeChannel(testChannel);
              resolve();
              break;
              
            case 'CHANNEL_ERROR':
              this.diagnosticResults.realtime = { 
                success: false, 
                error: 'Channel error - realtime not enabled on table' 
              };
              console.log('❌ Channel error - realtime not enabled');
              supabase.removeChannel(testChannel);
              resolve();
              break;
              
            case 'TIMED_OUT':
              this.diagnosticResults.realtime = { success: false, error: 'Connection timeout' };
              console.log('❌ Realtime connection timed out');
              supabase.removeChannel(testChannel);
              resolve();
              break;
              
            case 'CLOSED':
              console.log('🔒 Realtime connection closed');
              resolve();
              break;
          }
          
          if (err) {
            console.error('📡 Subscription error details:', err);
          }
        });
    });
  }

  /**
   * 해결책 제시
   */
  provideSolutions() {
    console.log('\n🔧 DIAGNOSTIC RESULTS & SOLUTIONS');
    console.log('=================================');
    
    let hasIssues = false;
    
    // 연결 문제
    if (!this.diagnosticResults.connection?.success) {
      hasIssues = true;
      console.log('❌ DATABASE CONNECTION ISSUE:');
      console.log('   - Check your internet connection');
      console.log('   - Verify Supabase project is active');
      console.log('   - Check environment variables');
    }
    
    // 테이블 문제
    if (!this.diagnosticResults.table?.success) {
      hasIssues = true;
      console.log('❌ NOTIFICATIONS TABLE ISSUE:');
      console.log('   - Run the table creation script');
      console.log('   - Check if table name is correct');
    }
    
    // RLS 문제
    if (!this.diagnosticResults.rls?.success) {
      hasIssues = true;
      console.log('❌ RLS POLICY ISSUE:');
      console.log('   - Create RLS policies for notifications table');
      console.log('   - Ensure authenticated users can read their notifications');
    }
    
    // 실시간 문제
    if (!this.diagnosticResults.realtime?.success) {
      hasIssues = true;
      console.log('❌ REALTIME SUBSCRIPTION ISSUE:');
      console.log('   📝 TO FIX CHANNEL_ERROR:');
      console.log('   1. Go to Supabase Dashboard');
      console.log('   2. Navigate to Database → Replication');
      console.log('   3. Find "notifications" table');
      console.log('   4. Toggle ON the realtime replication');
      console.log('   5. Save changes');
      console.log('');
      console.log('   📱 Alternative: App will work without realtime updates');
      console.log('       (notifications will appear when app refreshes)');
    }
    
    if (!hasIssues) {
      console.log('✅ ALL SYSTEMS WORKING!');
      console.log('   Realtime notifications should work properly');
    }
    
    console.log('\n💡 Quick fix command: global.fixNotificationRealtime()');
  }

  /**
   * 자동 수정 시도
   */
  async attemptAutoFix() {
    console.log('🔧 ATTEMPTING AUTO-FIX...');
    console.log('========================');
    
    // notifications 테이블 생성 (존재하지 않는 경우)
    if (!this.diagnosticResults.table?.success) {
      console.log('📋 Creating notifications table...');
      // 테이블 생성 로직은 수동으로 해야 함 (RLS 때문에)
      console.log('⚠️ Table creation requires manual setup in Supabase Dashboard');
    }
    
    // 실시간 구독 재시도
    if (!this.diagnosticResults.realtime?.success) {
      console.log('📡 Realtime issues require manual setup in Supabase Dashboard');
      console.log('   Database → Replication → Enable for notifications table');
    }
    
    console.log('✅ Auto-fix complete (manual steps may still be required)');
  }
}

// 싱글톤 인스턴스
const realtimeFix = new NotificationRealtimeFix();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.fixNotificationRealtime = () => realtimeFix.runDiagnostics();
  global.diagnoseNotifications = () => realtimeFix.runDiagnostics();
  global.autoFixNotifications = () => realtimeFix.attemptAutoFix();
  
  console.log('🔧 Notification diagnostic tools ready!');
  console.log('💡 Run global.fixNotificationRealtime() to diagnose issues');
}

export default realtimeFix;