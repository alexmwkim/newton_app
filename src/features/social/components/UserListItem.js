/**
 * UserListItem - 사용자 리스트 아이템 컴포넌트
 * 팔로워/팔로잉 리스트에서 사용하는 사용자 카드
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Avatar from '../../../components/Avatar';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';
import { Spacing } from '../../../constants/StyleControl';
import { getConsistentAvatarUrl, getConsistentUsername } from '../../../utils/avatarUtils';

const UserListItem = ({
  user,
  currentUser,
  currentProfile,
  isCurrentUser,
  isFollowing,
  onPress,
  onFollowPress,
  onUnfollowPress,
  onRemovePress,
  onMutePress,
  showFollowButton = true,
  showOptionsButton = false,
  style
}) => {
  const [showOptions, setShowOptions] = useState(false);

  // 사용자 정보 정규화
  const userInfo = {
    id: user.user_id || user.id,
    username: getConsistentUsername({
      userId: user.user_id || user.id,
      currentUser,
      currentProfile,
      profiles: user,
      username: user.username
    }),
    avatarUrl: getConsistentAvatarUrl({
      userId: user.user_id || user.id,
      currentUser,
      currentProfile,
      currentProfilePhoto: currentProfile?.avatar_url,
      profiles: user,
      avatarUrl: user.avatar_url,
      username: user.username
    }),
    fullName: user.full_name || user.display_name
  };

  const handleFollowPress = () => {
    if (isFollowing) {
      onUnfollowPress?.(userInfo.id, userInfo.username);
    } else {
      onFollowPress?.(userInfo.id);
    }
  };

  const handleOptionsPress = () => {
    setShowOptions(!showOptions);
  };

  const handleOptionSelect = (action) => {
    setShowOptions(false);
    
    switch (action) {
      case 'unfollow':
        onUnfollowPress?.(userInfo.id, userInfo.username);
        break;
      case 'remove':
        onRemovePress?.(userInfo.id, userInfo.username);
        break;
      case 'mute':
        onMutePress?.(userInfo.id, userInfo.username);
        break;
    }
  };

  // 본인이면 팔로우 버튼 숨김
  const shouldShowFollowButton = showFollowButton && 
    !isCurrentUser && 
    userInfo.id !== currentUser?.id;

  return (
    <View style={[styles.container, style]}>
      {/* 사용자 정보 */}
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => onPress?.(user)}
        activeOpacity={0.7}
      >
        <Avatar
          size="medium"
          imageUrl={userInfo.avatarUrl}
          username={userInfo.username}
        />
        
        <View style={styles.userDetails}>
          <Text style={styles.username} numberOfLines={1}>
            {userInfo.username}
          </Text>
          {userInfo.fullName && (
            <Text style={styles.fullName} numberOfLines={1}>
              {userInfo.fullName}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* 액션 버튼들 */}
      <View style={styles.actions}>
        {/* 팔로우 버튼 */}
        {shouldShowFollowButton && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton
            ]}
            onPress={handleFollowPress}
          >
            <Text style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {/* 옵션 버튼 */}
        {showOptionsButton && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={handleOptionsPress}
            >
              <Icon name="more-horizontal" size={16} color={Colors.secondaryText} />
            </TouchableOpacity>

            {/* 옵션 메뉴 */}
            {showOptions && (
              <>
                {/* 백그라운드 터치로 닫기 */}
                <TouchableOpacity
                  style={styles.optionsOverlay}
                  onPress={() => setShowOptions(false)}
                />
                
                <View style={styles.optionsMenu}>
                  {isFollowing && (
                    <>
                      <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => handleOptionSelect('mute')}
                      >
                        <Icon name="volume-x" size={16} color={Colors.secondaryText} />
                        <Text style={styles.optionText}>Mute</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => handleOptionSelect('unfollow')}
                      >
                        <Icon name="user-minus" size={16} color="#FF3B30" />
                        <Text style={[styles.optionText, { color: '#FF3B30' }]}>
                          Unfollow
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {isCurrentUser && (
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={() => handleOptionSelect('remove')}
                    >
                      <Icon name="user-x" size={16} color="#FF3B30" />
                      <Text style={[styles.optionText, { color: '#FF3B30' }]}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.mainBackground,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
  },
  fullName: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  followButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.primaryText,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: Colors.noteCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.mainBackground,
  },
  followingButtonText: {
    color: Colors.secondaryText,
  },
  optionsContainer: {
    position: 'relative',
  },
  optionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
  },
  optionsOverlay: {
    position: 'absolute',
    top: -100,
    left: -200,
    right: -20,
    bottom: -100,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  optionsMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: Layout.spacing.xs,
    minWidth: 140,
    shadowColor: Colors.primaryText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  optionText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
  },
});

UserListItem.displayName = 'UserListItem';

export default UserListItem;