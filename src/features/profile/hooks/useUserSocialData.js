/**
 * useUserSocialData - 소셜 기능 관련 훅 (팔로우, 언팔로우)
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import UnifiedFollowService from '../../../services/UnifiedFollowService';
import logger from '../../../utils/Logger';

export const useUserSocialData = (userProfile, profileData, isCurrentUser) => {
  const { user: currentUser } = useAuth();
  
  // 소셜 상태
  const [isFollowing, setIsFollowing] = useState(!!profileData?.followed_at);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowOptions, setShowFollowOptions] = useState(false);
  const [socialLoaded, setSocialLoaded] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  // 대상 사용자 ID 계산
  const targetUserId = useMemo(() => {
    return userProfile?.user_id || profileData?.user_id;
  }, [userProfile?.user_id, profileData?.user_id]);

  // 소셜 데이터 로드
  useEffect(() => {
    const loadSocialData = async () => {
      if (isCurrentUser || !targetUserId || socialLoaded) {
        return;
      }

      try {
        setSocialLoading(true);
        logger.debug('📊 Loading social stats for user:', targetUserId);

        // 팔로워/팔로잉 수 조회
        const [followersResult, followingResult, followStatusResult] = await Promise.all([
          UnifiedFollowService.getFollowersCount(targetUserId),
          UnifiedFollowService.getFollowingCount(targetUserId),
          currentUser?.id ? UnifiedFollowService.isFollowing(currentUser.id, targetUserId) : { success: true, isFollowing: false }
        ]);

        // 팔로워 수 설정
        if (followersResult.success) {
          setFollowersCount(followersResult.count);
          logger.debug('👥 Followers count loaded:', followersResult.count);
        }

        // 팔로잉 수 설정
        if (followingResult.success) {
          setFollowingCount(followingResult.count);
          logger.debug('👥 Following count loaded:', followingResult.count);
        }

        // 팔로우 상태 설정
        if (followStatusResult.success) {
          setIsFollowing(followStatusResult.data);
          logger.debug('👥 Follow status loaded:', followStatusResult.data);
        }

        setSocialLoaded(true);
        logger.debug('✅ Social data loaded successfully');
      } catch (error) {
        logger.error('❌ Error loading social data:', error.message);
        setFollowersCount(0);
        setFollowingCount(0);
        setIsFollowing(false);
      } finally {
        setSocialLoading(false);
      }
    };

    loadSocialData();
  }, [isCurrentUser, targetUserId, socialLoaded, currentUser?.id]);

  // 팔로우 토글
  const handleFollowPress = async () => {
    if (!currentUser?.id || !targetUserId) {
      logger.error('❌ Cannot follow: missing user IDs');
      return;
    }

    try {
      logger.debug('👥 Toggling follow status');
      
      // 낙관적 업데이트
      const originalFollowing = isFollowing;
      const originalCount = followersCount;
      
      setIsFollowing(!isFollowing);
      setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);

      // 실제 API 호출
      const result = await UnifiedFollowService.toggleFollow(currentUser.id, targetUserId);

      if (result.success) {
        setIsFollowing(result.isFollowing);
        logger.info('✅ Follow status updated:', result.isFollowing);
        
        // 팔로워 수 새로고침
        const followersResult = await UnifiedFollowService.getFollowersCount(targetUserId);
        if (followersResult.success) {
          setFollowersCount(followersResult.count);
        }
      } else {
        // 실패시 원래 상태로 복구
        setIsFollowing(originalFollowing);
        setFollowersCount(originalCount);
        logger.error('❌ Follow toggle failed:', result.error);
        throw new Error(result.error || 'Failed to update follow status');
      }
    } catch (error) {
      logger.error('❌ Follow press error:', error.message);
      throw error; // 상위 컴포넌트에서 에러 처리
    }
  };

  // 팔로잉 버튼 옵션 토글
  const handleFollowingButtonPress = () => {
    setShowFollowOptions(true);
  };

  // 언팔로우 확인
  const handleUnfollow = async () => {
    setShowFollowOptions(false);
    return handleFollowPress(); // 동일한 토글 로직 사용
  };

  // 뮤트 (향후 구현)
  const handleMute = () => {
    setShowFollowOptions(false);
    logger.info('👥 Mute functionality not yet implemented');
    // TODO: Implement mute functionality
  };

  // 옵션 메뉴 닫기
  const closeFollowOptions = () => {
    setShowFollowOptions(false);
  };

  return {
    // 상태
    isFollowing,
    followersCount,
    followingCount,
    showFollowOptions,
    socialLoaded,
    socialLoading,
    
    // 액션
    handleFollowPress,
    handleFollowingButtonPress,
    handleUnfollow,
    handleMute,
    closeFollowOptions,
    
    // 유틸리티
    canFollow: !isCurrentUser && !!currentUser?.id && !!targetUserId,
  };
};