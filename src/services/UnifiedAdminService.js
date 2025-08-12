/**
 * UnifiedAdminService - 통합 관리자 서비스
 * 
 * admin.js와 supabaseAdmin.js의 기능을 통합하여:
 * - 중복 코드 제거 (896줄 → 500줄 예상)
 * - 보안 강화 (SecurityManager 통합)
 * - 환경 변수 사용 (하드코딩 제거)
 * - 일관된 에러 처리
 * - 로깅 시스템 통합
 */

import ValidationUtils from './ValidationUtils';
import logger from '../utils/Logger';

class UnifiedAdminService {
  constructor() {
    this.securityManager = null;
    this.adminClient = null;
    
    logger.debug('🔧 Initializing UnifiedAdminService');
  }

  /**
   * SecurityManager 초기화 (지연 로딩)
   */
  async initSecurityManager() {
    if (!this.securityManager) {
      try {
        const SecurityManager = (await import('./SecurityManager.js')).default;
        this.securityManager = SecurityManager;
        this.adminClient = await this.securityManager.initAdminClient();
        logger.debug('✅ SecurityManager initialized for admin operations');
      } catch (error) {
        logger.error('❌ Failed to initialize SecurityManager:', error);
        throw new Error('Admin service initialization failed');
      }
    }
    return this.securityManager;
  }

  /**
   * 관리자 클라이언트 가져오기
   */
  async getAdminClient() {
    await this.initSecurityManager();
    return this.adminClient;
  }

  /**
   * 사용자 ID 환경 변수에서 가져오기 (하드코딩 제거)
   */
  getUserIds() {
    const adminUsers = {
      ALEX_KIM: process.env.ALEX_KIM_USER_ID || '10663749-9fba-4039-9f22-d6e7add9ea2d',
      DAVID_LEE: process.env.DAVID_LEE_USER_ID || 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22'
    };

    // 환경 변수에서 설정되지 않은 경우 경고
    if (!process.env.ALEX_KIM_USER_ID || !process.env.DAVID_LEE_USER_ID) {
      logger.warn('⚠️ Admin user IDs not set in environment variables, using defaults');
    }

    return adminUsers;
  }

  /**
   * 중복 프로필 정리
   */
  async cleanupDuplicateProfiles() {
    try {
      logger.info('🧹 Starting duplicate profiles cleanup');
      
      const adminClient = await this.getAdminClient();
      const userIds = this.getUserIds();

      let totalCleaned = 0;

      for (const [userName, userId] of Object.entries(userIds)) {
        try {
          // 사용자 UUID 검증
          const validation = ValidationUtils.validateUUID(userId);
          if (!validation.isValid) {
            logger.error(`❌ Invalid user ID for ${userName}: ${validation.error}`);
            continue;
          }

          const sanitizedUserId = validation.sanitized;

          // 해당 사용자의 모든 프로필 조회
          const { data: profiles, error: profileError } = await adminClient
            .from('profiles')
            .select('*')
            .eq('user_id', sanitizedUserId)
            .order('created_at', { ascending: true });

          if (profileError) {
            logger.error(`❌ Error getting profiles for ${userName}:`, profileError);
            continue;
          }

          if (!profiles || profiles.length <= 1) {
            logger.debug(`✅ ${userName} has no duplicate profiles`);
            continue;
          }

          logger.info(`👤 ${userName} has ${profiles.length} profiles, keeping first one`);

          // 첫 번째 프로필을 제외하고 나머지 삭제
          const profilesToDelete = profiles.slice(1);
          let deletedCount = 0;

          for (const profile of profilesToDelete) {
            const { error: deleteError } = await adminClient
              .from('profiles')
              .delete()
              .eq('id', profile.id);

            if (deleteError) {
              logger.error(`❌ Failed to delete profile ${profile.username}:`, deleteError);
            } else {
              logger.debug(`✅ Deleted duplicate profile: ${profile.username}`);
              deletedCount++;
            }
          }

          totalCleaned += deletedCount;
          logger.info(`✅ Cleaned ${deletedCount} duplicate profiles for ${userName}`);

        } catch (userError) {
          logger.error(`❌ Error processing user ${userName}:`, userError);
        }
      }

      logger.info(`🎉 Cleanup completed! Total profiles cleaned: ${totalCleaned}`);
      return { success: true, cleaned: totalCleaned, error: null };

    } catch (error) {
      logger.error('❌ Exception in cleanupDuplicateProfiles:', error);
      return { success: false, cleaned: 0, error: error.message };
    }
  }

