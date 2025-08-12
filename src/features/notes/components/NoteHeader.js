/**
 * NoteHeader - 최적화된 노트 상세화면 헤더 컴포넌트
 * 모달 컴포넌트 분리로 코드 간소화
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';
import Avatar from '../../../components/Avatar';
import { getConsistentAvatarUrl, getConsistentUsername } from '../../../utils/avatarUtils';
import { SettingsMenu, PageInfoModal } from './modals';

const NoteHeader = ({
  note,
  currentUser,
  currentProfile,
  isOwner = false,
  onBack,
  onSettingsPress,
  onAuthorPress,
  showSettingsMenu = false,
  onSettingsMenuClose,
  onSettingsAction,
  style
}) => {
  const [showPageInfoModal, setShowPageInfoModal] = useState(false);

  // 작성자 정보 메모이제이션
  const authorInfo = useMemo(() => {
    if (!note) return null;
    
    return {
      username: getConsistentUsername({
        userId: note.user_id,
        currentUser,
        currentProfile,
        profiles: note.profiles,
        username: note.username
      }),
      avatarUrl: getConsistentAvatarUrl({
        userId: note.user_id,
        currentUser,
        currentProfile,
        currentProfilePhoto: currentProfile?.avatar_url,
        profiles: note.profiles,
        avatarUrl: note.avatar_url,
        username: note.username
      })
    };
  }, [note, currentUser, currentProfile]);

  // 이벤트 핸들러 최적화
  const handleAuthorPress = useCallback(() => {
    if (!isOwner && authorInfo && note) {
      onAuthorPress?.({
        id: note.user_id,
        username: authorInfo.username,
        avatar_url: authorInfo.avatarUrl
      });
    }
  }, [isOwner, authorInfo, note, onAuthorPress]);

  const handlePageInfoOpen = useCallback(() => {
    setShowPageInfoModal(true);
  }, []);

  const handlePageInfoClose = useCallback(() => {
    setShowPageInfoModal(false);
  }, []);

  const handleSettingsAction = useCallback((action, noteData) => {
    onSettingsAction?.(action, noteData);
  }, [onSettingsAction]);

  return (
    <>
      <View style={[styles.container, style]}>
        <BackButton onPress={onBack} />
        
        {authorInfo && (
          <AuthorSection
            authorInfo={authorInfo}
            note={note}
            isOwner={isOwner}
            onPress={handleAuthorPress}
          />
        )}
        
        <ActionButtons
          onPageInfoPress={handlePageInfoOpen}
          onSettingsPress={onSettingsPress}
        />
      </View>

      <SettingsMenu
        visible={showSettingsMenu}
        note={note}
        isOwner={isOwner}
        onClose={onSettingsMenuClose}
        onAction={handleSettingsAction}
      />

      <PageInfoModal
        visible={showPageInfoModal}
        note={note}
        onClose={handlePageInfoClose}
      />
    </>
  );
};

// 서브 컴포넌트들
const BackButton = ({ onPress }) => (
  <TouchableOpacity style={styles.backButton} onPress={onPress}>
    <Icon name="arrow-left" size={24} color={Colors.primaryText} />
  </TouchableOpacity>
);

const AuthorSection = ({ authorInfo, note, isOwner, onPress }) => (
  <TouchableOpacity
    style={styles.authorSection}
    onPress={onPress}
    disabled={isOwner}
  >
    <Avatar
      size="small"
      imageUrl={authorInfo.avatarUrl}
      username={authorInfo.username}
    />
    <View style={styles.authorInfo}>
      <Text style={styles.authorName} numberOfLines={1}>
        {authorInfo.username}
      </Text>
      {note?.created_at && (
        <Text style={styles.createdDate}>
          {new Date(note.created_at).toLocaleDateString()}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

const ActionButtons = ({ onPageInfoPress, onSettingsPress }) => (
  <View style={styles.rightActions}>
    <TouchableOpacity style={styles.actionButton} onPress={onPageInfoPress}>
      <Icon name="info" size={20} color={Colors.secondaryText} />
    </TouchableOpacity>
    <TouchableOpacity style={styles.actionButton} onPress={onSettingsPress}>
      <Icon name="more-vertical" size={20} color={Colors.primaryText} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.mainBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Layout.spacing.sm,
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
  createdDate: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
  },
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

NoteHeader.displayName = 'NoteHeader';

export default NoteHeader;