import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const StarredNoteCard = ({ note, onPress, onUnstar, onFork, showForkButton = false, isStarred = false, showDate = true }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPreviewText = (content) => {
    // Remove markdown formatting for preview
    const cleanContent = content
      .replace(/^#{1,6}\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    return cleanContent.length > 120 ? `${cleanContent.substring(0, 120)}...` : cleanContent;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorAvatar}>{note.author.avatar}</Text>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{note.author.name}</Text>
            {showDate && (
              <Text style={styles.dateText}>
                {formatDate(note.createdAt)}
              </Text>
            )}
          </View>
        </View>
        {showForkButton && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={onFork}>
              <Icon name="git-branch" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {note.title}
        </Text>
        <Text style={styles.preview} numberOfLines={3}>
          {getPreviewText(note.content)}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statText}>{note.starCount || 0} stars</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statText}>{note.forkCount} forks</Text>
            </View>
          </View>
        </View>
        <View style={styles.tags}>
          {note.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {note.tags.length > 2 && (
            <Text style={styles.moreTagsText}>+{note.tags.length - 2}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.noteCard,
    borderRadius: 10,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    fontSize: 20,
    marginRight: Layout.spacing.sm,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textPrimary,
  },
  dateText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    padding: Layout.spacing.xs,
  },
  content: {
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.sm,
    lineHeight: Typography.fontSize.medium * 1.3,
  },
  preview: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  statText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  tag: {
    backgroundColor: Colors.border,
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  tagText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
  },
  moreTagsText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.xs,
  },
});

export default StarredNoteCard;