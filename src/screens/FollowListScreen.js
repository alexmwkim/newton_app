import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { Spacing } from '../constants/StyleControl';
import Avatar from '../components/Avatar';
import UnifiedFollowService from '../services/UnifiedFollowService';
import { useAuth } from '../contexts/AuthContext';
import { UnifiedHeader } from '../shared/components/layout';

/**
 * FollowListScreen - 팔로워/팔로잉 유저 목록
 * Instagram/Twitter 스타일의 사용자 리스트 화면
 */
const FollowListScreen = ({ navigation, route }) => {
  const { userId, type, username } = route.params; // type: 'followers' | 'following'
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingStates, setFollowingStates] = useState({}); // 현재 유저의 팔로우 상태
  const [showFollowOptions, setShowFollowOptions] = useState(null); // 옵션 메뉴 표시할 유저 ID
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 }); // 메뉴 위치

  useEffect(() => {
    loadUserList();
  }, [userId, type]);

  const loadUserList = async () => {
    try {
      setLoading(true);
      
      console.log(`🔍 FOLLOW LIST: Loading ${type} for userId:`, userId);
      
      let userList = [];
      if (type === 'followers') {
        const result = await UnifiedFollowService.getFollowers(userId);
        console.log(`🔍 FOLLOW LIST: getFollowers result:`, { success: result.success, dataLength: result.data?.length, data: result.data });
        userList = result.success ? result.data : [];
      } else {
        const result = await UnifiedFollowService.getFollowing(userId);
        console.log(`🔍 FOLLOW LIST: getFollowing result:`, { success: result.success, dataLength: result.data?.length, data: result.data });
        userList = result.success ? result.data : [];
      }
      
      console.log(`🔍 FOLLOW LIST: Final userList length:`, userList.length);

      // 각 유저에 대한 현재 사용자의 팔로우 상태 확인 (병렬 처리)
      const followingStateMap = {};
      
      if (currentUser?.id) {
        const followingPromises = userList.map(user => {
          const targetUserId = user.user_id || user.follower_id || user.following_id;
          return UnifiedFollowService.isFollowing(currentUser.id, targetUserId)
            .then(result => {
              followingStateMap[targetUserId] = result.success ? result.data : false;
            })
            .catch(err => {
              console.warn(`Failed to check follow status for ${targetUserId}:`, err);
              followingStateMap[targetUserId] = false;
            });
        });
        
        await Promise.all(followingPromises);
      }
      
      setUsers(userList);
      setFollowingStates(followingStateMap);
    } catch (error) {
      console.error('Failed to load user list:', error);
      Alert.alert('Error', 'Failed to load user list');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserList();
    setRefreshing(false);
  };

  const handleFollowToggle = async (targetUserId) => {
    try {
      if (!currentUser?.id) {
        Alert.alert('Error', 'Please log in to follow users');
        return;
      }

      const isCurrentlyFollowing = followingStates[targetUserId];
      
      // 즉시 UI 업데이트 (낙관적 업데이트)
      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: !isCurrentlyFollowing
      }));

      // 언팔로우하는 경우 즉시 리스트에서 제거 (낙관적 업데이트)
      if (isCurrentlyFollowing && type === 'following') {
        setUsers(prevUsers => prevUsers.filter(user => {
          const userIdToCheck = user.user_id || user.follower_id || user.following_id;
          return userIdToCheck !== targetUserId;
        }));
      }

      const { success, isFollowing: newFollowingStatus, error } = await UnifiedFollowService.toggleFollow(currentUser.id, targetUserId);
      
      if (success) {
        // 팔로우 상태 업데이트
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: newFollowingStatus
        }));
        
        // 언팔로우한 경우: following 리스트에서 해당 유저 제거
        if (!newFollowingStatus && type === 'following') {
          setUsers(prevUsers => prevUsers.filter(user => {
            const userIdToCheck = user.user_id || user.follower_id || user.following_id;
            return userIdToCheck !== targetUserId;
          }));
          console.log(`✅ Removed user ${targetUserId} from following list via toggle`);
        }
      } else {
        // 에러 시 상태 되돌리기
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: isCurrentlyFollowing
        }));
        
        // 언팔로우 시도였다면 사용자를 다시 리스트에 추가 (롤백)
        if (isCurrentlyFollowing && type === 'following') {
          await loadUserList(); // 전체 리스트 다시 로드 (안전한 롤백)
        }
        
        console.error('Follow toggle failed:', error);
        Alert.alert('Error', 'Failed to update follow status');
      }
    } catch (error) {
      // 에러 시 상태 되돌리기
      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: followingStates[targetUserId]
      }));
      
      // 언팔로우 시도였다면 사용자를 다시 리스트에 추가 (롤백)
      if (isCurrentlyFollowing && type === 'following') {
        await loadUserList(); // 전체 리스트 다시 로드 (안전한 롤백)
      }
      
      console.error('Follow toggle failed:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleFollowingButtonPress = (targetUserId, event) => {
    if (event && event.nativeEvent) {
      // 버튼의 위치를 측정
      event.target.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({
          top: pageY + height + 5, // 버튼 아래쪽에 5px 간격
          right: 20 // 화면 오른쪽에서 20px 간격
        });
        setShowFollowOptions(targetUserId);
      });
    } else {
      // fallback 위치
      setMenuPosition({ top: 200, right: 20 });
      setShowFollowOptions(targetUserId);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    setShowFollowOptions(null);
    
    const targetUser = users.find(user => 
      (user.user_id || user.follower_id || user.following_id) === targetUserId
    );
    const targetUsername = targetUser?.username || targetUser?.profiles?.username || 'this user';
    
    Alert.alert(
      'Unfollow User',
      `Are you sure you want to unfollow ${targetUsername}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unfollow', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!currentUser?.id) {
                Alert.alert('Error', 'Please log in to unfollow users');
                return;
              }

              // 즉시 UI 업데이트 (낙관적 업데이트)
              setFollowingStates(prev => ({
                ...prev,
                [targetUserId]: false
              }));
              
              // 즉시 following 리스트에서 제거 (낙관적 업데이트)
              if (type === 'following') {
                setUsers(prevUsers => prevUsers.filter(user => {
                  const userIdToCheck = user.user_id || user.follower_id || user.following_id;
                  return userIdToCheck !== targetUserId;
                }));
              }

              const { success, error } = await UnifiedFollowService.toggleFollow(currentUser.id, targetUserId);

              if (success) {
                // 성공: 낙관적 업데이트가 이미 완료됨
                console.log(`✅ Successfully unfollowed user ${targetUserId}`);
              } else {
                // 에러 시 상태 되돌리기
                setFollowingStates(prev => ({
                  ...prev,
                  [targetUserId]: true
                }));
                
                // 리스트도 복구
                if (type === 'following') {
                  await loadUserList(); // 전체 리스트 다시 로드 (안전한 롤백)
                }
                
                console.error('Unfollow failed:', error);
                Alert.alert('Error', 'Failed to unfollow user');
              }
            } catch (error) {
              // 에러 시 상태 되돌리기
              setFollowingStates(prev => ({
                ...prev,
                [targetUserId]: true
              }));
              
              // 리스트도 복구
              if (type === 'following') {
                await loadUserList(); // 전체 리스트 다시 로드 (안전한 롤백)
              }
              
              console.error('Unfollow failed:', error);
              Alert.alert('Error', 'Failed to unfollow user');
            }
          }
        }
      ]
    );
  };

  const handleMute = (targetUserId) => {
    setShowFollowOptions(null);
    const targetUser = users.find(user => 
      (user.user_id || user.follower_id || user.following_id) === targetUserId
    );
    const targetUsername = targetUser?.username || targetUser?.profiles?.username || 'this user';
    
    Alert.alert(
      'Mute User',
      `Are you sure you want to mute ${targetUsername}? You will still follow them but won't see their posts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mute', 
          style: 'default',
          onPress: () => {
            console.log('👥 Muted user:', targetUsername);
            // TODO: Implement mute functionality
          }
        }
      ]
    );
  };

  const closeFollowOptions = () => {
    setShowFollowOptions(null);
  };

  const handleUserPress = (user) => {
    console.log('👤 User pressed:', user.username || user.id);
    
    // CRITICAL: Preserve the current navigation tab context
    // Get the tab info that was passed from the previous screen
    const currentTab = route.params?.originTab || route.params?.fromTab || 3; // Default to Profile tab
    
    console.log('🔍 FollowList tab context:', {
      originTab: route.params?.originTab,
      fromTab: route.params?.fromTab,
      usingTab: currentTab
    });
    
    navigation.navigate('userProfile', { 
      userId: user.id,
      username: user.username || user.full_name || 'User',
      profileData: {
        ...user,
        user_id: user.id, // CRITICAL: UserProfileScreen expects user_id field
        id: user.id
      },
      // PASS PRESERVED TAB: Maintain the tab context from original screen
      originTab: currentTab,
      fromTab: currentTab
    });
  };

  const renderUserItem = ({ item }) => {
    // UnifiedFollowService에서 반환하는 데이터 구조에 맞춰 userId 추출
    const userId = item.user_id || item.follower_id || item.following_id;
    const userProfile = item.profiles || item;
    const isFollowing = followingStates[userId];
    
    // 현재 사용자 자신인지 확인
    const isCurrentUser = userId === currentUser?.id;
    
    console.log('🔍 renderUserItem debug:', {
      userId,
      currentUserId: currentUser?.id,
      isCurrentUser,
      username: userProfile?.username,
      isFollowing
    });
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress({ ...userProfile, id: userId })}
        activeOpacity={0.7}
      >
        {/* 유저 아바타 */}
        <View style={styles.userInfo}>
          <Avatar
            imageUrl={userProfile.avatar_url}
            username={userProfile.username || userProfile.bio}
            size="large"
            style={styles.avatar}
          />
          
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {userProfile.username || `User ${userId?.slice(0, 8)}`}
            </Text>
            {userProfile.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {userProfile.bio}
              </Text>
            )}
          </View>
        </View>

        {/* 소셜미디어 표준 UX 패턴 적용 */}
        {!isCurrentUser && (
          <>
            {/* Following 리스트: 내가 팔로우하는 모든 사용자에게 언팔로우 버튼 */}
            {type === 'following' && (
              <TouchableOpacity
                style={[styles.followButton, styles.followingButton]}
                onPress={(event) => handleFollowingButtonPress(userId, event)}
                activeOpacity={0.7}
              >
                <Text style={[styles.followButtonText, styles.followingButtonText]}>
                  Following
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Followers 리스트: 일방적 팔로우인 경우에만 Follow Back 버튼 */}
            {type === 'followers' && !isFollowing && (
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => handleFollowToggle(userId)}
                activeOpacity={0.7}
              >
                <Text style={styles.followButtonText}>
                  Follow Back
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Followers 리스트: 상호 팔로우인 경우 버튼 없음 (깔끔한 UI) */}
            {type === 'followers' && isFollowing && (
              <View style={styles.mutualFollowIndicator}>
                <Text style={styles.mutualFollowText}>
                  Mutual
                </Text>
              </View>
            )}
          </>
        )}
        

      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name={type === 'followers' ? 'users' : 'user-plus'}
        size={48}
        color={Colors.secondaryText}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {type === 'followers' 
          ? 'When people follow this account, they will appear here.'
          : 'When this user follows someone, they will appear here.'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ backgroundColor: Colors.mainBackground }}>
          <UnifiedHeader
            title={username ? `${username}'s ${type}` : type}
            showBackButton={true}
            onBackPress={() => navigation.goBack()}
          />
        </SafeAreaView>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryText} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 백그라운드 터치 시 메뉴 닫기 */}
      {showFollowOptions && (
        <TouchableOpacity 
          style={styles.overlay}
          onPress={closeFollowOptions}
          activeOpacity={1}
        />
      )}
      
      {/* Header */}
      <UnifiedHeader
        title={username ? `${username}'s ${type}` : type}
        showBackButton={true}
        onBackPress={() => {
          console.log('👥 FOLLOW LIST SCREEN: UnifiedHeader back button pressed');
          try {
            navigation.goBack();
            console.log('👥 navigation.goBack() executed successfully');
          } catch (error) {
            console.error('👥 ERROR in navigation.goBack():', error);
          }
        }}
      />

      <View style={{ flex: 1 }}>
        {/* 유저 목록 */}
        <FlatList
          data={users}
          keyExtractor={(item) => item.user_id || item.follower_id || item.following_id || Math.random().toString()}
          renderItem={renderUserItem}
          ListEmptyComponent={renderEmptyState}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={[
            styles.listContainer,
            users.length === 0 && styles.emptyListContainer
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* 옵션 메뉴 - 동적 위치 */}
      {showFollowOptions && (
        <View style={[styles.followOptionsMenu, { top: menuPosition.top, right: menuPosition.right }]}>
          <TouchableOpacity
            style={styles.followOptionItem}
            onPress={() => handleMute(showFollowOptions)}
          >
            <Icon name="volume-x" size={16} color={Colors.secondaryText} />
            <Text style={[styles.followOptionText, { color: Colors.secondaryText }]}>Mute</Text>
          </TouchableOpacity>
          <View style={styles.optionSeparator} />
          <TouchableOpacity
            style={styles.followOptionItem}
            onPress={() => handleUnfollow(showFollowOptions)}
          >
            <Icon name="user-minus" size={16} color="#FF3B30" />
            <Text style={styles.followOptionText}>Unfollow</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  // Direct header implementation (same as NoteDetailScreen)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    marginRight: 12,
    width: 40, // Same width as back button for balance
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  absoluteBackButton: {
    position: 'absolute',
    top: 84, // SafeAreaView (44) + paddingTop (24) + paddingVertical (16)
    left: Spacing.screen.horizontal, // 16px
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10000,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textBlack,
    textAlign: 'center',
    marginHorizontal: 16,
    textTransform: 'capitalize',
  },

  // 로딩 상태
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 리스트 컨테이너 - 일관된 패딩
  listContainer: {
    paddingTop: 8, // 상단 간격 최소화
  },
  emptyListContainer: {
    flex: 1,
  },

  // 유저 아이템 - 일관된 간격과 높이
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16, // 위아래 간격 일관성
    backgroundColor: Colors.mainBackground,
    minHeight: 72, // 최소 높이 보장
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  avatar: {
    marginRight: 12, // 아바타와 텍스트 사이 간격
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    color: Colors.primaryText,
    fontWeight: '600',
    fontFamily: 'Avenir Next',
    marginBottom: 2,
    lineHeight: 20,
  },
  fullName: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontFamily: 'Avenir Next',
    marginBottom: 2,
    lineHeight: 18,
  },
  bio: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontFamily: 'Avenir Next',
    lineHeight: 16,
    marginTop: 2,
  },

  // 팔로우 버튼 - Newton 디자인 시스템에 맞춤
  followButton: {
    backgroundColor: Colors.primaryText, // Newton black
    paddingHorizontal: 24, // 20 -> 24로 증가
    paddingVertical: 10, // 8 -> 10으로 증가 (상하 여백 증가)
    borderRadius: 10, // Newton 디자인 시스템 10px radius
    minWidth: 110, // 100 -> 110으로 증가하여 "Following" 텍스트 공간 확보
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38, // height 34 -> minHeight 38로 증가
  },
  followingButton: {
    backgroundColor: Colors.noteCard, // Newton off-white
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    fontSize: 14,
    color: Colors.mainBackground, // White text on black button
    fontWeight: '500', // 살짝 가벼운 폰트 웨이트
    fontFamily: 'Avenir Next',
    letterSpacing: 0.3, // 글자 간격 조정으로 가독성 향상
  },
  followingButtonText: {
    color: Colors.secondaryText, // Gray text for Following button
  },

  // 상호 팔로우 표시
  mutualFollowIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutualFollowText: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontFamily: 'Avenir Next',
    fontWeight: '500',
    opacity: 0.7,
  },

  // 옵션 메뉴 - UserProfileScreen과 동일한 스타일
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  followOptionsMenu: {
    position: 'absolute',
    // top과 right는 동적으로 설정됨
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 140,
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 2000,
  },
  followOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  followOptionText: {
    fontSize: 15,
    color: '#FF3B30', // 빨간색 텍스트
    fontFamily: 'Avenir Next',
    fontWeight: '500',
  },
  optionSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },


  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen.horizontal * 2,
  },
  emptyIcon: {
    marginBottom: Layout.spacing.large,
    opacity: 0.5,
  },
  emptyTitle: {
    ...Typography.heading3,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.small,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FollowListScreen;