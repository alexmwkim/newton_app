/**
 * 네트워크 및 Supabase 연결 테스트 유틸리티
 */

import { supabase, testSupabaseConnection } from '../services/supabase';

/**
 * 기본 네트워크 연결 테스트
 */
export const testBasicNetwork = async () => {
  try {
    console.log('🌐 Testing basic network connectivity...');
    
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ Basic network connectivity: OK');
      return true;
    } else {
      console.log('❌ Basic network connectivity: Failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Basic network test failed:', error.message);
    return false;
  }
};

/**
 * Supabase URL 연결 테스트
 */
export const testSupabaseUrl = async () => {
  try {
    console.log('🔗 Testing Supabase URL connectivity...');
    
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const response = await fetch(supabaseUrl, {
      method: 'HEAD',
      timeout: 10000
    });
    
    console.log('📡 Supabase URL response:', response.status);
    return response.status < 500; // Allow 4xx but not 5xx
  } catch (error) {
    console.error('❌ Supabase URL test failed:', error.message);
    return false;
  }
};

/**
 * Supabase 인증 테스트
 */
export const testSupabaseAuth = async () => {
  try {
    console.log('🔐 Testing Supabase authentication...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth session error:', error.message);
      return false;
    }
    
    console.log('✅ Auth session:', session ? 'Authenticated' : 'Anonymous');
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return false;
  }
};

/**
 * 간단한 Supabase 쿼리 테스트
 */
export const testSimpleQuery = async () => {
  try {
    console.log('📊 Testing simple Supabase query...');
    
    // 가장 간단한 쿼리 시도
    const { data, error } = await supabase
      .rpc('now'); // PostgreSQL now() function
      
    if (error) {
      console.warn('⚠️ RPC test failed, trying table query...');
      
      // RPC가 안되면 테이블 쿼리 시도
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('count(*)')
        .limit(1);
        
      if (profileError) {
        console.error('❌ Table query failed:', profileError.message);
        return false;
      }
      
      console.log('✅ Table query successful');
      return true;
    }
    
    console.log('✅ RPC query successful:', data);
    return true;
  } catch (error) {
    console.error('❌ Query test failed:', error.message);
    return false;
  }
};

/**
 * 알림 테이블 존재 확인
 */
export const testNotificationTables = async () => {
  try {
    console.log('🗄️ Testing notification tables...');
    
    // notifications 테이블 확인
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .select('count(*)')
      .limit(1);
      
    // notification_settings 테이블 확인
    const { data: settingsData, error: settingsError } = await supabase
      .from('notification_settings')
      .select('count(*)')
      .limit(1);
    
    const results = {
      notifications_table: !notifError,
      settings_table: !settingsError,
      notifications_error: notifError?.message,
      settings_error: settingsError?.message
    };
    
    console.log('📋 Table test results:', results);
    return results;
  } catch (error) {
    console.error('❌ Table test failed:', error.message);
    return { error: error.message };
  }
};

/**
 * 전체 진단 실행
 */
export const runFullDiagnostic = async () => {
  console.log('🚀 Starting full network diagnostic...');
  console.log('=====================================');
  
  const results = {
    basicNetwork: await testBasicNetwork(),
    supabaseUrl: await testSupabaseUrl(),
    supabaseAuth: await testSupabaseAuth(),
    simpleQuery: await testSimpleQuery(),
    notificationTables: await testNotificationTables(),
    timestamp: new Date().toISOString()
  };
  
  console.log('=====================================');
  console.log('📊 Diagnostic Summary:');
  Object.entries(results).forEach(([test, result]) => {
    if (test === 'timestamp') return;
    const status = typeof result === 'boolean' ? (result ? '✅' : '❌') : '🔍';
    console.log(`  ${test}: ${status} ${typeof result === 'object' ? JSON.stringify(result) : result}`);
  });
  
  const overallHealth = results.basicNetwork && results.supabaseUrl && results.supabaseAuth;
  console.log(`🏥 Overall Health: ${overallHealth ? '✅ Good' : '❌ Issues detected'}`);
  
  return results;
};

export default {
  testBasicNetwork,
  testSupabaseUrl,
  testSupabaseAuth,
  testSimpleQuery,
  testNotificationTables,
  runFullDiagnostic
};