/**
 * UserSocialActions - 소셜 액션 버튼들 (팔로우/언팔로우)
 */

import React from 'react';
import { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';
import { Spacing } from '../../../../constants/StyleControl';

const UserSocialActions = ({
  isCurrentUser,
  isFollowing,
  showFollowOptions,
  displayUsername,
  onFollowPress,
  onFollowingButtonPress,
  onUnfollow,
  onMute,
  onCloseFollowOptions
}) => {
  // 현재 사용자면 소셜 액션 버튼 숨김
  if (isCurrentUser) {
    return null;
  }

  const handleFollowPress = useCallback(async () => {
    try {
      await onFollowPress();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
    }
  }, [onFollowPress]);

  const handleUnfollowConfirm = useCallback(() => {
    Alert.alert(
      'Unfollow User',
      `Are you sure you want to unfollow ${displayUsername || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unfollow', 
          style: 'destructive',
          onPress: async () => {
            try {
              await onUnfollow();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to unfollow user');
            }
          }
        }
      ]
    );
  }, [displayUsername, onUnfollow]);

  const handleMuteConfirm = useCallback(() => {
    Alert.alert(
      'Mute User',
      `Are you sure you want to mute ${displayUsername || 'this user'}? You will still follow them but won't see their posts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mute', 
          style: 'default',
          onPress: onMute
        }
      ]
    );
  }, [displayUsername, onMute]);

  return (
    <View style={styles.container}>
      {showFollowOptions && (
        <TouchableOpacity 
          style={styles.overlay}
          onPress={onCloseFollowOptions}
          activeOpacity={1}
        />
      )}

      <TouchableOpacity 
        style={[styles.followButton, isFollowing && styles.followingButton]} 
        onPress={isFollowing ? onFollowingButtonPress : handleFollowPress}
      >
        <Icon 
          name={isFollowing ? "user-check" : "user-plus"} 
          size={16} 
          color={isFollowing ? Colors.secondaryText : Colors.mainBackground} 
        />
        <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>

      {showFollowOptions && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={handleMuteConfirm}
          >
            <Icon name="volume-x" size={16} color={Colors.secondaryText} />
            <Text style={[styles.optionText, { color: Colors.secondaryText }]}>Mute</Text>
          </TouchableOpacity>
          <View style={styles.optionSeparator} />
          <TouchableOpacity
            style={styles.optionItem}
            onPress={handleUnfollowConfirm}
          >
            <Icon name="user-minus" size={16} color="#FF3B30" />
            <Text style={[styles.optionText, { color: '#FF3B30' }]}>Unfollow</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingBottom: Layout.spacing.lg,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: -50,
    left: -Spacing.screen.horizontal,
    right: -Spacing.screen.horizontal,
    bottom: -Layout.spacing.lg,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryText,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: 10,
    gap: Layout.spacing.sm,
    minWidth: 120,
  },
  followingButton: {
    backgroundColor: Colors.noteCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.mainBackground,
  },
  followingButtonText: {
    color: Colors.secondaryText,
  },
  optionsMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 140,
    shadowColor: Colors.primaryText,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 1001,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Avenir Next',
    fontWeight: '500',
  },
  optionSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
});

UserSocialActions.displayName = 'UserSocialActions';

export default UserSocialActions;