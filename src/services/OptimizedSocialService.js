/**
 * OptimizedSocialService - 최적화된 소셜 서비스
 * 
 * 기존 social.js 개선사항:
 * - 캐싱 시스템 추가 (별표/포크 상태)
 * - 배치 처리 최적화
 * - 입력 검증 강화
 * - 에러 처리 개선
 * - 성능 최적화
 */

import { supabase } from './supabase';
import ValidationUtils from './ValidationUtils';
import logger from '../utils/Logger';

class OptimizedSocialService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3 * 60 * 1000; // 3분 캐시 (별표 상태는 자주 변경됨)
    this.maxCacheSize = 1000; // 소셜 상호작용은 많을 수 있음
    this.batchSize = 50;
    
    logger.debug('🔧 Initializing OptimizedSocialService');
  }

  /**
   * 캐시 관리
   */
  getCacheKey(operation, params) {
    return `social:${operation}:${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    if (Date.now() - timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`⚡ Social cache hit: ${key}`);
    return data;
  }

  setCache(key, data) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCacheForNote(noteId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`noteId":"${noteId}"`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    logger.debug(`🗑️ Cleared ${keysToDelete.length} cache entries for note: ${noteId}`);
  }

  clearCacheForUser(userId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`userId":"${userId}"`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    logger.debug(`🗑️ Cleared ${keysToDelete.length} cache entries for user: ${userId}`);
  }

  /**
   * 프로필 ID 조회 (캐시됨)
   */
  async getProfileId(userId) {
    try {
      const validation = ValidationUtils.validateUUID(userId);
      if (!validation.isValid) {
        return { success: false, data: null, error: `Invalid user ID: ${validation.error}` };
      }

      const sanitizedUserId = validation.sanitized;

      // 캐시 확인
      const cacheKey = this.getCacheKey('profileId', { userId: sanitizedUserId });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return { success: true, data: cached, error: null };
      }

      // DB 조회
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', sanitizedUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          logger.warn(`⚠️ Profile not found for user: ${sanitizedUserId}`);
          return { success: false, data: null, error: 'User profile not found' };
        }
        logger.error('❌ Error getting profile ID:', error);
        return { success: false, data: null, error: error.message };
      }

      // 캐시 저장 (프로필 ID는 자주 변경되지 않음)
      this.setCache(cacheKey, profile.id);
      
      return { success: true, data: profile.id, error: null };

    } catch (error) {
      logger.error('❌ Exception in getProfileId:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * 노트 별표 추가
   */
  async starNote(noteId, userId) {
    try {
      // 입력 검증
      const noteValidation = ValidationUtils.validateUUID(noteId);
      const userValidation = ValidationUtils.validateUUID(userId);
      
      if (!noteValidation.isValid) {
        return { success: false, data: null, error: `Invalid note ID: ${noteValidation.error}` };
      }
      
      if (!userValidation.isValid) {
        return { success: false, data: null, error: `Invalid user ID: ${userValidation.error}` };
      }

      const sanitizedNoteId = noteValidation.sanitized;
      const sanitizedUserId = userValidation.sanitized;

      // 프로필 ID 조회
      const profileResult = await this.getProfileId(sanitizedUserId);
      if (!profileResult.success) {
        return profileResult;
      }

      const profileId = profileResult.data;

      // 이미 별표했는지 확인
      const existingResult = await this.isNoteStarred(sanitizedNoteId, sanitizedUserId);
      if (existingResult.success && existingResult.data) {
        return { success: false, data: null, error: 'Note is already starred' };
      }

      // 별표 추가
      const { data, error } = await supabase
        .from('stars')
        .insert([{
          note_id: sanitizedNoteId,
          user_id: profileId
        }])
        .select()
        .single();

      if (error) {
        logger.error('❌ Error starring note:', error);
        return { success: false, data: null, error: error.message };
      }

      // 캐시 업데이트
      this.clearCacheForNote(sanitizedNoteId);
      this.clearCacheForUser(sanitizedUserId);

      logger.debug(`⭐ Starred note ${sanitizedNoteId} by user ${sanitizedUserId}`);
      return { success: true, data, error: null };

    } catch (error) {
      logger.error('❌ Exception in starNote:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * 노트 별표 제거
   */
  async unstarNote(noteId, userId) {
    try {
      // 입력 검증
      const noteValidation = ValidationUtils.validateUUID(noteId);
      const userValidation = ValidationUtils.validateUUID(userId);
      
      if (!noteValidation.isValid) {
        return { success: false, data: null, error: `Invalid note ID: ${noteValidation.error}` };
      }
      
      if (!userValidation.isValid) {
        return { success: false, data: null, error: `Invalid user ID: ${userValidation.error}` };
      }

      const sanitizedNoteId = noteValidation.sanitized;
      const sanitizedUserId = userValidation.sanitized;

      // 프로필 ID 조회
      const profileResult = await this.getProfileId(sanitizedUserId);
      if (!profileResult.success) {
        return profileResult;
      }

      const profileId = profileResult.data;

      // 별표 제거
      const { data, error } = await supabase
        .from('stars')
        .delete()
        .eq('note_id', sanitizedNoteId)
        .eq('user_id', profileId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Error unstarring note:', error);
        return { success: false, data: null, error: error.message };
      }

      // 캐시 업데이트
      this.clearCacheForNote(sanitizedNoteId);
      this.clearCacheForUser(sanitizedUserId);

      logger.debug(`⭐ Unstarred note ${sanitizedNoteId} by user ${sanitizedUserId}`);
      return { success: true, data, error: null };

    } catch (error) {
      logger.error('❌ Exception in unstarNote:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * 별표 상태 확인
   */
  async isNoteStarred(noteId, userId) {
    try {
      // 입력 검증
      const noteValidation = ValidationUtils.validateUUID(noteId);
      const userValidation = ValidationUtils.validateUUID(userId);
      
      if (!noteValidation.isValid) {
        return { success: false, data: false, error: `Invalid note ID: ${noteValidation.error}` };
      }
      
      if (!userValidation.isValid) {
        return { success: false, data: false, error: `Invalid user ID: ${userValidation.error}` };
      }

      const sanitizedNoteId = noteValidation.sanitized;
      const sanitizedUserId = userValidation.sanitized;

      // 캐시 확인
      const cacheKey = this.getCacheKey('isStarred', { noteId: sanitizedNoteId, userId: sanitizedUserId });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return { success: true, data: cached, error: null };
      }

      // 프로필 ID 조회
      const profileResult = await this.getProfileId(sanitizedUserId);
      if (!profileResult.success) {
        // 프로필이 없으면 별표하지 않은 것으로 간주
        return { success: true, data: false, error: null };
      }

      const profileId = profileResult.data;

      // DB 조회
      const { data, error } = await supabase
        .from('stars')
        .select('id')
        .eq('note_id', sanitizedNoteId)
        .eq('user_id', profileId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('❌ Error checking star status:', error);
        return { success: false, data: false, error: error.message };
      }

      const isStarred = !!data;
      
      // 캐시 저장
      this.setCache(cacheKey, isStarred);
      
      logger.debug(`✅ Star status check: ${sanitizedNoteId} by ${sanitizedUserId} = ${isStarred}`);
      return { success: true, data: isStarred, error: null };

    } catch (error) {
      logger.error('❌ Exception in isNoteStarred:', error);
      return { success: false, data: false, error: error.message };
    }
  }

  /**
   * 노트 별표 수 조회
   */
  async getNoteStarCount(noteId) {
    try {
      const validation = ValidationUtils.validateUUID(noteId);
      if (!validation.isValid) {
        return { success: false, count: 0, error: `Invalid note ID: ${validation.error}` };
      }

      const sanitizedNoteId = validation.sanitized;

      // 캐시 확인
      const cacheKey = this.getCacheKey('starCount', { noteId: sanitizedNoteId });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return { success: true, count: cached, error: null };
      }

      // DB 조회
      const { count, error } = await supabase
        .from('stars')
        .select('*', { count: 'exact', head: true })
        .eq('note_id', sanitizedNoteId);

      if (error) {
        logger.error('❌ Error getting star count:', error);
        return { success: false, count: 0, error: error.message };
      }

      const starCount = count || 0;
      
      // 캐시 저장
      this.setCache(cacheKey, starCount);
      
      logger.debug(`✅ Star count for ${sanitizedNoteId}: ${starCount}`);
      return { success: true, count: starCount, error: null };

    } catch (error) {
      logger.error('❌ Exception in getNoteStarCount:', error);
      return { success: false, count: 0, error: error.message };
    }
  }

  /**
   * 노트 포크
   */
  async forkNote(originalNoteId, userId, newNoteData = {}) {
    try {
      // 입력 검증
      const noteValidation = ValidationUtils.validateUUID(originalNoteId);
      const userValidation = ValidationUtils.validateUUID(userId);
      
      if (!noteValidation.isValid) {
        return { success: false, data: null, error: `Invalid note ID: ${noteValidation.error}` };
      }
      
      if (!userValidation.isValid) {
        return { success: false, data: null, error: `Invalid user ID: ${userValidation.error}` };
      }

      const sanitizedNoteId = noteValidation.sanitized;
      const sanitizedUserId = userValidation.sanitized;

      // 원본 노트 조회
      const { data: originalNote, error: noteError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', sanitizedNoteId)
        .single();

      if (noteError) {
        logger.error('❌ Error getting original note:', noteError);
        return { success: false, data: null, error: 'Original note not found' };
      }

      // 프로필 ID 조회
      const profileResult = await this.getProfileId(sanitizedUserId);
      if (!profileResult.success) {
        return profileResult;
      }

      const profileId = profileResult.data;

      // 포크된 노트 생성
      const forkedNoteData = {
        title: newNoteData.title || `Fork of ${originalNote.title}`,
        content: newNoteData.content || originalNote.content,
        author_id: profileId,
        is_public: newNoteData.is_public !== undefined ? newNoteData.is_public : false,
        original_note_id: sanitizedNoteId,
        ...newNoteData
      };

      const { data: forkedNote, error: forkError } = await supabase
        .from('notes')
        .insert([forkedNoteData])
        .select()
        .single();

      if (forkError) {
        logger.error('❌ Error creating forked note:', forkError);
        return { success: false, data: null, error: forkError.message };
      }

      // 원본 노트의 포크 수 업데이트
      await this.incrementForkCount(sanitizedNoteId);

      // 캐시 클리어
      this.clearCacheForNote(sanitizedNoteId);
      this.clearCacheForUser(sanitizedUserId);

      logger.debug(`🍴 Forked note ${sanitizedNoteId} to ${forkedNote.id} by user ${sanitizedUserId}`);
      return { success: true, data: forkedNote, error: null };

    } catch (error) {
      logger.error('❌ Exception in forkNote:', error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * 포크 수 증가
   */
  async incrementForkCount(noteId) {
    try {
      const { error } = await supabase.rpc('increment_fork_count', {
        note_id: noteId
      });

      if (error) {
        logger.error('❌ Error incrementing fork count:', error);
        // 포크 수 업데이트 실패는 치명적이지 않으므로 로그만 남김
      }

      // 캐시 클리어
      this.clearCacheForNote(noteId);

    } catch (error) {
      logger.error('❌ Exception in incrementForkCount:', error);
    }
  }

  /**
   * 배치 별표 상태 확인
   */
  async batchCheckStarStatus(userId, noteIds) {
    try {
      const userValidation = ValidationUtils.validateUUID(userId);
      if (!userValidation.isValid) {
        return { success: false, data: {}, error: `Invalid user ID: ${userValidation.error}` };
      }

      const sanitizedUserId = userValidation.sanitized;

      if (!Array.isArray(noteIds) || noteIds.length === 0) {
        return { success: true, data: {}, error: null };
      }

      // UUID 검증
      const validNoteIds = [];
      for (const noteId of noteIds) {
        const validation = ValidationUtils.validateUUID(noteId);
        if (validation.isValid) {
          validNoteIds.push(validation.sanitized);
        }
      }

      if (validNoteIds.length === 0) {
        return { success: true, data: {}, error: null };
      }

      // 프로필 ID 조회
      const profileResult = await this.getProfileId(sanitizedUserId);
      if (!profileResult.success) {
        // 프로필이 없으면 모든 노트가 별표되지 않은 것으로 간주
        const results = {};
        validNoteIds.forEach(noteId => {
          results[noteId] = false;
        });
        return { success: true, data: results, error: null };
      }

      const profileId = profileResult.data;
      const results = {};

      // 배치 크기로 나누어 처리
      for (let i = 0; i < validNoteIds.length; i += this.batchSize) {
        const batch = validNoteIds.slice(i, i + this.batchSize);
        
        const { data, error } = await supabase
          .from('stars')
          .select('note_id')
          .eq('user_id', profileId)
          .in('note_id', batch);

        if (error) {
          logger.error('❌ Error in batch star check:', error);
          return { success: false, data: {}, error: error.message };
        }

        // 결과 매핑
        const starredSet = new Set(data.map(row => row.note_id));
        batch.forEach(noteId => {
          results[noteId] = starredSet.has(noteId);
        });
      }

      logger.debug(`✅ Batch star check completed for ${validNoteIds.length} notes`);
      return { success: true, data: results, error: null };

    } catch (error) {
      logger.error('❌ Exception in batchCheckStarStatus:', error);
      return { success: false, data: {}, error: error.message };
    }
  }

  /**
   * 사용자 별표한 노트 목록
   */
  async getUserStarredNotes(userId, options = {}) {
    try {
      const validation = ValidationUtils.validateUUID(userId);
      if (!validation.isValid) {
        return { success: false, data: [], error: `Invalid user ID: ${validation.error}` };
      }

      const sanitizedUserId = validation.sanitized;
      const { limit = 20, offset = 0 } = options;

      // 프로필 ID 조회
      const profileResult = await this.getProfileId(sanitizedUserId);
      if (!profileResult.success) {
        return { success: true, data: [], error: null };
      }

      const profileId = profileResult.data;

      // 캐시 확인 (제한적으로)
      const cacheKey = this.getCacheKey('starredNotes', { userId: sanitizedUserId, limit, offset });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null && limit <= 10) { // 작은 요청만 캐시
        return { success: true, data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('stars')
        .select(`
          note_id,
          created_at,
          notes (
            id,
            title,
            content,
            is_public,
            created_at,
            star_count,
            fork_count,
            author_id,
            profiles:profiles!notes_author_id_fkey (
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('❌ Error getting starred notes:', error);
        return { success: false, data: [], error: error.message };
      }

      // 데이터 정규화
      const starredNotes = data
        .filter(star => star.notes) // 삭제된 노트 제외
        .map(star => ({
          ...star.notes,
          starred_at: star.created_at,
          author: star.notes.profiles
        }));

      // 작은 결과만 캐시
      if (starredNotes.length <= 10) {
        this.setCache(cacheKey, starredNotes);
      }

      logger.debug(`✅ Got ${starredNotes.length} starred notes for ${sanitizedUserId}`);
      return { success: true, data: starredNotes, error: null };

    } catch (error) {
      logger.error('❌ Exception in getUserStarredNotes:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * 캐시 상태 조회 (디버깅용)
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      timeout: this.cacheTimeout
    };
  }

  /**
   * 소셜 활동 피드 조회 (Explore 화면용)
   */
  async getActivityFeed(userId = null, limit = 20, offset = 0) {
    try {
      logger.debug('🔄 Getting activity feed');

      // 캐시 확인
      const cacheKey = this.getCacheKey('activityFeed', { userId, limit, offset });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null && offset === 0) {
        return { success: true, data: cached, error: null };
      }

      // 최신 공개 노트들 조회
      let query = supabase
        .from('notes')
        .select(`
          id,
          title,
          content,
          is_public,
          created_at,
          updated_at,
          star_count,
          fork_count,
          user_id
        `)
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // 특정 사용자 피드인 경우
      if (userId) {
        const userValidation = ValidationUtils.validateUUID(userId);
        if (userValidation.isValid) {
          query = query.eq('user_id', userValidation.sanitized);
        }
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Error getting activity feed:', error);
        return { success: false, data: [], error: error.message };
      }

      const activityFeed = data || [];

      // 각 노트의 작성자 프로필 정보 추가
      if (activityFeed.length > 0) {
        const userIds = [...new Set(activityFeed.map(note => note.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url')
          .in('user_id', userIds);

        // 프로필 정보를 노트에 매핑
        activityFeed.forEach(note => {
          const profile = profilesData?.find(p => p.user_id === note.user_id);
          if (profile) {
            note.profiles = profile;
            note.author = {
              id: profile.id,
              name: profile.username,
              username: profile.username,
              avatar_url: profile.avatar_url
            };
          }
        });
      }

      // 첫 페이지만 캐시
      if (offset === 0 && activityFeed.length > 0) {
        this.setCache(cacheKey, activityFeed);
      }

      logger.debug(`✅ Got ${activityFeed.length} activity feed items`);
      return { success: true, data: activityFeed, error: null };

    } catch (error) {
      logger.error('❌ Exception in getActivityFeed:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * 별표 수 조회 (레거시 호환)
   */
  async getStarCount(noteId) {
    const result = await this.getNoteStarCount(noteId);
    return { data: result.count, error: result.error };
  }

  /**
   * 포크 수 조회
   */
  async getForkCount(noteId) {
    try {
      const validation = ValidationUtils.validateUUID(noteId);
      if (!validation.isValid) {
        return { data: 0, error: `Invalid note ID: ${validation.error}` };
      }

      const sanitizedNoteId = validation.sanitized;

      // 캐시 확인
      const cacheKey = this.getCacheKey('forkCount', { noteId: sanitizedNoteId });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        return { data: cached, error: null };
      }

      // DB에서 fork_count 직접 조회
      const { data, error } = await supabase
        .from('notes')
        .select('fork_count')
        .eq('id', sanitizedNoteId)
        .single();

      if (error) {
        logger.error('❌ Error getting fork count:', error);
        return { data: 0, error: error.message };
      }

      const forkCount = data?.fork_count || 0;
      
      // 캐시 저장
      this.setCache(cacheKey, forkCount);
      
      logger.debug(`✅ Fork count for ${sanitizedNoteId}: ${forkCount}`);
      return { data: forkCount, error: null };

    } catch (error) {
      logger.error('❌ Exception in getForkCount:', error);
      return { data: 0, error: error.message };
    }
  }

  /**
   * 별표 상태 확인 (레거시 호환)
   */
  async checkStarStatus(noteId, userId) {
    const result = await this.isNoteStarred(noteId, userId);
    return { data: result.data, error: result.error };
  }

  /**
   * 인기 작성자 목록 조회
   */
  async getPopularAuthors(limit = 10, offset = 0) {
    try {
      logger.debug('👥 Getting popular authors');

      // 캐시 확인
      const cacheKey = this.getCacheKey('popularAuthors', { limit, offset });
      const cached = this.getFromCache(cacheKey);
      if (cached !== null && offset === 0) {
        return { success: true, data: cached, error: null };
      }

      // 공개 노트 작성자들을 조회 (간단한 방법)
      const { data: notesData, error } = await supabase
        .from('notes')
        .select('user_id')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 사용자별 노트 수 계산
      const userNoteCounts = {};
      notesData?.forEach(note => {
        userNoteCounts[note.user_id] = (userNoteCounts[note.user_id] || 0) + 1;
      });

      // 노트 수 기준으로 정렬
      const sortedUserIds = Object.entries(userNoteCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(offset, offset + limit)
        .map(([userId, count]) => ({ user_id: userId, note_count: count }));

      // 프로필 정보 조회
      const authors = [];
      if (sortedUserIds.length > 0) {
        const userIds = sortedUserIds.map(item => item.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url, bio')
          .in('user_id', userIds);

        // 프로필 정보와 노트 수 결합
        sortedUserIds.forEach(item => {
          const profile = profilesData?.find(p => p.user_id === item.user_id);
          if (profile) {
            authors.push({
              ...profile,
              note_count: item.note_count,
              public_notes: item.note_count
            });
          }
        });
      }

      // 첫 페이지만 캐시
      if (offset === 0 && authors.length > 0) {
        this.setCache(cacheKey, authors);
      }

      logger.debug(`✅ Got ${authors.length} popular authors`);
      return { success: true, data: authors, error: null };

    } catch (error) {
      logger.error('❌ Exception in getPopularAuthors:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * 전체 캐시 클리어
   */
  clearAllCache() {
    this.cache.clear();
    logger.debug('🗑️ Cleared all social cache');
  }
}

// 싱글톤 인스턴스 생성
const optimizedSocialService = new OptimizedSocialService();

export default optimizedSocialService;