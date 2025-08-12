/**
 * useExploreData - ExploreScreen 데이터 관리 훅
 * 소셜 피드, 공개 노트, 검색 결과를 통합 관리
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotesStore } from '../../../store/NotesStore';
import { useSocialStore } from '../../../store/SocialStore';
import { useAuth } from '../../../contexts/AuthContext';
import logger from '../../../utils/Logger';

export const useExploreData = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [refreshing, setRefreshing] = useState(false);
  const [realPublicNotes, setRealPublicNotes] = useState([]);

  const { user, profile } = useAuth();
  const notesStore = useNotesStore();
  const { globalPublicNotes, toggleStarred, isStarred } = notesStore;
  
  const {
    feed,
    feedLoading,
    loadFeed,
    refreshFeed,
    loadPopularAuthors,
    popularAuthors
  } = useSocialStore();

  // 데이터 소스 결정 (소셜 피드 우선, 실제 공개 노트 fallback)
  const exploreNotes = useMemo(() => {
    const notes = feed.length > 0 ? feed : realPublicNotes;
    logger.debug('🌍 ExploreData source:', feed.length > 0 ? 'Social Feed' : 'Real Public Notes', 
                 `(${notes.length} notes)`);
    return notes;
  }, [feed, realPublicNotes]);

  // 검색 기능
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    logger.debug('🔍 Searching for:', query);

    try {
      // 로컬 검색 (메모리에서)
      const localResults = exploreNotes.filter(note => 
        note.title?.toLowerCase().includes(query.toLowerCase()) ||
        note.content?.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(localResults);
      logger.debug('🔍 Local search results:', localResults.length);

      // TODO: 서버 검색 추가 (필요시)
      // const serverResults = await searchNotesFromServer(query);
      
    } catch (error) {
      logger.error('🔍 Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [exploreNotes]);

  // 카테고리 필터링
  const getFilteredNotes = useCallback((category) => {
    logger.debug('🏷️ Filtering by category:', category);
    
    switch (category) {
      case 'Trending':
        return exploreNotes
          .sort((a, b) => (b.star_count || b.starCount || 0) - (a.star_count || a.starCount || 0))
          .slice(0, 20);
      
      case 'Following':
        // TODO: 팔로잉 사용자의 노트만 필터링
        return exploreNotes.slice(0, 10);
      
      case 'Idea':
        return exploreNotes.filter(note => 
          note.title?.toLowerCase().includes('idea') || 
          note.content?.toLowerCase().includes('idea')
        );
      
      case 'Routine':
        return exploreNotes.filter(note => 
          note.title?.toLowerCase().includes('routine') || 
          note.content?.toLowerCase().includes('routine')
        );
      
      case 'Journal':
        return exploreNotes.filter(note => 
          note.title?.toLowerCase().includes('journal') || 
          note.content?.toLowerCase().includes('journal')
        );
      
      default:
        return exploreNotes;
    }
  }, [exploreNotes]);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    logger.debug('🔄 Refreshing explore data...');

    try {
      await Promise.all([
        refreshFeed(),
        loadPopularAuthors()
      ]);
      logger.debug('🔄 Refresh completed');
    } catch (error) {
      logger.error('🔄 Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshFeed, loadPopularAuthors]);

  // 노트 상호작용
  const handleToggleStar = useCallback(async (noteId) => {
    try {
      await toggleStarred(noteId);
      logger.debug('⭐ Toggled star for note:', noteId);
    } catch (error) {
      logger.error('⭐ Star toggle error:', error);
    }
  }, [toggleStarred]);

  // 초기 데이터 로딩
  useEffect(() => {
    if (feed.length === 0 && !feedLoading) {
      logger.debug('🌍 Loading initial explore data...');
      loadFeed();
      loadPopularAuthors();
    }
  }, [feed.length, feedLoading, loadFeed, loadPopularAuthors]);

  // 실제 공개 노트 로딩 (fallback용)
  useEffect(() => {
    if (globalPublicNotes.length > 0 && realPublicNotes.length === 0) {
      logger.debug('🌍 Setting real public notes as fallback');
      setRealPublicNotes(globalPublicNotes);
    }
  }, [globalPublicNotes, realPublicNotes.length]);

  return {
    // 상태
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    activeCategory,
    setActiveCategory,
    refreshing,
    feedLoading,
    
    // 데이터
    exploreNotes,
    popularAuthors,
    
    // 함수
    handleSearch,
    getFilteredNotes,
    handleRefresh,
    handleToggleStar,
    isStarred,
    
    // 사용자 정보
    user,
    profile
  };
};