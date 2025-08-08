import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Avatar from '../../../../components/Avatar';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';

/**
 * 프로필 헤더 컴포넌트
 * - 아바타, 사용자명, 편집 버튼
 */
const ProfileHeader = ({
  profilePhoto,
  displayUsername,
  isOwnProfile,
  uploading = false,
  onPhotoPress,
  onEditPress,
}) => {
  return (
    <View style={styles.header}>
      {/* Profile Photo */}
      <TouchableOpacity 
        onPress={isOwnProfile ? onPhotoPress : undefined}
        disabled={uploading}
        activeOpacity={isOwnProfile ? 0.7 : 1}
      >
        <View style={styles.avatarContainer}>
          <Avatar 
            source={profilePhoto} 
            size={80}
            style={styles.avatar}
          />
          {isOwnProfile && (
            <View style={styles.cameraOverlay}>
              <Icon 
                name={uploading ? "upload" : "camera"} 
                size={16} 
                color={Colors.white} 
              />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Username */}
      <Text style={styles.username}>
        {displayUsername}
      </Text>

      {/* Edit Profile Button (Own Profile Only) */}
      {isOwnProfile && (
        <TouchableOpacity 
          style={styles.editButton}
          onPress={onEditPress}
          activeOpacity={0.7}
        >
          <Icon name="edit-2" size={16} color={Colors.primary} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: Layout.spacing.large,
    paddingBottom: Layout.spacing.medium,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Layout.spacing.medium,
  },
  avatar: {
    borderWidth: 3,
    borderColor: Colors.border,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  username: {
    ...Typography.heading2,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.small,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.background.secondary,
  },
  editButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    marginLeft: Layout.spacing.xsmall,
    fontWeight: '500',
  },
});

export default ProfileHeader;