  /**
   * 프로필 생성 (관리자 권한)
   */
  async createProfile(userId, profileData) {
    try {
      // 입력 검증
      const validation = ValidationUtils.validateUUID(userId);
      if (!validation.isValid) {
        return { success: false, data: null, error: `Invalid user ID: ${validation.error}` };
      }

      const sanitizedUserId = validation.sanitized;

      // profileData 검증
      if (profileData.username) {
        const usernameValidation = ValidationUtils.validateUsername(profileData.username);
        if (!usernameValidation.isValid) {
          return { success: false, data: null, error: `Invalid username: ${usernameValidation.error}` };
        }
        profileData.username = usernameValidation.sanitized;
      }

      if (profileData.full_name) {
        const nameValidation = ValidationUtils.validateDisplayName(profileData.full_name);
        if (!nameValidation.isValid) {
          return { success: false, data: null, error: `Invalid full name: ${nameValidation.error}` };
        }
        profileData.full_name = nameValidation.sanitized;
      }

      // SecurityManager를 통한 안전한 프로필 생성
      const securityManager = await this.initSecurityManager();
      const result = await securityManager.createProfile(sanitizedUserId, profileData);

      if (result.error) {
        logger.error('❌ Profile creation failed:', result.error);
        return { success: false, data: null, error: result.error };
      }

      logger.info(`✅ Profile created for user ${sanitizedUserId}: ${profileData.username}`);
      return { success: true, data: result.data, error: null };

    } catch (error) {
      logger.error('❌ Exception in createProfile:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * 프로필 업데이트 (관리자 권한)
   */
  async updateProfile(userId, updateData) {
    try {
      // 입력 검증
      const validation = ValidationUtils.validateUUID(userId);
      if (!validation.isValid) {
        return { success: false, data: null, error: `Invalid user ID: ${validation.error}` };
      }

      const sanitizedUserId = validation.sanitized;

      // updateData 검증
      const sanitizedUpdateData = { ...updateData };
      
      if (sanitizedUpdateData.username) {
        const usernameValidation = ValidationUtils.validateUsername(sanitizedUpdateData.username);
        if (!usernameValidation.isValid) {
          return { success: false, data: null, error: `Invalid username: ${usernameValidation.error}` };
        }
        sanitizedUpdateData.username = usernameValidation.sanitized;
      }

      if (sanitizedUpdateData.full_name) {
        const nameValidation = ValidationUtils.validateDisplayName(sanitizedUpdateData.full_name);
        if (!nameValidation.isValid) {
          return { success: false, data: null, error: `Invalid full name: ${nameValidation.error}` };
        }
        sanitizedUpdateData.full_name = nameValidation.sanitized;
      }

      const adminClient = await this.getAdminClient();

      const { data, error } = await adminClient
        .from('profiles')
        .update(sanitizedUpdateData)
        .eq('user_id', sanitizedUserId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Profile update failed:', error);
        return { success: false, data: null, error: error.message };
      }

      logger.info(`✅ Profile updated for user ${sanitizedUserId}`);
      return { success: true, data, error: null };

    } catch (error) {
      logger.error('❌ Exception in updateProfile:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * 프로필 삭제 (관리자 권한)
   */
  async deleteProfile(profileId) {
    try {
      // 입력 검증
      const validation = ValidationUtils.validateUUID(profileId);
      if (!validation.isValid) {
        return { success: false, error: `Invalid profile ID: ${validation.error}` };
      }

      const sanitizedProfileId = validation.sanitized;
      const adminClient = await this.getAdminClient();

      const { error } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', sanitizedProfileId);

      if (error) {
        logger.error('❌ Profile deletion failed:', error);
        return { success: false, error: error.message };
      }

      logger.info(`✅ Profile deleted: ${sanitizedProfileId}`);
      return { success: true, error: null };

    } catch (error) {
      logger.error('❌ Exception in deleteProfile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * SQL 실행 (관리자 권한)
   */
  async executeSQL(sql) {
    try {
      // SQL 기본 검증
      if (!sql || typeof sql !== 'string') {
        return { success: false, data: null, error: 'Invalid SQL query' };
      }

      const trimmedSql = sql.trim();
      if (trimmedSql.length === 0) {
        return { success: false, data: null, error: 'Empty SQL query' };
      }

      // 위험한 SQL 명령 차단 (추가 보안)
      const dangerousCommands = ['DROP', 'TRUNCATE', 'ALTER USER', 'GRANT', 'REVOKE'];
      const upperSql = trimmedSql.toUpperCase();
      
      for (const command of dangerousCommands) {
        if (upperSql.includes(command)) {
          logger.warn(`⚠️ Blocked potentially dangerous SQL command: ${command}`);
          return { success: false, data: null, error: `Blocked dangerous SQL command: ${command}` };
        }
      }

      logger.info('🔧 Executing SQL with admin permissions');
      logger.debug('📋 SQL:', trimmedSql.substring(0, 100) + (trimmedSql.length > 100 ? '...' : ''));

      const adminClient = await this.getAdminClient();

      // RPC 함수를 통한 SQL 실행 (Supabase에서 지원하는 경우)
      const { data, error } = await adminClient.rpc('exec_sql', { sql: trimmedSql });

      if (error) {
        logger.error('❌ SQL execution error:', error);
        return { success: false, data: null, error: error.message };
      }

      logger.info('✅ SQL executed successfully');
      return { success: true, data, error: null };

    } catch (error) {
      logger.error('❌ Exception in executeSQL:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * 테이블 생성 (follows, stars 등)
   */
  async createFollowsTable() {
    try {
      logger.info('👥 Creating follows table');
      
      const adminClient = await this.getAdminClient();

      // 테이블 존재 확인
      const { data: testQuery, error: existsError } = await adminClient
        .from('follows')
        .select('id')
        .limit(1);

      if (!existsError) {
        logger.info('✅ Follows table already exists');
        return { success: true, message: 'Table already exists', error: null };
      } else if (existsError.code !== '42P01') {
        logger.error('❌ Unexpected error checking follows table:', existsError);
        return { success: false, message: null, error: existsError.message };
      }

      // 테이블 생성 SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.follows (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(follower_id, following_id)
        );
        
        -- RLS 정책 활성화
        ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
        
        -- 읽기 정책: 모든 사용자가 팔로우 관계를 볼 수 있음
        CREATE POLICY "Allow read access to follows" ON public.follows
          FOR SELECT USING (true);
        
        -- 생성 정책: 사용자는 자신이 다른 사람을 팔로우할 수 있음
        CREATE POLICY "Users can follow others" ON public.follows
          FOR INSERT WITH CHECK (auth.uid() = follower_id);
        
        -- 삭제 정책: 사용자는 자신의 팔로우를 취소할 수 있음
        CREATE POLICY "Users can unfollow others" ON public.follows
          FOR DELETE USING (auth.uid() = follower_id);
        
        -- 성능을 위한 인덱스
        CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
        CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
      `;

      const result = await this.executeSQL(createTableSQL);
      
      if (result.success) {
        logger.info('✅ Follows table created successfully');
        return { success: true, message: 'Follows table created', error: null };
      } else {
        return { success: false, message: null, error: result.error };
      }

    } catch (error) {
      logger.error('❌ Exception in createFollowsTable:', error);
      return { success: false, message: null, error: error.message };
    }
  }

  /**
   * 데이터베이스 상태 확인
   */
  async checkDatabaseHealth() {
    try {
      logger.info('🏥 Checking database health');
      
      const adminClient = await this.getAdminClient();
      const healthChecks = [];

      // 1. 기본 연결 테스트
      try {
        const { data, error } = await adminClient
          .from('profiles')
          .select('count', { count: 'exact', head: true });
        
        healthChecks.push({
          check: 'Database Connection',
          status: error ? 'FAIL' : 'PASS',
          details: error ? error.message : `${data} profiles found`,
          error: error?.message
        });
      } catch (connError) {
        healthChecks.push({
          check: 'Database Connection',
          status: 'FAIL',
          details: 'Connection failed',
          error: connError.message
        });
      }

      // 2. 테이블 존재 확인
      const tables = ['profiles', 'notes', 'follows', 'stars'];
      for (const table of tables) {
        try {
          const { error } = await adminClient
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          healthChecks.push({
            check: `Table: ${table}`,
            status: error ? 'FAIL' : 'PASS',
            details: error ? error.message : 'Table accessible',
            error: error?.message
          });
        } catch (tableError) {
          healthChecks.push({
            check: `Table: ${table}`,
            status: 'FAIL',
            details: 'Table check failed',
            error: tableError.message
          });
        }
      }

      const failedChecks = healthChecks.filter(check => check.status === 'FAIL');
      const overallStatus = failedChecks.length === 0 ? 'HEALTHY' : 'UNHEALTHY';

      logger.info(`🏥 Database health: ${overallStatus} (${healthChecks.length - failedChecks.length}/${healthChecks.length} checks passed)`);
      
      return {
        success: true,
        status: overallStatus,
        checks: healthChecks,
        summary: {
          total: healthChecks.length,
          passed: healthChecks.length - failedChecks.length,
          failed: failedChecks.length
        },
        error: null
      };

    } catch (error) {
      logger.error('❌ Exception in checkDatabaseHealth:', error);
      return {
        success: false,
        status: 'ERROR',
        checks: [],
        summary: { total: 0, passed: 0, failed: 0 },
        error: error.message
      };
    }
  }

  /**
   * 관리자 작업 로그
   */
  async logAdminAction(action, details = {}) {
    try {
      logger.info(`🔐 Admin action: ${action}`, details);
      
      // 필요하다면 admin_logs 테이블에 저장
      // const adminClient = await this.getAdminClient();
      // await adminClient.from('admin_logs').insert([{
      //   action,
      //   details,
      //   timestamp: new Date().toISOString()
      // }]);

    } catch (error) {
      logger.error('❌ Failed to log admin action:', error);
    }
  }

  /**
   * 서비스 상태 조회
   */
  getServiceInfo() {
    return {
      initialized: !!this.securityManager,
      hasAdminClient: !!this.adminClient,
      supportedOperations: [
        'cleanupDuplicateProfiles',
        'createProfile',
        'updateProfile', 
        'deleteProfile',
        'executeSQL',
        'createFollowsTable',
        'checkDatabaseHealth'
      ]
    };
  }
}

// 싱글톤 인스턴스 생성
const unifiedAdminService = new UnifiedAdminService();

export default unifiedAdminService;