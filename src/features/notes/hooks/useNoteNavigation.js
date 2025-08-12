/**
 * useNoteNavigation - 노트 상세화면 네비게이션 훅
 * 뒤로가기, 설정, 공유 등의 네비게이션 로직 관리
 */

import { useCallback } from 'react';
import { Alert, Share } from 'react-native';
import logger from '../../../utils/Logger';

export const useNoteNavigation = (navigation, route) => {
  const {
    returnToScreen,
    returnToTab,
    onStarredRemove,
    onBack,
    onEdit,
    onFork,
    onUnstar
  } = route?.params || {};

  // 뒤로가기 핸들러
  const handleBack = useCallback(() => {
    logger.debug('🔙 Note detail back navigation');

    // 커스텀 onBack이 있으면 사용
    if (onBack) {
      onBack();
      return;
    }

    // 특정 화면으로 복귀
    if (returnToScreen) {
      switch (returnToScreen) {
        case 'explore':
          navigation.navigate('explore');
          break;
        case 'profile':
          navigation.navigate('profile');
          break;
        case 'home':
          navigation.navigate('home');
          break;
        case 'notesList':
          navigation.navigate('notesList');
          break;
        default:
          navigation.goBack();
      }
    } else {
      navigation.goBack();
    }
  }, [navigation, returnToScreen, onBack]);

  // 노트 편집
  const handleEdit = useCallback((note) => {
    logger.debug('✏️ Edit note:', note.id);
    
    if (onEdit) {
      onEdit(note);
    } else {
      // 편집 모드로 전환하거나 편집 화면으로 이동
      navigation.navigate('editNote', {
        noteId: note.id,
        noteData: note,
        returnToScreen: 'noteDetail'
      });
    }
  }, [navigation, onEdit]);

  // 노트 포크
  const handleFork = useCallback((note) => {
    logger.debug('🔀 Fork note:', note.id);
    
    if (onFork) {
      onFork(note);
    } else {
      Alert.alert(
        'Fork Note',
        'Create a copy of this note to your notes?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Fork',
            onPress: () => {
              // TODO: Implement fork functionality
              navigation.navigate('createNote', {
                forkFrom: note,
                returnToScreen: 'noteDetail'
              });
            }
          }
        ]
      );
    }
  }, [navigation, onFork]);

  // 노트 공유
  const handleShare = useCallback(async (note) => {
    logger.debug('📤 Share note:', note.id);
    
    try {
      const shareContent = {
        title: note.title || 'Untitled Note',
        message: `Check out this note: ${note.title || 'Untitled Note'}\n\n${note.content || ''}`
      };

      if (note.isPublic) {
        // 공개 노트인 경우 링크 포함
        shareContent.url = `https://newton-app.com/notes/${note.id}`;
        shareContent.message += `\n\nView online: ${shareContent.url}`;
      }

      const result = await Share.share(shareContent);
      
      if (result.action === Share.sharedAction) {
        logger.debug('📤 Note shared successfully');
      }
    } catch (error) {
      logger.error('📤 Share failed:', error);
      Alert.alert('Error', 'Failed to share note');
    }
  }, []);

  // 즐겨찾기 해제 (즐겨찾기 화면에서 온 경우)
  const handleUnstar = useCallback((note) => {
    logger.debug('⭐ Unstar note:', note.id);
    
    if (onUnstar) {
      onUnstar(note);
    }
    
    if (onStarredRemove) {
      onStarredRemove(note.id);
    }
  }, [onUnstar, onStarredRemove]);

  // 노트 삭제
  const handleDelete = useCallback((note, deleteFunction) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFunction(note.id);
              logger.debug('🗑️ Note deleted:', note.id);
              
              Alert.alert(
                'Deleted',
                'Note has been deleted successfully',
                [{ text: 'OK', onPress: handleBack }]
              );
            } catch (error) {
              logger.error('🗑️ Delete failed:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          }
        }
      ]
    );
  }, [handleBack]);

  // 설정 메뉴 액션들
  const handleSettingsAction = useCallback((action, note, context = {}) => {
    logger.debug('⚙️ Settings action:', action);

    switch (action) {
      case 'edit':
        handleEdit(note);
        break;
      case 'fork':
        handleFork(note);
        break;
      case 'share':
        handleShare(note);
        break;
      case 'unstar':
        handleUnstar(note);
        break;
      case 'delete':
        handleDelete(note, context.deleteFunction);
        break;
      case 'togglePublic':
        // TODO: Implement toggle public/private
        logger.debug('🔒 Toggle public/private');
        break;
      case 'copyLink':
        if (note.isPublic) {
          // TODO: Copy public link to clipboard
          logger.debug('📋 Copy public link');
        }
        break;
      default:
        logger.warn('⚙️ Unknown settings action:', action);
    }
  }, [handleEdit, handleFork, handleShare, handleUnstar, handleDelete]);

  // 작성자 프로필로 이동
  const handleAuthorPress = useCallback((author) => {
    logger.debug('👤 Author pressed:', author.username);
    
    navigation.navigate('userProfile', {
      userId: author.id || author.user_id,
      username: author.username,
      profileData: author,
      returnToScreen: 'noteDetail'
    });
  }, [navigation]);

  return {
    // 기본 네비게이션
    handleBack,
    
    // 노트 액션들
    handleEdit,
    handleFork,
    handleShare,
    handleUnstar,
    handleDelete,
    handleSettingsAction,
    
    // 기타
    handleAuthorPress,
    
    // Route params (필요한 경우 접근용)
    returnToScreen,
    returnToTab
  };
};