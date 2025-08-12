/**
 * ProfileServiceMigration - 점진적 마이그레이션 래퍼
 * 기존 profiles.js와 profilesClient.js를 UnifiedProfileService로 점진적 전환
 */

import UnifiedProfileService from './UnifiedProfileService';
import logger from '../utils/Logger';

/**
 * 기존 ProfileService 대체 래퍼
 * 모든 기존 메서드를 UnifiedProfileService로 위임
 */
class ProfileServiceWrapper {
  constructor() {
    this.unified = UnifiedProfileService;
    logger.info('📦 ProfileService migration wrapper initialized');
  }

  // 기존 메서드들을 새로운 서비스로 위임
  async getProfile(userId) {
    logger.debug('🔄 Migrating getProfile call to UnifiedProfileService');
    const result = await this.unified.getProfile(userId);
    
    // 기존 형식과 호환성 유지
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data;
  }

  async createProfile(userId, username, avatarUrl = null, bio = null) {
    logger.debug('🔄 Migrating createProfile call to UnifiedProfileService');
    
    const profileData = {
      username,
      avatar_url: avatarUrl,
      bio
    };
    
    const result = await this.unified.createProfile(userId, profileData);
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  async updateProfile(userId, profileData) {
    logger.debug('🔄 Migrating updateProfile call to UnifiedProfileService');
    return await this.unified.updateProfile(userId, profileData);
  }

  async checkUsernameAvailability(username) {
    logger.debug('🔄 Migrating checkUsernameAvailability call to UnifiedProfileService');
    return await this.unified.checkUsernameAvailability(username);
  }

  async generateUniqueUsername(baseUsername, attempt = 1) {
    logger.debug('🔄 Migrating generateUniqueUsername call to UnifiedProfileService');
    return await this.unified.generateUniqueUsername(baseUsername, attempt);
  }

  async updateReadme(userId, readmeTitle, readmeContent) {
    logger.debug('🔄 Migrating updateReadme call to UnifiedProfileService');
    return await this.unified.updateReadme(userId, readmeTitle, readmeContent);
  }

  async uploadAvatar(userId, imageUri, imageName) {
    logger.debug('🔄 Migrating uploadAvatar call to UnifiedProfileService');
    return await this.unified.uploadAvatar(userId, imageUri, imageName);
  }

  async getAllUsers() {
    logger.debug('🔄 Migrating getAllUsers call to UnifiedProfileService');
    return await this.unified.getAllUsers();
  }

  // 추가 통계 메서드
  async getProfileStats(userId) {
    logger.debug('🔄 Migrating getProfileStats call to UnifiedProfileService');
    return await this.unified.getProfileStats(userId);
  }
}

/**
 * ProfileClientService 대체 래퍼  
 */
class ProfileClientServiceWrapper {
  constructor() {
    this.unified = UnifiedProfileService;
    logger.info('📦 ProfileClientService migration wrapper initialized');
  }

  async getProfile(userId) {
    logger.debug('🔄 Migrating ProfileClient.getProfile to UnifiedProfileService');
    const result = await this.unified.getProfile(userId);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data;
  }

  async updateProfile(userId, profileData) {
    logger.debug('🔄 Migrating ProfileClient.updateProfile to UnifiedProfileService');
    const result = await this.unified.updateProfile(userId, profileData);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data;
  }

  async createProfile(userId, profileData) {
    logger.debug('🔄 Migrating ProfileClient.createProfile to UnifiedProfileService');
    const result = await this.unified.createProfile(userId, profileData);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data;
  }

  async checkUsernameAvailability(username) {
    logger.debug('🔄 Migrating ProfileClient.checkUsernameAvailability to UnifiedProfileService');
    const result = await this.unified.checkUsernameAvailability(username);
    
    return {
      isAvailable: result.isAvailable,
      error: result.error
    };
  }

  async updateReadme(userId, readmeTitle, readmeContent) {
    logger.debug('🔄 Migrating ProfileClient.updateReadme to UnifiedProfileService');
    const result = await this.unified.updateReadme(userId, readmeTitle, readmeContent);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data;
  }

  // Missing method that AuthContext needs
  async checkUsernameAvailable(username) {
    logger.debug('🔄 Migrating ProfileClient.checkUsernameAvailable to UnifiedProfileService');
    const result = await this.unified.checkUsernameAvailability(username);
    
    // Return boolean for compatibility with AuthContext expectations
    return result.isAvailable;
  }

  // Convenience method for creating basic profile (used by AuthContext)
  async createBasicProfile(userId, profileData) {
    logger.debug('🔄 Migrating ProfileClient.createBasicProfile to UnifiedProfileService');
    const result = await this.unified.createProfile(userId, profileData);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.data;
  }
}

// 기존 export와 호환되는 인스턴스 생성
const profileService = new ProfileServiceWrapper();
const profileClientService = new ProfileClientServiceWrapper();

export { profileService as ProfileService };
export { profileClientService as ProfileClientService };

// 기본 export (기존 코드와의 호환성)
export default profileService;