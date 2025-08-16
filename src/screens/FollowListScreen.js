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
import Avatar from '../components/Avatar';
import UnifiedFollowService from '../services/UnifiedFollowService';
import { useAuth } from '../contexts/AuthContext';

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

      const { success, isFollowing: newFollowingStatus, error } = await UnifiedFollowService.toggleFollow(currentUser.id, targetUserId);
      
      if (success) {
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: newFollowingStatus
        }));
      } else {
        // 에러 시 상태 되돌리기
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: isCurrentlyFollowing
        }));
        console.error('Follow toggle failed:', error);
        Alert.alert('Error', 'Failed to update follow status');
      }
    } catch (error) {
      // 에러 시 상태 되돌리기
      setFollowingStates(prev => ({
        ...prev,
        [targetUserId]: followingStates[targetUserId]
      }));
      
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

              const { success, error } = await UnifiedFollowService.unfollowUser(currentUser.id, targetUserId);

              if (!success) {
                // 에러 시 상태 되돌리기
                setFollowingStates(prev => ({
                  ...prev,
                  [targetUserId]: true
                }));
                console.error('Unfollow failed:', error);
                Alert.alert('Error', 'Failed to unfollow user');
              }
            } catch (error) {
              // 에러 시 상태 되돌리기
              setFollowingStates(prev => ({
                ...prev,
                [targetUserId]: true
              }));
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

        {/* 팔로우 버튼 - 현재 사용자 자신에게는 표시하지 않음 */}
        {!isCurrentUser && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton
            ]}
            onPress={(event) => {
              if (isFollowing) {
                handleFollowingButtonPress(userId, event);
              } else {
                handleFollowToggle(userId);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
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
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButtonFinal}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="arrow-left" size={24} color={Colors.primaryText} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              {username ? `${username}'s ${type}` : type}
            </Text>
          </View>
        </SafeAreaView>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryText} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 백그라운드 터치 시 메뉴 닫기 */}
      {showFollowOptions && (
        <TouchableOpacity 
          style={styles.overlay}
          onPress={closeFollowOptions}
          activeOpacity={1}
        />
      )}

      {/* 절대 위치 뒤로가기 버튼 - 최상위에 배치 */}
      <TouchableOpacity
        style={styles.absoluteBackButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Icon name="arrow-left" size={24} color={Colors.primaryText} />
      </TouchableOpacity>

      <SafeAreaView style={{ backgroundColor: Colors.mainBackground }}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.backButtonPlaceholder} />
          
          <Text style={styles.headerTitle}>
            {username ? `${username}'s ${type}` : type}
          </Text>
        </View>
      </SafeAreaView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.mainBackground, // Newton 기본 배경색
  },
  
  // 헤더 스타일 - 일관된 간격과 정렬
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding, // 다른 화면들과 동일하게 16px
    paddingVertical: Layout.spacing.md, // 16px
    paddingTop: Layout.spacing.lg, // 24px
    backgroundColor: Colors.mainBackground,
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  absoluteBackButton: {
    position: 'absolute',
    top: 84, // SafeAreaView (44) + paddingTop (24) + paddingVertical (16)
    left: Layout.screen.padding, // 16px
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10000,
  },
  headerTitle: {
    flex: 1, // 남은 공간 차지하여 가운데 정렬 효과
    fontSize: 18,
    color: Colors.primaryText,
    fontWeight: '600',
    fontFamily: 'Avenir Next',
    textAlign: 'center', // 텍스트 가운데 정렬
    textTransform: 'capitalize',
    paddingRight: 44, // 오른쪽에 백 버튼 만큼 여백을 줘서 중앙 정렬 유지
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
    paddingHorizontal: Layout.screen.padding * 2,
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