import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';

/**
 * 소셜 액션 버튼들 (팔로우/언팔로우, 메시지 등)
 * 다른 사용자의 프로필을 볼 때 표시되는 액션 버튼들
 */
const SocialActions = ({
  isFollowing = false,
  onFollowPress,
  onMessagePress,
  onSharePress,
  loading = false,
  canFollow = true,
}) => {
  if (!canFollow) {
    return null; // 자신의 프로필에서는 소셜 액션 버튼들을 표시하지 않음
  }

  return (
    <View style={styles.container}>
      {/* 팔로우/언팔로우 버튼 */}
      <TouchableOpacity
        style={[
          styles.followButton,
          isFollowing && styles.followingButton
        ]}
        onPress={onFollowPress}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Icon 
          name={isFollowing ? "user-check" : "user-plus"} 
          size={16} 
          color={isFollowing ? Colors.text.primary : Colors.white} 
        />
        <Text style={[
          styles.followButtonText,
          isFollowing && styles.followingButtonText
        ]}>
          {loading ? "Loading..." : (isFollowing ? "Following" : "Follow")}
        </Text>
      </TouchableOpacity>

      {/* 메시지 버튼 */}
      <TouchableOpacity
        style={styles.messageButton}
        onPress={onMessagePress}
        activeOpacity={0.7}
      >
        <Icon name="message-circle" size={16} color={Colors.text.primary} />
      </TouchableOpacity>

      {/* 공유 버튼 */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={onSharePress}
        activeOpacity={0.7}
      >
        <Icon name="share" size={16} color={Colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.medium,
    gap: Layout.spacing.medium,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Layout.spacing.medium,
    paddingHorizontal: Layout.spacing.large,
    borderRadius: 25,
    minHeight: 50,
  },
  followingButton: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Layout.spacing.small,
  },
  followingButtonText: {
    color: Colors.text.primary,
  },
  messageButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SocialActions;