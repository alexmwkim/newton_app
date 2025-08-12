/**
 * AdminServiceMigration - 관리자 서비스 마이그레이션 래퍼
 * 
 * 기존 admin.js와 supabaseAdmin.js를 UnifiedAdminService로 점진적 마이그레이션
 * 기존 API와의 호환성 보장
 */

import UnifiedAdminService from './UnifiedAdminService';
import logger from '../utils/Logger';

/**
 * AdminService 마이그레이션 클래스 (기존 admin.js 대체)
 */
class AdminServiceMigration {
  constructor() {
    this.unifiedService = UnifiedAdminService;
    logger.debug('🔄 AdminService migrating to UnifiedAdminService');
  }

  // 기존 admin.js 메서드들과 호환

  async cleanupDuplicateProfiles() {
    const result = await this.unifiedService.cleanupDuplicateProfiles();
    // 기존 API 형식 유지
    return {
      success: result.success,
      cleaned: result.cleaned || 0,
      error: result.error
    };
  }

  async createProfile(userId, profileData) {
    const result = await this.unifiedService.createProfile(userId, profileData);
    return {
      data: result.data,
      error: result.success ? null : result.error
    };
  }

  async updateProfile(userId, updateData) {
    const result = await this.unifiedService.updateProfile(userId, updateData);
    return {
      data: result.data,
      error: result.success ? null : result.error
    };
  }

  async deleteProfile(profileId) {
    const result = await this.unifiedService.deleteProfile(profileId);
    return {
      success: result.success,
      error: result.error
    };
  }

  // 데이터베이스 관리
  async checkDatabaseHealth() {
    return this.unifiedService.checkDatabaseHealth();
  }

  // 새로운 기능들
  async logAdminAction(action, details = {}) {
    return this.unifiedService.logAdminAction(action, details);
  }

  getServiceInfo() {
    return this.unifiedService.getServiceInfo();
  }
}

/**
 * SupabaseAdminService 마이그레이션 클래스 (기존 supabaseAdmin.js 대체)
 */
class SupabaseAdminServiceMigration {
  constructor() {
    this.unifiedService = UnifiedAdminService;
    logger.debug('🔄 SupabaseAdminService migrating to UnifiedAdminService');
  }

  async executeSQL(sql) {
    const result = await this.unifiedService.executeSQL(sql);
    // 기존 API 형식 유지
    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  async createFollowsTable() {
    const result = await this.unifiedService.createFollowsTable();
    return {
      success: result.success,
      message: result.message,
      error: result.error
    };
  }

  // 다른 테이블 생성 메서드들도 필요시 추가 가능
  async createStarsTable() {
    const createStarsSQL = `
      CREATE TABLE IF NOT EXISTS public.stars (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(note_id, user_id)
      );
      
      -- RLS 정책
      ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view all stars" ON public.stars
        FOR SELECT USING (true);
      
      CREATE POLICY "Users can star notes" ON public.stars
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = user_id AND user_id = auth.uid()
          )
        );
      
      CREATE POLICY "Users can unstar notes" ON public.stars
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = user_id AND user_id = auth.uid()
          )
        );
      
      -- 인덱스
      CREATE INDEX IF NOT EXISTS idx_stars_note_id ON public.stars(note_id);
      CREATE INDEX IF NOT EXISTS idx_stars_user_id ON public.stars(user_id);
    `;

    return this.executeSQL(createStarsSQL);
  }

  // 기존 기능들 유지
  async checkDatabaseHealth() {
    return this.unifiedService.checkDatabaseHealth();
  }
}

// 인스턴스 생성 및 export
export const AdminService = new AdminServiceMigration();
export const SupabaseAdminService = new SupabaseAdminServiceMigration();

// 기본 export는 AdminService (기존 admin.js와 호환)
export default AdminService;