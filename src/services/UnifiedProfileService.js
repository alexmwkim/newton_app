/**
 * UnifiedProfileService - 통합된 프로필 서비스
 * profiles.js + profilesClient.js 통합 버전
 * 
 * 보안 중심 설계:
 * - RLS 우선 사용
 * - 필요시에만 SecurityManager를 통한 admin 권한 사용
 * - 모든 입력 검증 및 sanitization
 */

import { supabase } from './supabase';
import SecurityManager from './SecurityManager';
import ValidationUtils from './ValidationUtils';
import logger from '../utils/Logger';

class UnifiedProfileService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * 프로필 조회 - RLS 안전
   */
  async getProfile(userId) {
    try {
      logger.debug('👤 Getting profile for user:', userId);
      
      // UUID 검증
      const validation = ValidationUtils.validateUUID(userId);
      if (!validation.isValid) {
        throw new Error(`Invalid userId: ${validation.error}`);
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', validation.sanitized)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.debug('📭 No profile found for user:', userId);
          return { data: null, error: 'Profile not found' };
        }
        throw error;
      }

      logger.debug('✅ Profile retrieved successfully');
      return { data, error: null };
    } catch (error) {
      logger.error('❌ Error getting profile:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 프로필 생성 - SecurityManager 사용
   */
  async createProfile(userId, profileData) {
    try {
      logger.debug('🔨 Creating profile for user:', userId);

      // 입력 검증
      const userValidation = ValidationUtils.validateUUID(userId);
      if (!userValidation.isValid) {
        throw new Error(`Invalid userId: ${userValidation.error}`);
      }

      const dataValidation = ValidationUtils.validateProfileData(profileData);
      if (!dataValidation.isValid) {
        throw new Error(`Profile data validation failed: ${dataValidation.errors.join(', ')}`);
      }

      // 중복 프로필 확인
      const existing = await this.getProfile(userId);
      if (existing.data) {
        logger.debug('🚫 Profile already exists, returning existing');
        return { data: existing.data, error: null };
      }

      // SecurityManager를 통한 안전한 생성
      const result = await SecurityManager.createProfile(
        userValidation.sanitized, 
        dataValidation.sanitized
      );

      if (result.error) {
        throw new Error(result.error);
      }

      logger.info('✅ Profile created successfully');
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('❌ Error creating profile:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 프로필 업데이트 - RLS 안전
   */
  async updateProfile(userId, profileData) {
    try {
      logger.debug('✏️ Updating profile for user:', userId);

      // 입력 검증
      const userValidation = ValidationUtils.validateUUID(userId);
      if (!userValidation.isValid) {
        throw new Error(`Invalid userId: ${userValidation.error}`);
      }

      const dataValidation = ValidationUtils.validateProfileData(profileData);
      if (!dataValidation.isValid) {
        throw new Error(`Profile data validation failed: ${dataValidation.errors.join(', ')}`);
      }

      // RLS에 의해 자동으로 현재 사용자만 업데이트 가능
      const { data, error } = await this.supabase
        .from('profiles')
        .update(dataValidation.sanitized)
        .eq('user_id', userValidation.sanitized)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('✅ Profile updated successfully');
      return { data, error: null };
    } catch (error) {
      logger.error('❌ Error updating profile:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 사용자명 가용성 확인
   */
  async checkUsernameAvailability(username) {
    try {
      logger.debug('🔍 Checking username availability:', username);

      const validation = ValidationUtils.validateUsername(username);
      if (!validation.isValid) {
        return { isAvailable: false, error: validation.error };
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('username')
        .eq('username', validation.sanitized)
        .maybeSingle();

      if (error) {
        logger.error('❌ Username check failed:', error.message);
        return { isAvailable: false, error: error.message };
      }

      const isAvailable = !data;
      logger.debug(`✅ Username "${validation.sanitized}" availability:`, isAvailable ? 'AVAILABLE' : 'TAKEN');
      
      return { isAvailable, error: null };
    } catch (error) {
      logger.error('❌ Error checking username availability:', error.message);
      return { isAvailable: false, error: error.message };
    }
  }

  /**
   * 고유한 사용자명 생성
   */
  async generateUniqueUsername(baseUsername, attempt = 1) {
    try {
      const validation = ValidationUtils.validateUsername(baseUsername);
      if (!validation.isValid) {
        throw new Error(`Invalid base username: ${validation.error}`);
      }

      const candidateUsername = attempt === 1 
        ? validation.sanitized 
        : `${validation.sanitized}${attempt}`;

      logger.debug('🔍 Checking username candidate:', candidateUsername);

      const { data, error } = await this.supabase
        .from('profiles')
        .select('username')
        .eq('username', candidateUsername)
        .maybeSingle();

      if (error) {
        logger.error('❌ Username uniqueness check error:', error.message);
        return `${validation.sanitized}_${Date.now()}`; // Fallback to timestamp
      }

      if (!data) {
        logger.debug('✅ Unique username found:', candidateUsername);
        return candidateUsername;
      }

      // Username is taken, try next number
      if (attempt > 100) {
        // Prevent infinite loop, use timestamp fallback
        return `${validation.sanitized}_${Date.now()}`;
      }

      return await this.generateUniqueUsername(baseUsername, attempt + 1);
    } catch (error) {
      logger.error('❌ Error generating unique username:', error.message);
      const validation = ValidationUtils.validateUsername(baseUsername);
      return `${validation.sanitized || 'user'}_${Date.now()}`; // Fallback to timestamp
    }
  }

  /**
   * README 업데이트 - RLS 안전
   */
  async updateReadme(userId, readmeTitle, readmeContent) {
    try {
      logger.debug('📝 Updating README for user:', userId);

      // 입력 검증
      const userValidation = ValidationUtils.validateUUID(userId);
      if (!userValidation.isValid) {
        throw new Error(`Invalid userId: ${userValidation.error}`);
      }

      const titleValidation = ValidationUtils.validateTextContent(readmeTitle, 100);
      const contentValidation = ValidationUtils.validateTextContent(readmeContent, 5000);

      if (!titleValidation.isValid) {
        throw new Error(`Invalid README title: ${titleValidation.error}`);
      }

      if (!contentValidation.isValid) {
        throw new Error(`Invalid README content: ${contentValidation.error}`);
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          readme_title: titleValidation.sanitized,
          readme_content: contentValidation.sanitized,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userValidation.sanitized)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('✅ README updated successfully');
      return { data, error: null };
    } catch (error) {
      logger.error('❌ Error updating README:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 아바타 업로드 및 URL 업데이트
   */
  async uploadAvatar(userId, imageUri, imageName) {
    try {
      logger.debug('📸 Uploading avatar for user:', userId);

      // 입력 검증
      const userValidation = ValidationUtils.validateUUID(userId);
      if (!userValidation.isValid) {
        throw new Error(`Invalid userId: ${userValidation.error}`);
      }

      if (!imageUri || typeof imageUri !== 'string') {
        throw new Error('Invalid image URI');
      }

      // 이미지 이름 sanitization
      const sanitizedName = imageName
        ? String(imageName).replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 100)
        : `avatar_${Date.now()}.jpg`;

      // Supabase Storage에 업로드
      const fileName = `avatars/${userValidation.sanitized}/${sanitizedName}`;
      
      // 기존 파일이 있다면 삭제
      await this.supabase.storage
        .from('avatars')
        .remove([fileName]);

      // 새 이미지 업로드
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(fileName, {
          uri: imageUri,
          type: 'image/jpeg',
          name: sanitizedName,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 공개 URL 생성
      const { data: urlData } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 프로필에 아바타 URL 업데이트
      const updateResult = await this.updateProfile(userId, {
        avatar_url: urlData.publicUrl
      });

      if (updateResult.error) {
        throw new Error(updateResult.error);
      }

      logger.info('✅ Avatar uploaded and profile updated successfully');
      return { 
        data: {
          ...updateResult.data,
          avatar_url: urlData.publicUrl
        }, 
        error: null 
      };
    } catch (error) {
      logger.error('❌ Error uploading avatar:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 모든 사용자 프로필 조회 (관리자 전용)
   * SecurityManager를 통한 안전한 접근
   */
  async getAllUsers() {
    try {
      logger.debug('👥 Getting all users (admin operation)');

      // 현재 사용자가 관리자인지 확인
      const { data: currentUser, error: userError } = await this.supabase.auth.getUser();
      if (userError || !currentUser?.user) {
        throw new Error('Authentication required for admin operations');
      }

      // SecurityManager를 통한 admin 작업
      const adminClient = await SecurityManager.initAdminClient();
      
      const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
      if (authError) {
        throw authError;
      }

      const { data: profiles, error: profilesError } = await adminClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      logger.info('✅ All users retrieved successfully');
      return { 
        data: {
          authUsers: authUsers.users || [],
          profiles: profiles || []
        }, 
        error: null 
      };
    } catch (error) {
      logger.error('❌ Error getting all users:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 프로필 통계 조회
   */
  async getProfileStats(userId) {
    try {
      logger.debug('📊 Getting profile stats for user:', userId);

      const userValidation = ValidationUtils.validateUUID(userId);
      if (!userValidation.isValid) {
        throw new Error(`Invalid userId: ${userValidation.error}`);
      }

      // 병렬로 각종 통계 조회
      const [profileResult, notesResult, followersResult, followingResult] = await Promise.all([
        this.getProfile(userId),
        this.supabase.from('notes').select('id').eq('user_id', userId).eq('is_public', true),
        this.supabase.from('follows').select('id').eq('following_id', userId),
        this.supabase.from('follows').select('id').eq('follower_id', userId)
      ]);

      const stats = {
        profile: profileResult.data,
        publicNotesCount: notesResult.data?.length || 0,
        followersCount: followersResult.data?.length || 0,
        followingCount: followingResult.data?.length || 0
      };

      logger.debug('✅ Profile stats retrieved successfully');
      return { data: stats, error: null };
    } catch (error) {
      logger.error('❌ Error getting profile stats:', error.message);
      return { data: null, error: error.message };
    }
  }
}

// 싱글톤 인스턴스
const unifiedProfileService = new UnifiedProfileService();

export default unifiedProfileService;