import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSocialStore } from '../store/SocialStore';
import { useAuth } from '../contexts/AuthContext';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const SocialInteractionBar = ({ 
  noteId, 
  authorId, 
  initialStarCount = 0, 
  initialForkCount = 0,
  style 
}) => {
  const { user } = useAuth();
  const isAuthor = user?.id === authorId;
  const {
    starNote,
    unstarNote,
    forkNote,
    isNoteStarred,
    isNoteForked,
    getNoteSocialCounts,
    checkNoteSocialStatus,
  } = useSocialStore();

  const [isLoading, setIsLoading] = React.useState(false);
  const isStarred = isNoteStarred(noteId);
  const isForked = isNoteForked(noteId);
  const socialCounts = getNoteSocialCounts(noteId);
  const starCount = socialCounts.stars || initialStarCount;
  const forkCount = socialCounts.forks || initialForkCount;

  // 컴포넌트 마운트시 소셜 상태 확인
  React.useEffect(() => {
    if (user && noteId) {
      checkNoteSocialStatus(noteId, user.id);
    }
  }, [noteId, user?.id, checkNoteSocialStatus]);

  const handleStar = async () => {
    if (!user) {
      Alert.alert('로그인 필요', '별표를 추가하려면 로그인이 필요합니다.');
      return;
    }

    if (user.id === authorId) {
      Alert.alert('알림', '자신의 노트에는 별표를 추가할 수 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      if (isStarred) {
        await unstarNote(noteId, user.id);
      } else {
        await starNote(noteId, user.id);
      }
    } catch (error) {
      Alert.alert('오류', error.message || '별표 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFork = async () => {
    if (!user) {
      Alert.alert('로그인 필요', '포크하려면 로그인이 필요합니다.');
      return;
    }

    if (user.id === authorId) {
      Alert.alert('알림', '자신의 노트는 포크할 수 없습니다.');
      return;
    }

    if (isForked) {
      Alert.alert('알림', '이미 포크한 노트입니다.');
      return;
    }

    Alert.alert(
      '노트 포크',
      '이 노트를 포크하시겠습니까? 포크된 노트는 개인 노트로 저장됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '포크',
          onPress: async () => {
            setIsLoading(true);
            try {
              await forkNote(noteId, user.id);
              Alert.alert('성공', '노트가 성공적으로 포크되었습니다!');
            } catch (error) {
              Alert.alert('오류', error.message || '포크 중 오류가 발생했습니다.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.statCount}>
        {starCount} stars
      </Text>
      <Text style={styles.statCount}>
        {forkCount} forks
      </Text>
      {!isAuthor && (
        <View style={styles.readOnlyIndicator}>
          <Feather name="eye" size={16} color={Colors.textSecondary} />
          <Text style={styles.readOnlyText}>Read only</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  statCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Typography.regular,
  },
  readOnlyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  readOnlyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.regular,
  },
});

export default SocialInteractionBar;