/**
 * UserProfileHeader - 사용자 프로필 헤더 컴포넌트
 * 아바타, 사용자명, 소셜 통계 표시
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Avatar from '../../../../components/Avatar';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';
import { getConsistentAvatarUrl, getConsistentUsername } from '../../../../utils/avatarUtils';

const UserProfileHeader = ({
  displayUsername,
  userProfile,
  currentUser,
  currentProfile,
  followersCount,
  followingCount,
  onFollowersPress,
  onFollowingPress,
  onSharePress
}) => {
  // Memoize avatar URL calculation
  const avatarUrl = useMemo(() => 
    getConsistentAvatarUrl({
      userId: userProfile?.user_id,
      currentUser: currentUser,
      currentProfile: currentProfile,
      currentProfilePhoto: currentProfile?.avatar_url,
      profiles: userProfile,
      avatarUrl: userProfile?.avatar_url,
      username: displayUsername
    }),
    [userProfile?.user_id, userProfile?.avatar_url, currentUser, currentProfile, displayUsername]
  );

  // Memoize username calculation
  const username = useMemo(() => 
    getConsistentUsername({
      userId: userProfile?.user_id,
      currentUser: currentUser,
      currentProfile: currentProfile,
      profiles: userProfile,
      username: displayUsername
    }),
    [userProfile?.user_id, currentUser, currentProfile, userProfile, displayUsername]
  );

  return (
    <View style={styles.container}>
      {/* Header with back button and share */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onSharePress}>
          <Icon name="share" size={24} color={Colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Avatar
          size="large"
          imageUrl={avatarUrl}
          username={username}
        />
        <Text style={styles.username}>{displayUsername}</Text>
      </View>

      {/* Social Stats Section */}
      <View style={styles.socialStats}>
        <TouchableOpacity onPress={onFollowersPress}>
          <Text style={styles.statText}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}> followers</Text>
          </Text>
        </TouchableOpacity>
        <Text style={styles.statSeparator}>  </Text>
        <TouchableOpacity onPress={onFollowingPress}>
          <Text style={styles.statText}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}> following</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

UserProfileHeader.displayName = 'UserProfileHeader';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.mainBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.noteCard,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  username: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  socialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  statText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  statLabel: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  statSeparator: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
});

export default UserProfileHeader;