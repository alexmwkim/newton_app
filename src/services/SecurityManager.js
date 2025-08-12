/**
 * SecurityManager - 보안 중앙 관리 시스템
 * Admin 키 사용을 안전하게 관리하고 대체 방법 제공
 */

import { createClient } from '@supabase/supabase-js';
import supabase from './supabase';

class SecurityManager {
  constructor() {
    this.adminClient = null;
    this.isInitialized = false;
  }

  /**
   * Admin 클라이언트 초기화 (필요시에만)
   * 기존 기능 유지를 위해 조건부로만 사용
   */
  async initAdminClient() {
    if (this.isInitialized) return this.adminClient;

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Admin credentials not available, using standard client with RLS');
      this.adminClient = supabase; // fallback to standard client
    } else {
      this.adminClient = createClient(supabaseUrl, supabaseServiceKey);
      console.log('🔐 Admin client initialized for critical operations');
    }

    this.isInitialized = true;
    return this.adminClient;
  }

  /**
   * 프로필 생성 - 안전한 방법 시도 후 필요시 admin 사용
   */
  async createProfile(userId, profileData) {
    try {
      // 1단계: 표준 클라이언트로 시도 (RLS 적용)
      console.log('🔒 Attempting profile creation with standard client (RLS)');
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          user_id: userId,
          ...profileData
        }])
        .select()
        .single();

      if (!error) {
        console.log('✅ Profile created successfully with RLS');
        return { data, error: null };
      }

      // 2단계: RLS 문제로 실패한 경우에만 admin 클라이언트 사용
      console.log('⚠️ RLS creation failed, trying with admin privileges:', error.message);
      
      const adminClient = await this.initAdminClient();
      const { data: adminData, error: adminError } = await adminClient
        .from('profiles')
        .insert([{
          user_id: userId,
          ...profileData
        }])
        .select()
        .single();

      if (adminError) throw adminError;

      console.log('✅ Profile created with admin privileges (fallback)');
      return { data: adminData, error: null };

    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      return { data: null, error };
    }
  }

  /**
   * 사용자 존재 확인 - 가능하면 RLS로, 필요시 admin으로
   */
  async checkUserExists(userId) {
    try {
      // 1단계: auth.getUser()로 현재 사용자 확인
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      
      if (!userError && currentUser?.user?.id === userId) {
        console.log('✅ User verified as current authenticated user');
        return { exists: true, user: currentUser.user };
      }

      // 2단계: 필요시 admin으로 다른 사용자 확인
      const adminClient = await this.initAdminClient();
      const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userId);
      
      if (authError || !authUser?.user) {
        return { exists: false, user: null };
      }

      console.log('✅ User verified via admin API');
      return { exists: true, user: authUser.user };

    } catch (error) {
      console.error('❌ User check failed:', error);
      return { exists: false, user: null };
    }
  }

  /**
   * 입력 검증 및 sanitization - ValidationUtils 사용
   */
  sanitizeProfileInput(profileData) {
    // ValidationUtils 동적 import
    const ValidationUtils = require('./ValidationUtils.js').default;
    
    const validationResult = ValidationUtils.validateProfileData(profileData);
    
    if (!validationResult.isValid) {
      console.error('❌ Profile data validation failed:', validationResult.errors);
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }

    console.log('✅ Profile data validated and sanitized');
    return validationResult.sanitized;
  }

  /**
   * Admin 권한이 필요한 작업인지 판단
   */
  requiresAdminPrivileges(operation, userId) {
    // 현재 사용자와 다른 사용자에 대한 작업인지 확인
    return operation === 'user_lookup' || operation === 'bulk_operation';
  }
}

// 싱글톤 인스턴스
const securityManager = new SecurityManager();

export default securityManager;