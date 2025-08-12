/**
 * UnifiedNoteCard - 통합된 노트 카드 컴포넌트
 * 기존 5개 노트 카드 컴포넌트를 하나로 통합
 * 
 * 지원하는 모드:
 * - public: 공개 노트 (PublicNoteCard)
 * - author: 작성자 공개 노트 (AuthorPublicNoteCard)
 * - starred: 즐겨찾기 노트 (StarredNoteCard)
 * - swipeable: 스와이프 가능 노트 (SwipeableNoteItem)
 * - block: 블록형 노트 (NoteCardBlock)
 */

import React from 'react';
import { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Markdown from 'react-native-markdown-display';

// Constants
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

// Components
import Avatar from './Avatar';

// Utils
import { getConsistentAvatarUrl, getConsistentUsername } from '../utils/avatarUtils';
import logger from '../utils/Logger';

const UnifiedNoteCard = memo(({
  // 데이터
  note,
  author,
  currentUser,
  currentProfile,
  
  // 모드 설정
  mode = 'public', // 'public' | 'author' | 'starred' | 'swipeable' | 'block'
  variant = 'default', // 'default' | 'compact' | 'minimal'
  
  // 기능 옵션
  showAuthor = true,
  showStats = true,
  showPreview = true,
  showActions = true,
  maxPreviewLength = 100,
  
  // 콜백
  onPress,
  onAuthorPress,
  onStarPress,
  onForkPress,
  onMorePress,
  
  // 스타일 커스터마이징
  containerStyle,
  contentStyle,
  
  // 접근성
  accessibilityLabel,
  accessibilityRole = 'button',
}) => {
  
  // 데이터 정규화
  const normalizedNote = useMemo(() => ({
    id: note.id,
    title: note.title,
    content: note.content || '',
    isPublic: note.is_public ?? note.isPublic ?? false,
    starCount: note.star_count || note.starCount || 0,
    forkCount: note.fork_count || note.forkCount || 0,
    createdAt: note.created_at || note.createdAt,
    updatedAt: note.updated_at || note.updatedAt,
    userId: note.user_id || note.userId,
    slug: note.slug,
  }), [note]);

  const normalizedAuthor = useMemo(() => {
    const authorData = author || note.profiles || note.author;
    if (!authorData) return null;

    return {
      id: authorData.id || authorData.user_id,
      username: authorData.username,
      avatarUrl: authorData.avatar_url || authorData.avatarUrl,
    };
  }, [author, note]);

  // 콘텐츠 미리보기
  const previewContent = useMemo(() => {
    if (!showPreview || !normalizedNote.content) return '';
    
    const plainText = normalizedNote.content
      .replace(/[#*`]/g, '') // 마크다운 문법 제거
      .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
      .trim();
    
    return plainText.length > maxPreviewLength 
      ? `${plainText.substring(0, maxPreviewLength)}...`
      : plainText;
  }, [normalizedNote.content, showPreview, maxPreviewLength]);

  // 작성자 정보
  const authorInfo = useMemo(() => {
    if (!normalizedAuthor) return null;

    return {
      username: getConsistentUsername({
        userId: normalizedAuthor.id,
        currentUser,
        currentProfile,
        profiles: normalizedAuthor,
        username: normalizedAuthor.username
      }),
      avatarUrl: getConsistentAvatarUrl({
        userId: normalizedAuthor.id,
        currentUser,
        currentProfile,
        currentProfilePhoto: currentProfile?.avatar_url,
        profiles: normalizedAuthor,
        avatarUrl: normalizedAuthor.avatarUrl,
        username: normalizedAuthor.username
      })
    };
  }, [normalizedAuthor, currentUser, currentProfile]);

  // 날짜 포맷팅
  const formattedDate = useMemo(() => {
    const date = new Date(normalizedNote.updatedAt || normalizedNote.createdAt);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }, [normalizedNote.updatedAt, normalizedNote.createdAt]);

  // 이벤트 핸들러들
  const handlePress = useCallback(() => {
    logger.debug('📝 Note card pressed:', normalizedNote.title);
    onPress?.(normalizedNote);
  }, [normalizedNote, onPress]);

  const handleAuthorPress = useCallback(() => {
    if (authorInfo && onAuthorPress) {
      logger.debug('👤 Author pressed:', authorInfo.username);
      onAuthorPress(normalizedAuthor);
    }
  }, [authorInfo, normalizedAuthor, onAuthorPress]);

  const handleStarPress = useCallback(() => {
    logger.debug('⭐ Star pressed for note:', normalizedNote.id);
    onStarPress?.(normalizedNote);
  }, [normalizedNote, onStarPress]);

  const handleForkPress = useCallback(() => {
    logger.debug('🔀 Fork pressed for note:', normalizedNote.id);
    onForkPress?.(normalizedNote);
  }, [normalizedNote, onForkPress]);

  // 모드별 스타일 계산
  const cardStyles = useMemo(() => {
    const baseStyle = [styles.container];
    
    switch (mode) {
      case 'compact':
        baseStyle.push(styles.compactContainer);
        break;
      case 'minimal':
        baseStyle.push(styles.minimalContainer);
        break;
      case 'block':
        baseStyle.push(styles.blockContainer);
        break;
      default:
        baseStyle.push(styles.defaultContainer);
    }
    
    if (containerStyle) {
      baseStyle.push(containerStyle);
    }
    
    return baseStyle;
  }, [mode, containerStyle]);

  // 접근성 설정
  const accessibilityProps = useMemo(() => ({
    accessibilityRole,
    accessibilityLabel: accessibilityLabel || `Note: ${normalizedNote.title}`,
    accessibilityHint: `Tap to open ${normalizedNote.title}`,
  }), [accessibilityRole, accessibilityLabel, normalizedNote.title]);

  return (
    <TouchableOpacity
      style={cardStyles}
      onPress={handlePress}
      activeOpacity={0.7}
      {...accessibilityProps}
    >
      {/* 작성자 정보 */}
      {showAuthor && authorInfo && (
        <TouchableOpacity 
          style={styles.authorSection}
          onPress={handleAuthorPress}
          accessibilityRole="button"
          accessibilityLabel={`View ${authorInfo.username}'s profile`}
        >
          <Avatar
            size={mode === 'minimal' ? 'small' : 'medium'}
            imageUrl={authorInfo.avatarUrl}
            username={authorInfo.username}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorInfo.username}</Text>
            {formattedDate && (
              <Text style={styles.timestamp}>{formattedDate}</Text>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* 노트 내용 */}
      <View style={[styles.content, contentStyle]}>
        <Text style={styles.title} numberOfLines={2}>
          {normalizedNote.title}
        </Text>
        
        {showPreview && previewContent && (
          <Text style={styles.preview} numberOfLines={3}>
            {previewContent}
          </Text>
        )}
      </View>

      {/* 통계 및 액션 */}
      {(showStats || showActions) && (
        <View style={styles.footer}>
          {showStats && (
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Icon 
                  name="star" 
                  size={14} 
                  color={normalizedNote.starCount > 0 ? '#FFD700' : Colors.secondaryText} 
                />
                <Text style={styles.statText}>{normalizedNote.starCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="git-branch" size={14} color={Colors.secondaryText} />
                <Text style={styles.statText}>{normalizedNote.forkCount}</Text>
              </View>
            </View>
          )}
          
          {showActions && (
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleStarPress}
                accessibilityLabel="Star this note"
              >
                <Icon 
                  name="star" 
                  size={16} 
                  color={normalizedNote.starCount > 0 ? '#FFD700' : Colors.secondaryText} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleForkPress}
                accessibilityLabel="Fork this note"
              >
                <Icon name="git-branch" size={16} color={Colors.secondaryText} />
              </TouchableOpacity>
              {onMorePress && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onMorePress(normalizedNote)}
                  accessibilityLabel="More options"
                >
                  <Icon name="more-horizontal" size={16} color={Colors.secondaryText} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  defaultContainer: {
    // 기본 스타일은 위에 정의됨
  },
  compactContainer: {
    padding: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
  },
  minimalContainer: {
    padding: Layout.spacing.sm,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  blockContainer: {
    margin: Layout.spacing.xs,
    flex: 1,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
  },
  timestamp: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  content: {
    marginBottom: Layout.spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.xs,
    lineHeight: 22,
  },
  preview: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  statText: {
    ...Typography.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    padding: Layout.spacing.xs,
    borderRadius: 6,
  },
});

// displayName 설정 (디버깅용)
UnifiedNoteCard.displayName = 'UnifiedNoteCard';

export default UnifiedNoteCard;