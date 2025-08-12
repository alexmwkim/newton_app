/**
 * UserInfo - 사용자 정보 표시 복합 컴포넌트
 * Avatar + Username + FullName 패턴 통합
 */

import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';
import { FastAvatar } from '../optimized';
import { getConsistentAvatarUrl, getConsistentUsername } from '../../../utils/avatarUtils';

const UserInfo = memo(({ 
  user,
  currentUser,
  currentProfile,
  size = 'medium',
  layout = 'horizontal', // 'horizontal' | 'vertical'
  showFullName = true,
  interactive = true,
  onPress,
  style 
}) => {
  // 사용자 정보 메모이제이션
  const userInfo = useMemo(() => {
    if (!user) return null;
    
    return {
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
  }, [user, currentUser, currentProfile]);

  const handlePress = () => {
    if (interactive && onPress && userInfo) {
      onPress(userInfo);
    }
  };

  if (!userInfo) return null;

  const containerStyle = [
    styles.container,
    layout === 'vertical' && styles.verticalLayout,
    style
  ];

  const Component = interactive ? TouchableOpacity : View;

  return (
    <Component style={containerStyle} onPress={handlePress}>
      <FastAvatar
        imageUrl={userInfo.avatarUrl}
        username={userInfo.username}
        size={size}
        style={styles.avatar}
      />
      
      <View style={styles.textContainer}>
        <Text style={styles.username} numberOfLines={1}>
          {userInfo.username}
        </Text>
        {showFullName && userInfo.fullName && (
          <Text style={styles.fullName} numberOfLines={1}>
            {userInfo.fullName}
          </Text>
        )}
      </View>
    </Component>
  );
});

// 컴팩트 버전 (아바타 + 이름만)
export const CompactUserInfo = memo(({ 
  user, 
  currentUser, 
  currentProfile,
  size = 'small',
  onPress,
  style 
}) => (
  <UserInfo
    user={user}
    currentUser={currentUser}
    currentProfile={currentProfile}
    size={size}
    showFullName={false}
    onPress={onPress}
    style={[styles.compact, style]}
  />
));

// 세로 레이아웃 버전
export const VerticalUserInfo = memo((props) => (
  <UserInfo
    {...props}
    layout="vertical"
    style={[styles.verticalContainer, props.style]}
  />
));

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  verticalLayout: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  verticalContainer: {
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  avatar: {
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0, // for ellipsis
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
  compact: {
    gap: Layout.spacing.xs,
  },
});

UserInfo.displayName = 'UserInfo';
CompactUserInfo.displayName = 'CompactUserInfo';
VerticalUserInfo.displayName = 'VerticalUserInfo';

export default UserInfo;