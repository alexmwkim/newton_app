/**
 * OptimizedNotesService - 최적화된 노트 서비스
 * 
 * 개선사항:
 * - 캐싱 시스템 추가
 * - 배치 처리 최적화
 * - 메모리 사용량 최적화
 * - 에러 처리 개선
 * - 입력 검증 강화
 */

import { supabase } from './supabase';
import ValidationUtils from './ValidationUtils';
import logger from '../utils/Logger';

class OptimizedNotesService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
    this.maxCacheSize = 100; // 최대 캐시 항목 수
    this.batchSize = 50; // 배치 처리 크기
  }

  /**
   * 캐시 키 생성
   */
  getCacheKey(operation, params) {
    return `${operation}:${JSON.stringify(params)}`;
  }

  /**
   * 캐시에서 데이터 조회
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    const now = Date.now();

    if (now - timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`⚡ Cache hit: ${key}`);
    return data;
  }

  /**
   * 캐시에 데이터 저장
   */
  setCache(key, data) {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    logger.debug(`💾 Cached: ${key}`);
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      logger.debug('🗑️ Cache cleared completely');
      return;
    }

    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    logger.debug(`🗑️ Cache invalidated for pattern: ${pattern}`);
  }

  /**
   * 노트 생성 - 최적화된 버전
   */
  async createNote(noteData) {
    try {
      logger.info('💾 Creating new note');

      // 입력 검증
      const validationResult = ValidationUtils.validateNoteData({
        title: noteData.title,
        content: noteData.content || ''
      });

      if (!validationResult.isValid) {
        throw new Error(`Note validation failed: ${validationResult.errors.join(', ')}`);
      }

      // 사용자 검증
      const userValidation = ValidationUtils.validateUUID(noteData.userId);
      if (!userValidation.isValid) {
        throw new Error(`Invalid userId: ${userValidation.error}`);
      }

      const insertData = {
        title: validationResult.sanitized.title,
        content: validationResult.sanitized.content,
        is_public: noteData.isPublic || false,
        slug: noteData.slug || this.generateSlug(validationResult.sanitized.title),
        user_id: userValidation.sanitized,
        parent_note_id: noteData.parentNoteId || null,
        is_subpage: noteData.isSubpage || false,
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([insertData])
        .select('*')
        .single();

      if (error) throw error;

      // 캐시 무효화 (사용자 노트 목록)
      this.invalidateCache(`getUserNotes:${noteData.userId}`);
      this.invalidateCache('getPublicNotes');

      logger.info('✅ Note created successfully');
      return { data, error: null };
    } catch (error) {
      logger.error('❌ Error creating note:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 노트 업데이트 - 최적화된 버전
   */
  async updateNote(noteId, noteData) {
    try {
      logger.debug('✏️ Updating note:', noteId);

      // 입력 검증
      const noteIdValidation = ValidationUtils.validateUUID(noteId);
      if (!noteIdValidation.isValid) {
        throw new Error(`Invalid noteId: ${noteIdValidation.error}`);
      }

      const validationResult = ValidationUtils.validateNoteData(noteData);
      if (!validationResult.isValid) {
        throw new Error(`Note validation failed: ${validationResult.errors.join(', ')}`);
      }

      const updateData = {
        ...validationResult.sanitized,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteIdValidation.sanitized)
        .select('*')
        .single();

      if (error) throw error;

      // 관련 캐시 무효화
      this.invalidateCache(`getNote:${noteId}`);
      this.invalidateCache(`getUserNotes:${data.user_id}`);
      if (data.is_public) {
        this.invalidateCache('getPublicNotes');
      }

      logger.info('✅ Note updated successfully');
      return { data, error: null };
    } catch (error) {
      logger.error('❌ Error updating note:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 노트 조회 - 캐시 적용
   */
  async getNote(noteId) {
    try {
      logger.debug('📖 Getting note:', noteId);

      const noteIdValidation = ValidationUtils.validateUUID(noteId);
      if (!noteIdValidation.isValid) {
        throw new Error(`Invalid noteId: ${noteIdValidation.error}`);
      }

      // 캐시 확인
      const cacheKey = this.getCacheKey('getNote', { noteId: noteIdValidation.sanitized });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteIdValidation.sanitized)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Note not found' };
        }
        throw error;
      }

      // 캐시에 저장
      this.setCache(cacheKey, data);

      logger.debug('✅ Note retrieved successfully');
      return { data, error: null };
    } catch (error) {
      logger.error('❌ Error getting note:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 사용자 노트 목록 조회 - 최적화된 페이지네이션
   */
  async getUserNotes(userId, isPublicOnly = false, limit = 50, offset = 0) {
    try {
      logger.debug('📚 Getting user notes:', userId);

      const userValidation = ValidationUtils.validateUUID(userId);
      if (!userValidation.isValid) {
        throw new Error(`Invalid userId: ${userValidation.error}`);
      }

      // 캐시 확인
      const cacheKey = this.getCacheKey('getUserNotes', { 
        userId: userValidation.sanitized, 
        isPublicOnly, 
        limit, 
        offset 
      });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', userValidation.sanitized)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (isPublicOnly) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // 캐시에 저장 (첫 페이지만)
      if (offset === 0) {
        this.setCache(cacheKey, data);
      }

      logger.debug('✅ User notes retrieved successfully');
      return { data: data || [], error: null };
    } catch (error) {
      logger.error('❌ Error getting user notes:', error.message);
      return { data: [], error: error.message };
    }
  }

  /**
   * 공개 노트 목록 조회 - 최적화된 버전
   */
  async getPublicNotes(limit = 50, offset = 0) {
    try {
      logger.debug('🌍 Getting public notes');

      // 캐시 확인
      const cacheKey = this.getCacheKey('getPublicNotes', { limit, offset });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // 첫 페이지만 캐시
      if (offset === 0) {
        this.setCache(cacheKey, data);
      }

      logger.debug('✅ Public notes retrieved successfully');
      return { data: data || [], error: null };
    } catch (error) {
      logger.error('❌ Error getting public notes:', error.message);
      return { data: [], error: error.message };
    }
  }

  /**
   * 노트 검색 - 최적화된 전문 검색
   */
  async searchNotes(query, userId = null, limit = 20, offset = 0) {
    try {
      logger.debug('🔍 Searching notes:', query);

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return { data: [], error: 'Search query must be at least 2 characters' };
      }

      const sanitizedQuery = ValidationUtils.validateTextContent(query, 100);
      if (!sanitizedQuery.isValid) {
        throw new Error(`Invalid search query: ${sanitizedQuery.error}`);
      }

      let supabaseQuery = supabase
        .from('notes')
        .select('*')
        .or(`title.ilike.%${sanitizedQuery.sanitized}%,content.ilike.%${sanitizedQuery.sanitized}%`)
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        const userValidation = ValidationUtils.validateUUID(userId);
        if (userValidation.isValid) {
          supabaseQuery = supabaseQuery.eq('user_id', userValidation.sanitized);
        }
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      logger.debug('✅ Notes search completed');
      return { data: data || [], error: null };
    } catch (error) {
      logger.error('❌ Error searching notes:', error.message);
      return { data: [], error: error.message };
    }
  }

  /**
   * 노트 삭제 - 캐시 무효화 포함
   */
  async deleteNote(noteId) {
    try {
      logger.debug('🗑️ Deleting note:', noteId);

      const noteIdValidation = ValidationUtils.validateUUID(noteId);
      if (!noteIdValidation.isValid) {
        throw new Error(`Invalid noteId: ${noteIdValidation.error}`);
      }

      // 노트 정보 먼저 조회 (캐시 무효화용)
      const noteResult = await this.getNote(noteId);
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteIdValidation.sanitized);

      if (error) throw error;

      // 관련 캐시 무효화
      this.invalidateCache(`getNote:${noteId}`);
      if (noteResult.data) {
        this.invalidateCache(`getUserNotes:${noteResult.data.user_id}`);
        if (noteResult.data.is_public) {
          this.invalidateCache('getPublicNotes');
        }
      }

      logger.info('✅ Note deleted successfully');
      return { error: null };
    } catch (error) {
      logger.error('❌ Error deleting note:', error.message);
      return { error: error.message };
    }
  }

  /**
   * 배치 노트 처리 - 성능 최적화
   */
  async batchUpdateNotes(updates) {
    try {
      logger.debug('📦 Batch updating notes:', updates.length);

      if (!Array.isArray(updates) || updates.length === 0) {
        return { data: [], error: null };
      }

      const results = [];
      const chunks = [];

      // 배치 크기로 청크 분할
      for (let i = 0; i < updates.length; i += this.batchSize) {
        chunks.push(updates.slice(i, i + this.batchSize));
      }

      // 각 청크를 병렬 처리
      for (const chunk of chunks) {
        const promises = chunk.map(update => 
          this.updateNote(update.id, update.data)
        );
        
        const chunkResults = await Promise.allSettled(promises);
        results.push(...chunkResults);
      }

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`✅ Batch update completed: ${successful} success, ${failed} failed`);
      return { 
        data: results, 
        error: failed > 0 ? `${failed} operations failed` : null 
      };
    } catch (error) {
      logger.error('❌ Error in batch update:', error.message);
      return { data: [], error: error.message };
    }
  }

  /**
   * 슬러그 생성 - 최적화된 버전
   */
  generateSlug(title) {
    if (!title || typeof title !== 'string') {
      return `note-${Date.now()}`;
    }

    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // 특수문자 제거
      .replace(/[\s_-]+/g, '-') // 공백을 하이픈으로
      .replace(/^-+|-+$/g, '') // 시작/끝 하이픈 제거
      .substring(0, 50) || `note-${Date.now()}`; // 길이 제한
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      timeout: this.cacheTimeout,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 즐겨찾기 노트 조회 - 별표 표시된 노트들
   */
  async getStarredNotes(userId, limit = 50, offset = 0) {
    try {
      logger.debug('⭐ Getting starred notes for user:', userId);

      const userValidation = ValidationUtils.validateUUID(userId);
      if (!userValidation.isValid) {
        throw new Error(`Invalid userId: ${userValidation.error}`);
      }

      // 캐시 확인
      const cacheKey = this.getCacheKey('getStarredNotes', { 
        userId: userValidation.sanitized, 
        limit, 
        offset 
      });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      // First get the profile ID for the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userValidation.sanitized)
        .single();

      if (profileError) {
        logger.error('❌ Error getting user profile:', profileError.message);
        return { data: [], error: profileError.message };
      }

      const profileId = profileData.id;

      const { data, error } = await supabase
        .from('stars')
        .select(`
          created_at,
          notes!inner (
            id,
            title,
            content,
            is_public,
            user_id,
            created_at,
            updated_at,
            star_count,
            fork_count
          )
        `)
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // 노트 데이터만 추출
      const starredNotes = data?.map(item => ({
        ...item.notes,
        starred_at: item.created_at
      })) || [];

      // 각 노트의 작성자 프로필 정보 추가 (필요한 경우)
      if (starredNotes.length > 0) {
        const userIds = [...new Set(starredNotes.map(note => note.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, user_id, username, avatar_url')
          .in('user_id', userIds);

        // 프로필 정보를 노트에 매핑
        starredNotes.forEach(note => {
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
      if (offset === 0) {
        this.setCache(cacheKey, starredNotes);
      }

      logger.debug('✅ Starred notes retrieved successfully');
      return { data: starredNotes, error: null };
    } catch (error) {
      logger.error('❌ Error getting starred notes:', error.message);
      return { data: [], error: error.message };
    }
  }

  /**
   * 즐겨찾기 토글 - 별표 추가/제거
   */
  async toggleStarred(noteId, userId) {
    try {
      logger.debug('⭐ Toggling star for note:', noteId);

      const noteIdValidation = ValidationUtils.validateUUID(noteId);
      const userValidation = ValidationUtils.validateUUID(userId);
      
      if (!noteIdValidation.isValid) {
        throw new Error(`Invalid noteId: ${noteIdValidation.error}`);
      }
      if (!userValidation.isValid) {
        throw new Error(`Invalid userId: ${userValidation.error}`);
      }

      // First get the profile ID for the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userValidation.sanitized)
        .single();

      if (profileError) {
        throw new Error(`Profile not found: ${profileError.message}`);
      }

      const profileId = profileData.id;

      // 현재 별표 상태 확인
      const { data: existingStar } = await supabase
        .from('stars')
        .select('*')
        .eq('user_id', profileId)
        .eq('note_id', noteIdValidation.sanitized)
        .single();

      let isStarred = false;

      if (existingStar) {
        // 별표 제거
        const { error: deleteError } = await supabase
          .from('stars')
          .delete()
          .eq('user_id', profileId)
          .eq('note_id', noteIdValidation.sanitized);

        if (deleteError) throw deleteError;
        isStarred = false;
        logger.debug('⭐ Star removed');
      } else {
        // 별표 추가
        const { error: insertError } = await supabase
          .from('stars')
          .insert([{
            user_id: profileId,
            note_id: noteIdValidation.sanitized
          }]);

        if (insertError) throw insertError;
        isStarred = true;
        logger.debug('⭐ Star added');
      }

      // 관련 캐시 무효화
      this.invalidateCache(`getStarredNotes:${userId}`);

      logger.info('✅ Star toggle completed successfully');
      return { data: isStarred, error: null };
    } catch (error) {
      logger.error('❌ Error toggling star:', error.message);
      return { data: null, error: error.message };
    }
  }

  /**
   * 노트 별표 상태 확인
   */
  async isStarred(noteId, userId) {
    try {
      const noteIdValidation = ValidationUtils.validateUUID(noteId);
      const userValidation = ValidationUtils.validateUUID(userId);
      
      if (!noteIdValidation.isValid || !userValidation.isValid) {
        return { data: false, error: null };
      }

      // First get the profile ID for the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userValidation.sanitized)
        .single();

      if (profileError) {
        return { data: false, error: null };
      }

      const profileId = profileData.id;

      const { data, error } = await supabase
        .from('stars')
        .select('*')
        .eq('user_id', profileId)
        .eq('note_id', noteIdValidation.sanitized)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { data: !!data, error: null };
    } catch (error) {
      logger.error('❌ Error checking star status:', error.message);
      return { data: false, error: error.message };
    }
  }

  /**
   * 메모리 정리
   */
  cleanup() {
    this.cache.clear();
    logger.info('🧹 NotesService cleanup completed');
  }
}

// 싱글톤 인스턴스
const optimizedNotesService = new OptimizedNotesService();

export default optimizedNotesService;