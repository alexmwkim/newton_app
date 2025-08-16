/**
 * 네트워크 및 Supabase 연결 진단
 */

import { supabase } from '../services/supabase';

class NetworkDiagnostic {
  constructor() {
    this.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    this.supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  }

  /**
   * 종합 네트워크 진단
   */
  async runFullDiagnostic() {
    console.log('🔍 NETWORK & SUPABASE DIAGNOSTIC');
    console.log('=================================');
    
    try {
      // 1. 환경변수 확인
      console.log('1. Environment Variables:');
      console.log(`   SUPABASE_URL: ${this.supabaseUrl ? 'SET' : 'MISSING'}`);
      console.log(`   SUPABASE_KEY: ${this.supabaseKey ? 'SET' : 'MISSING'}`);
      
      if (this.supabaseUrl) {
        console.log(`   URL: ${this.supabaseUrl.substring(0, 30)}...`);
      }
      if (this.supabaseKey) {
        console.log(`   KEY: ${this.supabaseKey.substring(0, 20)}...`);
      }

      // 2. 기본 네트워크 연결 테스트
      console.log('\n2. Basic Network Test:');
      try {
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD',
          timeout: 5000 
        });
        console.log(`   Internet: ${response.ok ? '✅ CONNECTED' : '❌ FAILED'}`);
      } catch (error) {
        console.log('   Internet: ❌ FAILED -', error.message);
      }

      // 3. Supabase URL 접근 테스트
      console.log('\n3. Supabase URL Test:');
      if (this.supabaseUrl) {
        try {
          const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
            method: 'HEAD',
            headers: {
              'apikey': this.supabaseKey,
              'Authorization': `Bearer ${this.supabaseKey}`
            },
            timeout: 10000
          });
          console.log(`   Supabase API: ${response.ok ? '✅ ACCESSIBLE' : '❌ FAILED'}`);
          console.log(`   Status: ${response.status}`);
        } catch (error) {
          console.log('   Supabase API: ❌ FAILED -', error.message);
        }
      }

      // 4. Supabase 클라이언트 테스트
      console.log('\n4. Supabase Client Test:');
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.log('   Auth session: ❌ FAILED -', error.message);
        } else {
          console.log('   Auth session: ✅ OK');
          console.log(`   User: ${data.session?.user ? 'LOGGED IN' : 'NOT LOGGED IN'}`);
          if (data.session?.user) {
            console.log(`   User ID: ${data.session.user.id}`);
          }
        }
      } catch (error) {
        console.log('   Auth session: ❌ EXCEPTION -', error.message);
      }

      // 5. 데이터베이스 연결 테스트
      console.log('\n5. Database Connection Test:');
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
          
        if (error) {
          console.log('   Database: ❌ FAILED -', error.message);
          console.log('   Error code:', error.code);
        } else {
          console.log('   Database: ✅ CONNECTED');
          console.log(`   Sample query result: ${data ? 'SUCCESS' : 'NO DATA'}`);
        }
      } catch (error) {
        console.log('   Database: ❌ EXCEPTION -', error.message);
      }

      // 6. Notifications 테이블 접근 테스트
      console.log('\n6. Notifications Table Test:');
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id')
          .limit(1);
          
        if (error) {
          console.log('   Notifications table: ❌ FAILED -', error.message);
          console.log('   Error code:', error.code);
          
          if (error.code === '42P01') {
            console.log('   💡 Table does not exist - needs to be created');
          } else if (error.code === '42501') {
            console.log('   💡 RLS policy issue - check permissions');
          }
        } else {
          console.log('   Notifications table: ✅ ACCESSIBLE');
        }
      } catch (error) {
        console.log('   Notifications table: ❌ EXCEPTION -', error.message);
      }

      // 7. Follows 테이블 접근 테스트
      console.log('\n7. Follows Table Test:');
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('follower_id, following_id')
          .limit(1);
          
        if (error) {
          console.log('   Follows table: ❌ FAILED -', error.message);
        } else {
          console.log('   Follows table: ✅ ACCESSIBLE');
          console.log(`   Sample data: ${data?.length || 0} rows`);
        }
      } catch (error) {
        console.log('   Follows table: ❌ EXCEPTION -', error.message);
      }

      console.log('\n📋 DIAGNOSTIC COMPLETE');
      console.log('=======================');

    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
    }
  }

  /**
   * 빠른 연결 테스트
   */
  async quickConnectionTest() {
    console.log('⚡ QUICK CONNECTION TEST');
    console.log('========================');
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const endTime = Date.now();
      
      console.log(`🕐 Response time: ${endTime - startTime}ms`);
      
      if (error) {
        console.log('❌ FAILED:', error.message);
      } else {
        console.log('✅ SUCCESS: Supabase connection OK');
        console.log(`👤 User: ${data.session?.user ? 'Logged in' : 'Not logged in'}`);
      }
      
    } catch (error) {
      console.log('❌ EXCEPTION:', error.message);
    }
  }
}

// 싱글톤 인스턴스
const networkDiagnostic = new NetworkDiagnostic();

// 글로벌 함수 등록
if (__DEV__ && typeof global !== 'undefined') {
  global.runNetworkDiagnostic = () => networkDiagnostic.runFullDiagnostic();
  global.quickConnectionTest = () => networkDiagnostic.quickConnectionTest();
  
  console.log('🔍 Network diagnostic ready!');
  console.log('💡 Commands:');
  console.log('   global.runNetworkDiagnostic() - Full network diagnostic');
  console.log('   global.quickConnectionTest() - Quick connection test');
}

export default networkDiagnostic;