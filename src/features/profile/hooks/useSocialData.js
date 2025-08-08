import { useState, useEffect, useCallback } from 'react';
import FollowService from '../../../services/followClient';

/**
 * 소셜 기능 (팔로우/팔로워) 관리를 위한 커스텀 훅
 * - 팔로워/팔로잉 수 관리
 * - 팔로우/언팔로우 액션
 * - 실시간 상태 업데이트
 */
export const useSocialData = (userId, currentUserId) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // 소셜 데이터 로드
  const loadSocialData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // 팔로워/팔로잉 수 가져오기
      const [followersResult, followingResult, isFollowingResult] = await Promise.all([
        FollowService.getFollowerCount(userId),
        FollowService.getFollowingCount(userId),
        currentUserId && currentUserId !== userId 
          ? FollowService.isFollowing(currentUserId, userId)
          : Promise.resolve({ data: false, error: null })
      ]);

      if (followersResult.error) {
        console.error('Followers count error:', followersResult.error);
      } else {
        setFollowersCount(followersResult.data || 0);
      }

      if (followingResult.error) {
        console.error('Following count error:', followingResult.error);
      } else {
        setFollowingCount(followingResult.data || 0);
      }

      if (isFollowingResult.error) {
        console.error('Is following error:', isFollowingResult.error);
      } else {
        setIsFollowing(isFollowingResult.data || false);
      }

    } catch (err) {
      console.error('Social data load error:', err);
      setError('Failed to load social data');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId]);

  // 팔로우/언팔로우 토글
  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !userId || currentUserId === userId || actionLoading) return;

    setActionLoading(true);
    setError(null);

    try {
      let result;
      
      if (isFollowing) {
        // 언팔로우
        result = await FollowService.unfollowUser(currentUserId, userId);
        if (!result.error) {
          setIsFollowing(false);
          setFollowersCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // 팔로우
        result = await FollowService.followUser(currentUserId, userId);
        if (!result.error) {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
        }
      }

      if (result.error) {
        throw new Error(result.error.message || 'Follow operation failed');
      }

    } catch (err) {
      console.error('Follow toggle error:', err);
      setError(err.message);
      
      // 에러 발생 시 원래 상태로 되돌리기
      await loadSocialData();
    } finally {
      setActionLoading(false);
    }
  }, [currentUserId, userId, isFollowing, actionLoading, loadSocialData]);

  // 팔로워 수 업데이트 (외부에서 호출)
  const updateFollowersCount = useCallback((newCount) => {
    setFollowersCount(Math.max(0, newCount));
  }, []);

  // 팔로잉 수 업데이트 (외부에서 호출)
  const updateFollowingCount = useCallback((newCount) => {
    setFollowingCount(Math.max(0, newCount));
  }, []);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  return {
    // State
    followersCount,
    followingCount,
    isFollowing,
    loading,
    actionLoading,
    error,
    
    // Computed
    canFollow: currentUserId && userId && currentUserId !== userId,
    
    // Actions
    toggleFollow,
    updateFollowersCount,
    updateFollowingCount,
    refreshSocialData: loadSocialData,
    clearError: () => setError(null),
  };
};