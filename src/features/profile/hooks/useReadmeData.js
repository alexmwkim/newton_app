import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileService from '../../../services/profilesClient';

// Mock README 데이터 (기존 mockUser에서 가져옴)
const DEFAULT_README = {
  title: 'Hello world!',
  content: `## Welcome to my profile!

I'm a **developer** who loves to create amazing apps. Here's what I'm working on:

- Mobile app development with *React Native*
- Building user-friendly interfaces
- Always learning new technologies

### Current Projects
- [Newton App](https://github.com/newton) - A note-taking app
- Personal portfolio website

> "The best way to predict the future is to create it."

Feel free to check out my public notes below!`
};

/**
 * README 데이터 관리를 위한 커스텀 훅
 * - README 내용 로딩/저장
 * - 편집 모드 관리
 * - 로컬/원격 동기화
 */
export const useReadmeData = (userId, isOwnProfile = false) => {
  const [readmeData, setReadmeData] = useState({
    title: DEFAULT_README.title,
    content: DEFAULT_README.content,
    isEditing: false,
    editingTitle: DEFAULT_README.title,
    editingContent: DEFAULT_README.content,
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // README 데이터 로드
  const loadReadmeData = useCallback(async () => {
    if (!userId) return;

    try {
      // 로컬 스토리지에서 먼저 확인
      const localKey = `readme_${userId}`;
      const localData = await AsyncStorage.getItem(localKey);
      
      if (localData) {
        const parsed = JSON.parse(localData);
        setReadmeData(prev => ({
          ...prev,
          title: parsed.title || DEFAULT_README.title,
          content: parsed.content || DEFAULT_README.content,
          editingTitle: parsed.title || DEFAULT_README.title,
          editingContent: parsed.content || DEFAULT_README.content,
        }));
      }

      // 원격에서 최신 데이터 가져오기 (향후 구현)
      // const remoteData = await ProfileService.getReadme(userId);
      // if (remoteData) {
      //   setReadmeData(prev => ({ ...prev, ...remoteData }));
      // }

    } catch (err) {
      console.error('README load error:', err);
      setError('Failed to load README data');
    }
  }, [userId]);

  // README 저장
  const saveReadmeData = useCallback(async (title, content) => {
    if (!userId || !isOwnProfile) return false;

    setSaving(true);
    setError(null);

    try {
      const dataToSave = { title, content };
      
      // 로컬 스토리지에 저장
      const localKey = `readme_${userId}`;
      await AsyncStorage.setItem(localKey, JSON.stringify(dataToSave));
      
      // 상태 업데이트
      setReadmeData(prev => ({
        ...prev,
        title,
        content,
        editingTitle: title,
        editingContent: content,
        isEditing: false,
      }));

      // 원격 저장 (향후 구현)
      // await ProfileService.updateReadme(userId, dataToSave);

      return true;
    } catch (err) {
      console.error('README save error:', err);
      setError('Failed to save README');
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, isOwnProfile]);

  // 편집 모드 토글
  const toggleEditMode = useCallback(() => {
    setReadmeData(prev => ({
      ...prev,
      isEditing: !prev.isEditing,
      // 편집 취소 시 원래 값으로 되돌림
      editingTitle: prev.isEditing ? prev.title : prev.editingTitle,
      editingContent: prev.isEditing ? prev.content : prev.editingContent,
    }));
  }, []);

  // 편집 중인 내용 업데이트
  const updateEditingTitle = useCallback((title) => {
    setReadmeData(prev => ({ ...prev, editingTitle: title }));
  }, []);

  const updateEditingContent = useCallback((content) => {
    setReadmeData(prev => ({ ...prev, editingContent: content }));
  }, []);

  // 편집 저장
  const handleSave = useCallback(async () => {
    const success = await saveReadmeData(readmeData.editingTitle, readmeData.editingContent);
    return success;
  }, [readmeData.editingTitle, readmeData.editingContent, saveReadmeData]);

  // 편집 취소
  const cancelEdit = useCallback(() => {
    setReadmeData(prev => ({
      ...prev,
      isEditing: false,
      editingTitle: prev.title,
      editingContent: prev.content,
    }));
  }, []);

  useEffect(() => {
    loadReadmeData();
  }, [loadReadmeData]);

  return {
    // State
    readmeData,
    saving,
    error,
    
    // Actions
    toggleEditMode,
    updateEditingTitle,
    updateEditingContent,
    handleSave,
    cancelEdit,
    reloadData: loadReadmeData,
    clearError: () => setError(null),
  };
};