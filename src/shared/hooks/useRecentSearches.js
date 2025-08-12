/**
 * useRecentSearches - 최근 검색 기록 관리 커스텀 훅
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 6;

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage에서 최근 검색 기록 로드
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setRecentSearches(parsed);
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentSearches();
  }, []);

  // AsyncStorage에 최근 검색 기록 저장
  const saveRecentSearches = async (searches) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  };

  // 새 검색어 추가
  const addRecentSearch = (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    
    const trimmedTerm = searchTerm.trim();
    
    setRecentSearches(prev => {
      // 이미 존재하는 검색어는 제거
      const filtered = prev.filter(
        search => search.toLowerCase() !== trimmedTerm.toLowerCase()
      );
      
      // 맨 앞에 추가하고 최대 개수로 제한
      const newRecent = [trimmedTerm, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      // AsyncStorage에 저장
      saveRecentSearches(newRecent);
      
      return newRecent;
    });
  };

  // 최근 검색 기록 전체 삭제
  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await saveRecentSearches([]);
  };

  return {
    recentSearches,
    isLoading,
    addRecentSearch,
    clearRecentSearches
  };
};