/**
 * SocialServiceMigration - 소셜 서비스 마이그레이션 래퍼
 * 
 * 기존 social.js를 OptimizedSocialService로 점진적 마이그레이션
 * 기존 API와의 호환성 보장
 */

import OptimizedSocialService from './OptimizedSocialService';
import logger from '../utils/Logger';

class SocialServiceMigration {
  constructor() {
    this.optimizedService = OptimizedSocialService;
    logger.debug('🔄 SocialService migrating to OptimizedSocialService');
  }

  // 기존 social.js 메서드들과 호환되는 인터페이스 제공

  async starNote(noteId, userId) {
    const result = await this.optimizedService.starNote(noteId, userId);
    // 기존 API 형식에 맞게 변환
    return {
      data: result.data,
      error: result.success ? null : result.error
    };
  }

  async unstarNote(noteId, userId) {
    const result = await this.optimizedService.unstarNote(noteId, userId);
    return {
      data: result.data,
      error: result.success ? null : result.error
    };
  }

  async isNoteStarred(noteId, userId) {
    const result = await this.optimizedService.isNoteStarred(noteId, userId);
    // 기존 API에서는 isStarred 키를 사용
    return {
      isStarred: result.data || false,
      error: result.success ? null : result.error
    };
  }

  async getNoteStarCount(noteId) {
    const result = await this.optimizedService.getNoteStarCount(noteId);
    return {
      count: result.count || 0,
      error: result.success ? null : result.error
    };
  }

  async forkNote(originalNoteId, userId, newNoteData = {}) {
    const result = await this.optimizedService.forkNote(originalNoteId, userId, newNoteData);
    return {
      data: result.data,
      error: result.success ? null : result.error
    };
  }

  async getUserStarredNotes(userId, options = {}) {
    const result = await this.optimizedService.getUserStarredNotes(userId, options);
    return {
      data: result.data || [],
      error: result.success ? null : result.error
    };
  }

  // 새로운 최적화된 기능들
  async batchCheckStarStatus(userId, noteIds) {
    return this.optimizedService.batchCheckStarStatus(userId, noteIds);
  }

  getCacheStats() {
    return this.optimizedService.getCacheStats();
  }

  clearCache() {
    this.optimizedService.clearAllCache();
  }

  // 기존 social.js에 있던 다른 메서드들 (있다면)
  // 여기서는 별표 관련 메서드만 구현했지만, 다른 소셜 기능이 있다면 추가 가능
}

// 인스턴스 생성
const socialService = new SocialServiceMigration();

export default socialService;