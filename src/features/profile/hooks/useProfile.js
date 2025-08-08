import { useAuth } from '../../../contexts/AuthContext';
import { useProfileData } from './useProfileData';
import { useReadmeData } from './useReadmeData';
import { useSocialData } from './useSocialData';
import { useProfileNotes } from './useProfileNotes';
import { useProfilePhoto } from './useProfilePhoto';

/**
 * 통합 프로필 훅 (Facade Pattern)
 * 모든 프로필 관련 기능을 하나의 인터페이스로 제공
 * 
 * @param {string} userId - 조회할 사용자 ID (없으면 현재 사용자)
 * @returns {Object} 모든 프로필 관련 데이터와 액션들
 */
export const useProfile = (userId = null) => {
  const { user } = useAuth();
  const currentUserId = userId || user?.id;
  
  // 개별 훅들 사용
  const profileData = useProfileData(currentUserId);
  const readmeData = useReadmeData(currentUserId, profileData.isOwnProfile);
  const socialData = useSocialData(currentUserId, user?.id);
  const notesData = useProfileNotes(currentUserId, profileData.displayUsername);
  const profilePhoto = useProfilePhoto(currentUserId, profileData.isOwnProfile);

  // 전체 로딩 상태
  const isLoading = profileData.loading || socialData.loading || notesData.loading;
  
  // 전체 에러 상태
  const hasError = Boolean(
    profileData.error || 
    readmeData.error || 
    socialData.error || 
    notesData.error || 
    profilePhoto.error
  );

  // 에러 메시지 수집
  const errors = [
    profileData.error,
    readmeData.error,
    socialData.error,
    notesData.error,
    profilePhoto.error,
  ].filter(Boolean);

  // 모든 에러 클리어
  const clearAllErrors = () => {
    profileData.clearError();
    readmeData.clearError();
    socialData.clearError();
    notesData.clearError();
    profilePhoto.clearError();
  };

  // 전체 데이터 새로고침
  const refreshAll = async () => {
    await Promise.all([
      profileData.refetchProfile(),
      readmeData.reloadData(),
      socialData.refreshSocialData(),
      notesData.refreshHighlightNotes(),
      profilePhoto.reloadProfilePhoto(),
    ]);
  };

  return {
    // 통합 상태
    isLoading,
    hasError,
    errors,
    currentUserId,
    
    // 프로필 기본 데이터
    profile: {
      ...profileData,
      photo: profilePhoto.profilePhoto,
    },
    
    // README 데이터
    readme: readmeData,
    
    // 소셜 데이터
    social: socialData,
    
    // 노트 데이터
    notes: notesData,
    
    // 프로필 사진
    photo: profilePhoto,
    
    // 통합 액션들
    actions: {
      // 전체 새로고침
      refreshAll,
      clearAllErrors,
      
      // 프로필 액션들
      updateProfile: profileData.updateProfileData,
      updateProfilePhoto: profileData.updateProfilePhoto,
      
      // README 액션들
      toggleReadmeEdit: readmeData.toggleEditMode,
      saveReadme: readmeData.handleSave,
      cancelReadmeEdit: readmeData.cancelEdit,
      
      // 소셜 액션들
      toggleFollow: socialData.toggleFollow,
      
      // 노트 액션들
      toggleNoteStar: notesData.handleStarToggle,
      refreshNotes: notesData.refreshHighlightNotes,
      
      // 프로필 사진 액션들
      changeProfilePhoto: profilePhoto.showImagePicker,
    },
    
    // 계산된 값들
    computed: {
      isOwnProfile: profileData.isOwnProfile,
      canFollow: socialData.canFollow,
      displayUsername: profileData.displayUsername,
      totalStars: notesData.notesStats.totalStars,
      notesCount: notesData.notesStats.myNotesCount,
      starredCount: notesData.notesStats.starredNotesCount,
    },
  };
};