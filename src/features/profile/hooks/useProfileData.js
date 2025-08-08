import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ProfileService from '../../../services/profilesClient';
import { getConsistentAvatarUrl, getConsistentUsername } from '../../../utils/avatarUtils';

/**
 * 프로필 데이터 관리를 위한 커스텀 훅
 * - 프로필 정보 로딩
 * - 아바타 URL 처리
 * - 사용자명 정규화
 */
export const useProfileData = (userId = null) => {
  const { user, profile } = useAuth();
  const currentUserId = userId || user?.id;
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // 프로필 데이터 페치
  const fetchProfileData = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      // 현재 사용자의 프로필이면 기존 profile 사용
      if (currentUserId === user?.id && profile) {
        const processedProfile = {
          ...profile,
          username: getConsistentUsername(profile),
          avatarUrl: getConsistentAvatarUrl(profile?.avatar_url),
        };
        setProfileData(processedProfile);
        setProfilePhoto(processedProfile.avatarUrl);
      } else {
        // 다른 사용자의 프로필 로드
        const { data, error: fetchError } = await ProfileService.getProfile(currentUserId);
        
        if (fetchError) {
          throw new Error(fetchError.message || 'Failed to fetch profile');
        }

        const processedProfile = {
          ...data,
          username: getConsistentUsername(data),
          avatarUrl: getConsistentAvatarUrl(data?.avatar_url),
        };
        
        setProfileData(processedProfile);
        setProfilePhoto(processedProfile.avatarUrl);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, user?.id, profile]);

  // 프로필 업데이트
  const updateProfileData = useCallback((updates) => {
    setProfileData(prev => prev ? { ...prev, ...updates } : updates);
  }, []);

  // 아바타 업데이트
  const updateProfilePhoto = useCallback((newPhotoUri) => {
    setProfilePhoto(newPhotoUri);
    updateProfileData({ avatarUrl: newPhotoUri });
  }, [updateProfileData]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  return {
    // State
    profileData,
    profilePhoto,
    loading,
    error,
    
    // Computed
    isOwnProfile: currentUserId === user?.id,
    displayUsername: profileData?.username || 'Unknown User',
    
    // Actions
    refetchProfile: fetchProfileData,
    updateProfileData,
    updateProfilePhoto,
    clearError: () => setError(null),
  };
};