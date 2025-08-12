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

  // Check social status on component mount
  React.useEffect(() => {
    if (user && noteId) {
      checkNoteSocialStatus(noteId, user.id);
    }
  }, [noteId, user?.id, checkNoteSocialStatus]);

  const handleStar = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You need to log in to add a star.');
      return;
    }

    if (user.id === authorId) {
      Alert.alert('Notice', 'You cannot star your own note.');
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
      Alert.alert('Error', error.message || 'An error occurred while processing the star.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFork = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You need to log in to fork this note.');
      return;
    }

    if (user.id === authorId) {
      Alert.alert('Notice', 'You cannot fork your own note.');
      return;
    }

    if (isForked) {
      Alert.alert('Notice', 'You have already forked this note.');
      return;
    }

    Alert.alert(
      'Fork Note',
      'Do you want to fork this note? The forked note will be saved as a private note.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fork',
          onPress: async () => {
            setIsLoading(true);
            try {
              await forkNote(noteId, user.id);
              Alert.alert('Success', 'Note has been successfully forked!');
            } catch (error) {
              Alert.alert('Error', error.message || 'An error occurred while forking.');
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