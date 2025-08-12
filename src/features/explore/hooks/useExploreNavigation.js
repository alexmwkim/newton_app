/**
 * useExploreNavigation - ExploreScreen 네비게이션 훅
 * 네비게이션 상태 관리 및 화면 전환 로직
 */

import { useState, useCallback } from 'react';
import logger from '../../../utils/Logger';

export const useExploreNavigation = (navigation) => {
  const [activeNavTab, setActiveNavTab] = useState(2); // Explore is index 2

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tabIndex) => {
    setActiveNavTab(tabIndex);
    logger.debug('🧭 Tab changed to:', tabIndex);

    switch (tabIndex) {
      case 0: // Home
        navigation.navigate('home');
        break;
      case 1: // Search  
        navigation.navigate('search');
        break;
      case 2: // Explore
        // 이미 Explore 화면이므로 아무것도 하지 않음
        break;
      case 3: // Profile
        navigation.navigate('profile');
        break;
      default:
        logger.warn('🧭 Unknown tab index:', tabIndex);
    }
  }, [navigation]);

  // 노트 상세로 이동
  const handleNotePress = useCallback((note) => {
    logger.debug('🗒️ Note pressed:', note.title || note.id);
    
    navigation.navigate('noteDetail', {
      noteId: note.id,
      returnToScreen: 'explore',
      // 노트 데이터를 함께 전달하여 빠른 로딩
      noteData: note
    });
  }, [navigation]);

  // 사용자 프로필로 이동
  const handleUserPress = useCallback((user) => {
    logger.debug('👤 User pressed:', user.username || user.id);
    
    navigation.navigate('userProfile', {
      userId: user.id || user.user_id,
      username: user.username,
      profileData: user,
      originScreen: 'explore'
    });
  }, [navigation]);

  // 검색 화면으로 이동
  const navigateToSearch = useCallback((query = '') => {
    logger.debug('🔍 Navigating to search with query:', query);
    
    navigation.navigate('search', {
      initialQuery: query,
      returnToScreen: 'explore'
    });
  }, [navigation]);

  // 카테고리별 노트 목록으로 이동
  const navigateToCategoryNotes = useCallback((category) => {
    logger.debug('🏷️ Navigating to category notes:', category);
    
    navigation.navigate('notesList', {
      listType: 'category',
      category: category,
      title: `${category} Notes`,
      originScreen: 'explore'
    });
  }, [navigation]);

  // 인기 작성자 목록으로 이동
  const navigateToPopularAuthors = useCallback(() => {
    logger.debug('👥 Navigating to popular authors');
    
    navigation.navigate('usersList', {
      listType: 'popular',
      title: 'Popular Authors',
      originScreen: 'explore'
    });
  }, [navigation]);

  return {
    // 상태
    activeNavTab,
    
    // 네비게이션 핸들러
    handleTabChange,
    handleNotePress,
    handleUserPress,
    navigateToSearch,
    navigateToCategoryNotes,
    navigateToPopularAuthors
  };
};