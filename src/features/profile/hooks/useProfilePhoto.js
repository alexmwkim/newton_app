import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ProfileStore from '../../../store/ProfileStore';
import ProfileService from '../../../services/profilesClient';
import { getConsistentAvatarUrl } from '../../../utils/avatarUtils';

/**
 * 프로필 사진 관리를 위한 커스텀 훅
 * - 이미지 선택 및 업로드
 * - 권한 관리
 * - 로컬 스토리지 동기화
 */
export const useProfilePhoto = (userId, isOwnProfile = false) => {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // 프로필 사진 로드
  const loadProfilePhoto = useCallback(async () => {
    try {
      // 로컬 스토어에서 프로필 사진 가져오기
      const storedPhoto = ProfileStore.getProfilePhoto();
      if (storedPhoto) {
        setProfilePhoto(getConsistentAvatarUrl(storedPhoto));
      }

      // 원격에서 최신 프로필 사진 가져오기 (필요시)
      if (userId && isOwnProfile) {
        const { data, error: fetchError } = await ProfileService.getProfile(userId);
        if (!fetchError && data?.avatar_url) {
          const avatarUrl = getConsistentAvatarUrl(data.avatar_url);
          setProfilePhoto(avatarUrl);
          ProfileStore.setProfilePhoto(avatarUrl);
        }
      }
    } catch (err) {
      console.error('Profile photo load error:', err);
      setError('Failed to load profile photo');
    }
  }, [userId, isOwnProfile]);

  // 카메라 권한 요청
  const requestCameraPermission = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.error('Camera permission error:', err);
      return false;
    }
  }, []);

  // 갤러리 권한 요청
  const requestGalleryPermission = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.error('Gallery permission error:', err);
      return false;
    }
  }, []);

  // 이미지 선택 및 업로드
  const selectAndUploadImage = useCallback(async (useCamera = false) => {
    if (!isOwnProfile) return;

    setError(null);
    
    try {
      // 권한 확인
      const hasPermission = useCamera 
        ? await requestCameraPermission()
        : await requestGalleryPermission();

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          `Please grant ${useCamera ? 'camera' : 'photo library'} permission to update your profile photo.`
        );
        return;
      }

      // 이미지 선택 옵션
      const imagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      };

      // 이미지 선택
      const result = useCamera
        ? await ImagePicker.launchCameraAsync(imagePickerOptions)
        : await ImagePicker.launchImageLibraryAsync(imagePickerOptions);

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const selectedImage = result.assets[0];
      setUploading(true);

      // 임시로 선택된 이미지 표시
      setProfilePhoto(selectedImage.uri);

      // 이미지 업로드 (실제 업로드 로직 구현 필요)
      const uploadResult = await uploadProfileImage(selectedImage.uri);
      
      if (uploadResult.success) {
        const newAvatarUrl = uploadResult.url;
        
        // 상태 업데이트
        setProfilePhoto(newAvatarUrl);
        
        // 로컬 스토어 업데이트
        ProfileStore.setProfilePhoto(newAvatarUrl);
        
        // 서버에 프로필 업데이트
        await ProfileService.updateProfile(userId, { 
          avatar_url: newAvatarUrl 
        });

        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }

    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to update profile photo');
      
      // 실패 시 이전 이미지로 되돌리기
      await loadProfilePhoto();
      
      Alert.alert(
        'Upload Failed', 
        'There was an error updating your profile photo. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  }, [isOwnProfile, userId, requestCameraPermission, requestGalleryPermission, loadProfilePhoto]);

  // 실제 이미지 업로드 함수 (향후 구현)
  const uploadProfileImage = useCallback(async (imageUri) => {
    // TODO: 실제 이미지 업로드 로직 구현
    // Supabase Storage 또는 다른 클라우드 스토리지에 업로드
    
    // 현재는 mock 응답
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          url: imageUri, // 실제로는 업로드된 이미지의 공개 URL
        });
      }, 2000);
    });
  }, []);

  // 프로필 사진 선택 액션 시트 표시
  const showImagePicker = useCallback(() => {
    if (!isOwnProfile) return;

    Alert.alert(
      'Change Profile Photo',
      'Choose how you would like to update your profile photo',
      [
        {
          text: 'Camera',
          onPress: () => selectAndUploadImage(true),
        },
        {
          text: 'Photo Library',
          onPress: () => selectAndUploadImage(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [isOwnProfile, selectAndUploadImage]);

  useEffect(() => {
    loadProfilePhoto();
  }, [loadProfilePhoto]);

  return {
    // State
    profilePhoto,
    uploading,
    error,
    
    // Actions
    showImagePicker,
    selectAndUploadImage,
    reloadProfilePhoto: loadProfilePhoto,
    clearError: () => setError(null),
    
    // Utils
    setProfilePhoto, // 외부에서 직접 설정할 때 사용
  };
};