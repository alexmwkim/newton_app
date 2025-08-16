/**
 * 빠른 네트워크 진단 유틸리티
 * 콘솔에서 바로 실행할 수 있는 간단한 테스트들
 */

import { supabase } from '../services/supabase';

export const runQuickTest = async () => {
  console.log('🚀 Quick Network & Supabase Test');
  console.log('================================');
  
  try {
    // 1. 환경 변수 확인
    console.log('🔍 Environment Check:');
    console.log('  SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('  SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    
    // 2. 현재 세션 확인
    console.log('\n🔐 Auth Session Check:');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('  Status: ❌ Auth Error -', authError.message);
    } else if (session) {
      console.log('  Status: ✅ Authenticated as', session.user.email);
      console.log('  User ID:', session.user.id);
    } else {
      console.log('  Status: ⚠️ Not authenticated (anonymous)');
    }
    
    // 3. 간단한 쿼리 테스트
    console.log('\n📊 Database Connection Test:');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
        
      if (error) {
        console.log('  Profiles table: ❌', error.message);
      } else {
        console.log('  Profiles table: ✅ Connected');
      }
    } catch (queryError) {
      console.log('  Database query: ❌', queryError.message);
    }
    
    // 4. 네트워크 연결 테스트
    console.log('\n🌐 Network Connectivity:');
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      console.log('  Internet: ✅ Connected');
    } catch (networkError) {
      console.log('  Internet: ❌', networkError.message);
    }
    
    // 5. Supabase URL 직접 테스트
    console.log('\n🔗 Supabase URL Test:');
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
        },
        timeout: 10000
      });
      
      console.log('  Supabase API:', response.ok ? '✅ Accessible' : `❌ Status ${response.status}`);
    } catch (supabaseError) {
      console.log('  Supabase API: ❌', supabaseError.message);
    }
    
    console.log('\n================================');
    console.log('Test completed! Check results above.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

export const testNotificationSystem = async () => {
  console.log('🔔 Notification System Test');
  console.log('============================');
  
  try {
    // 현재 사용자 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('❌ No authenticated user found');
      console.log('Please log in first to test notifications');
      return;
    }
    
    const userId = session.user.id;
    console.log('👤 Testing for user:', userId);
    
    // 알림 테이블 존재 확인
    console.log('\n📋 Testing notification tables...');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('count')
        .eq('recipient_id', userId)
        .limit(1);
        
      if (error) {
        if (error.code === '42P01') {
          console.log('  Notifications table: ❌ Does not exist');
          console.log('  💡 You need to create the notifications table in Supabase');
        } else {
          console.log('  Notifications table: ❌', error.message);
        }
      } else {
        console.log('  Notifications table: ✅ Exists and accessible');
      }
    } catch (tableError) {
      console.log('  Table test failed:', tableError.message);
    }
    
    // 프로필 테이블 확인
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.log('  User profile: ❌', error.message);
      } else {
        console.log('  User profile: ✅', data.username || 'No username set');
      }
    } catch (profileError) {
      console.log('  Profile test failed:', profileError.message);
    }
    
    console.log('\n============================');
    
  } catch (error) {
    console.error('❌ Notification test failed:', error.message);
  }
};

// 콘솔에서 쉽게 접근할 수 있도록 전역에 등록
if (typeof global !== 'undefined') {
  global.runQuickTest = runQuickTest;
  global.testNotificationSystem = testNotificationSystem;
}

export default {
  runQuickTest,
  testNotificationSystem
};