/**
 * useFollowList - 팔로워/팔로잉 리스트 관리 훅
 * 팔로워/팔로잉 목록 로딩, 팔로우 상태 관리, 검색 등의 기능 제공
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import FollowService from '../../../services/followClient';
import logger from '../../../utils/Logger';

export const useFollowList = (userId, type = 'followers') => {
  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingStates, setFollowingStates] = useState({}); // 현재 유저의 팔로우 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === userId;

  // 사용자 목록 로딩
  const loadUserList = useCallback(async () => {
    try {
      setLoading(true);
      logger.debug('📋 Loading user list:', type, 'for user:', userId);

      let userList = [];
      if (type === 'followers') {
        const result = await FollowService.getFollowers(userId);
        userList = result.success ? result.data : [];
      } else {
        const result = await FollowService.getFollowing(userId);
        userList = result.success ? result.data : [];
      }

      setUsers(userList);

      // 현재 사용자의 각 유저에 대한 팔로잉 상태 확인
      if (currentUser && !isCurrentUser) {
        const followingStatus = {};
        for (const user of userList) {
          try {
            const status = await FollowService.isFollowing(currentUser.id, user.user_id || user.id);
            followingStatus[user.user_id || user.id] = status.data || false;
          } catch (error) {
            logger.warn('📋 Failed to check following status for:', user.username);
            followingStatus[user.user_id || user.id] = false;
          }
        }
        setFollowingStates(followingStatus);
      }

      logger.debug('📋 Loaded user list:', userList.length, 'users');
    } catch (error) {
      logger.error('📋 Failed to load user list:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [userId, type, currentUser, isCurrentUser]);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserList();
    setRefreshing(false);
  }, [loadUserList]);

  // 팔로우/언팔로우
  const toggleFollow = useCallback(async (targetUserId) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to follow users');
      return;
    }

    if (currentUser.id === targetUserId) {
      return; // 자신을 팔로우할 수 없음
    }

    try {
      const isCurrentlyFollowing = followingStates[targetUserId] || false;
      
      // 낙관적 업데이트
      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: !isCurrentlyFollowing
      }));

      let result;
      if (isCurrentlyFollowing) {
        result = await FollowService.unfollowUser(currentUser.id, targetUserId);
        logger.debug('👥 Unfollowed user:', targetUserId);
      } else {
        result = await FollowService.followUser(currentUser.id, targetUserId);
        logger.debug('👥 Followed user:', targetUserId);
      }

      if (!result.success) {
        // 실패시 롤백
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: isCurrentlyFollowing
        }));
        Alert.alert('Error', result.error || 'Failed to update follow status');
      }
    } catch (error) {
      logger.error('👥 Follow toggle failed:', error);
      // 롤백
      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: !followingStates[targetUserId]
      }));
      Alert.alert('Error', 'Failed to update follow status');
    }
  }, [currentUser, followingStates]);

  // 언팔로우 확인 다이얼로그
  const handleUnfollowConfirm = useCallback((targetUserId, username) => {
    Alert.alert(
      'Unfollow User',
      `Are you sure you want to unfollow ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: () => toggleFollow(targetUserId)
        }
      ]
    );
  }, [toggleFollow]);

  // 사용자 검색
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = users.filter(user => 
      user.username?.toLowerCase().includes(query.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered);
    logger.debug('🔍 Search results:', filtered.length, 'users for query:', query);
  }, [users]);

  // 표시할 사용자 목록 결정
  const displayUsers = useMemo(() => {
    return searchQuery.trim() ? searchResults : users;
  }, [users, searchResults, searchQuery]);

  // 사용자 제거 (팔로워에서 제거)
  const removeFollower = useCallback(async (followerUserId) => {
    if (!isCurrentUser || type !== 'followers') {
      return;
    }

    try {
      const result = await FollowService.removeFollower(userId, followerUserId);
      
      if (result.success) {
        setUsers(prev => prev.filter(user => 
          (user.user_id || user.id) !== followerUserId
        ));
        logger.debug('👥 Removed follower:', followerUserId);
      } else {
        Alert.alert('Error', result.error || 'Failed to remove follower');
      }
    } catch (error) {
      logger.error('👥 Failed to remove follower:', error);
      Alert.alert('Error', 'Failed to remove follower');
    }
  }, [isCurrentUser, type, userId]);

  // 뮤트 (팔로우는 유지하되 피드에서 숨김)
  const muteUser = useCallback(async (targetUserId) => {
    try {
      // TODO: Implement mute functionality
      logger.debug('🔇 Mute user:', targetUserId);
      Alert.alert('Info', 'Mute functionality will be implemented soon');
    } catch (error) {
      logger.error('🔇 Failed to mute user:', error);
      Alert.alert('Error', 'Failed to mute user');
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    loadUserList();
  }, [loadUserList]);

  return {
    // Data
    users,
    displayUsers,
    followingStates,
    
    // States
    loading,
    refreshing,
    searchQuery,
    searchResults,
    
    // User info
    currentUser,
    isCurrentUser,
    
    // Functions
    handleRefresh,
    toggleFollow,
    handleUnfollowConfirm,
    handleSearch,
    removeFollower,
    muteUser,
    
    // Utils
    getFollowButtonText: (targetUserId) => {
      return followingStates[targetUserId] ? 'Following' : 'Follow';
    },
    
    isFollowing: (targetUserId) => {
      return followingStates[targetUserId] || false;
    }
  };
};