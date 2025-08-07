import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Avatar from './Avatar';
import { getConsistentAvatarUrl, getConsistentUsername } from '../utils/avatarUtils';
import { useAuth } from '../contexts/AuthContext';

// Simple time formatting function to avoid date-fns dependency
const formatTimeAgo = (dateString) => {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}주 전`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}개월 전`;
  } catch {
    return '방금 전';
  }
};

const SocialFeedCard = ({ 
  note,
  onPress,
  onAuthorPress,
  showAuthor = true,
  style 
}) => {
  const { user, profile } = useAuth();
  const handlePress = () => {
    if (onPress) {
      onPress(note);
    }
  };

  const handleAuthorPress = () => {
    if (onAuthorPress && note.profiles && note.profiles.id) {
      onAuthorPress(note.profiles.id);
    }
  };

  const getContentPreview = (content) => {
    if (!content) return '';
    
    // Remove markdown formatting for preview
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    return cleanContent.length > 150 
      ? cleanContent.substring(0, 150) + '...'
      : cleanContent;
  };

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={handlePress}>
      {/* 작성자 정보 */}
      {showAuthor && note.profiles && (
        <TouchableOpacity style={styles.authorSection} onPress={handleAuthorPress}>
          <Avatar
            size="medium"
            imageUrl={getConsistentAvatarUrl({
              userId: note.user_id,
              currentUser: user,
              currentProfile: profile,
              currentProfilePhoto: profile?.avatar_url,
              profiles: note.profiles,
              avatarUrl: note.avatar_url,
              username: note.profiles?.username
            })}
            username={getConsistentUsername({
              userId: note.user_id,
              currentUser: user,
              currentProfile: profile,
              profiles: note.profiles,
              username: note.profiles?.username
            })}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {note.profiles.username || 'Unknown User'}
            </Text>
            <Text style={styles.timeText}>
              {formatTimeAgo(note.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 노트 제목 */}
      <Text style={styles.title} numberOfLines={2}>
        {note.title || 'Untitled'}
      </Text>

      {/* 노트 내용 미리보기 */}
      {note.content && (
        <Text style={styles.contentPreview} numberOfLines={3}>
          {getContentPreview(note.content)}
        </Text>
      )}

      {/* 소셜 정보 */}
      <View style={styles.socialInfo}>
        <View style={styles.socialStats}>
          <View style={styles.statItem}>
            <Feather name="star" size={14} color={Colors.textSecondary} />
            <Text style={styles.statText}>{note.star_count || 0}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Feather name="git-branch" size={14} color={Colors.textSecondary} />
            <Text style={styles.statText}>{note.fork_count || 0}</Text>
          </View>

          {note.forked_from && (
            <View style={styles.forkBadge}>
              <Feather name="git-branch" size={12} color={Colors.accent} />
              <Text style={styles.forkBadgeText}>포크됨</Text>
            </View>
          )}
        </View>

        {/* 공개/비공개 표시 */}
        <View style={[
          styles.visibilityBadge,
          note.is_public ? styles.publicBadge : styles.privateBadge
        ]}>
          <Feather
            name={note.is_public ? "globe" : "lock"}
            size={12}
            color={note.is_public ? Colors.success : Colors.textSecondary}
          />
          <Text style={[
            styles.visibilityText,
            note.is_public ? styles.publicText : styles.privateText
          ]}>
            {note.is_public ? '공개' : '비공개'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    marginLeft: 8, // Layout.spacing.sm for consistency
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontFamily: Typography.medium,
    color: Colors.text,
  },
  timeText: {
    fontSize: 12,
    fontFamily: Typography.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: Typography.semiBold,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  contentPreview: {
    fontSize: 14,
    fontFamily: Typography.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  socialInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  socialStats: {
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
    fontSize: 12,
    fontFamily: Typography.regular,
    color: Colors.textSecondary,
  },
  forkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  forkBadgeText: {
    fontSize: 10,
    fontFamily: Typography.regular,
    color: Colors.accent,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  publicBadge: {
    backgroundColor: Colors.success + '20',
  },
  privateBadge: {
    backgroundColor: Colors.textSecondary + '20',
  },
  visibilityText: {
    fontSize: 10,
    fontFamily: Typography.regular,
  },
  publicText: {
    color: Colors.success,
  },
  privateText: {
    color: Colors.textSecondary,
  },
});

export default SocialFeedCard;