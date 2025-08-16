/**
 * 네트워크 및 Supabase 연결 진단 유틸리티
 */

import { supabase } from '../services/supabase';
// import NetInfo from '@react-native-community/netinfo'; // 선택적으로 사용

class NetworkDiagnostics {
  /**
   * 네트워크 상태 확인 (기본적인 방법)
   */
  static async checkNetworkStatus() {
    try {
      // 간단한 fetch 테스트로 네트워크 확인
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        timeout: 5000
      });
      
      const isConnected = response.ok;
      console.log('🌐 Network Status:', { isConnected });
      return { isConnected };
    } catch (error) {
      console.error('❌ Network check failed:', error);
      return { isConnected: false };
    }
  }

  /**
   * Supabase 연결 테스트
   */
  static async testSupabaseConnection() {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // 간단한 SELECT 쿼리로 연결 테스트
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        console.error('❌ Supabase connection failed:', error);
        return { success: false, error };
      }

      console.log('✅ Supabase connection successful');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 전체 연결 진단
   */
  static async runFullDiagnostics() {
    console.log('🩺 Starting network diagnostics...');
    
    const results = {
      timestamp: new Date().toISOString(),
      network: null,
      supabase: null,
      recommendations: []
    };

    // 1. 네트워크 상태 확인
    results.network = await this.checkNetworkStatus();
    
    if (!results.network?.isConnected) {
      results.recommendations.push('인터넷 연결을 확인해주세요');
      return results;
    }

    // 2. Supabase 연결 테스트
    results.supabase = await this.testSupabaseConnection();
    
    if (!results.supabase.success) {
      results.recommendations.push('Supabase 서비스 상태를 확인해주세요');
      results.recommendations.push('환경 변수 설정을 확인해주세요');
    }

    console.log('🩺 Diagnostics complete:', results);
    return results;
  }

  /**
   * 연결 복구 시도
   */
  static async attemptReconnection() {
    console.log('🔄 Attempting to restore connection...');
    
    // 1초 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const diagnostics = await this.runFullDiagnostics();
    
    if (diagnostics.supabase?.success) {
      console.log('✅ Connection restored successfully');
      return true;
    } else {
      console.log('❌ Connection still failed');
      return false;
    }
  }
}

export default NetworkDiagnostics;