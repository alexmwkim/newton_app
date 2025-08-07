import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import Avatar from './Avatar';
import { getConsistentAvatarUrl, getConsistentUsername } from '../utils/avatarUtils';

const PublicNoteCard = ({ 
  username = "username", 
  title = "Note title",
  forksCount = 0,
  starsCount = 0,
  avatarUrl,
  onPress 
}) => {
  return (
    <View style={styles.noteCard}>
      <TouchableOpacity onPress={onPress} style={styles.noteCardContent}>
        <View style={styles.noteHeader}>
          <View style={styles.userInfo}>
            <Avatar
              size="small"
              imageUrl={avatarUrl}
              username={username}
            />
            <Text style={styles.userName}>@{username}</Text>
          </View>
        </View>
        <Text style={styles.noteTitle}>{title}</Text>
        <View style={styles.noteFooter}>
          <View style={styles.statItem}>
            <Icon name="star" size={16} color={Colors.secondaryText} />
            <Text style={styles.statText}>{starsCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="git-branch" size={16} color={Colors.secondaryText} />
            <Text style={styles.statText}>{forksCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  noteCard: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    marginBottom: Layout.spacing.sm,
    padding: Layout.spacing.md,
  },
  noteCardContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Layout.spacing.sm for consistency
  },
  userName: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Layout.spacing.sm,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
});

export default PublicNoteCard;