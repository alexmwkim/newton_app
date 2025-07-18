import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import StarredNoteCard from '../components/StarredNoteCard';
import { useNotesStore } from '../store/NotesStore';

const StarredNotesScreen = ({ navigation }) => {
  const [starredNotes, setStarredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toggleStarred, isStarred, getStarredNotes, debugStarredState, clearAllStarredNotes } = useNotesStore();

  useEffect(() => {
    console.log('📱 StarredNotesScreen mounted, loading starred notes');
    loadStarredNotes();
  }, []);

  const loadStarredNotes = async () => {
    console.log('📱 StarredNotesScreen: Starting to load starred notes...');
    setLoading(true);
    
    // Get starred notes from the global store
    const actualStarredNotes = getStarredNotes();
    console.log('📱 Raw starred notes from store:', actualStarredNotes);
    console.log('📱 Number of starred notes:', actualStarredNotes.length);
    
    if (actualStarredNotes.length > 0) {
      console.log('📱 First starred note:', actualStarredNotes[0]);
    }
    
    // Transform notes to match the expected format
    const transformedNotes = actualStarredNotes.map(note => {
      console.log('📱 Transforming note:', note.id, note.title);
      return {
        id: note.id,
        title: note.title,
        content: note.content || 'No content available...',
        author: {
          id: note.username || note.author,
          name: note.username || note.author,
          avatar: '👤'
        },
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: note.updatedAt || new Date().toISOString(),
        isPublic: note.isPublic,
        forkCount: note.forkCount || note.forksCount || 0,
        starCount: note.starCount || 0,
        tags: note.tags || ['note'],
        starredAt: new Date().toISOString()
      };
    });

    console.log('📱 Transformed notes:', transformedNotes);
    console.log('📱 Setting starred notes state...');

    setTimeout(() => {
      setStarredNotes(transformedNotes);
      setLoading(false);
      console.log('📱 Starred notes state updated, loading complete');
    }, 100);
  };

  const handleNotePress = (note) => {
    console.log('📱 Opening note detail for:', note.id, note.title);
    
    // Create the callback function - only refresh the list, don't toggle again
    const starredRemoveCallback = () => {
      console.log('🔄 StarredRemove callback called for note:', note.id);
      console.log('🔄 Note was already removed from starred, just refreshing list');
      loadStarredNotes(); // Just reload the list, don't toggle again
    };
    
    navigation.navigate('noteDetail', {
      noteId: note.id,
      note: note,
      isStarredNote: true,
      returnToScreen: 'starredNotes',
      onFork: () => handleForkNote(note),
      onUnstar: () => handleUnstarNote(note.id),
      onStarredRemove: starredRemoveCallback,
    });
  };

  const handleForkNote = (note) => {
    Alert.alert(
      'Fork Note',
      `Create your own version of "${note.title}"? This will create a copy that you can edit while preserving attribution to ${note.author.name}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fork',
          onPress: () => {
            // Create forked version
            const forkedNote = {
              id: `fork_${Date.now()}`,
              title: `${note.title} (My Version)`,
              content: note.content,
              isPublic: false,
              isPrivate: true,
              forkedFrom: {
                id: note.id,
                title: note.title,
                author: note.author,
                originalCreatedAt: note.createdAt,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: [...note.tags, 'forked'],
            };

            navigation.navigate('createNote', {
              note: forkedNote,
              isEditing: true,
              isForked: true,
              returnToScreen: 'starredNotes',
            });
          },
        },
      ]
    );
  };

  const handleUnstarNote = (noteId) => {
    console.log('🗑️ Removing note from starred list:', noteId);
    
    // Use the global toggleStarred function
    toggleStarred(noteId);
    
    // Reload the starred notes to reflect the change
    setTimeout(() => {
      loadStarredNotes();
    }, 100);
    
    console.log('✅ Note unstarred, reloading starred notes');
  };

  const handleBackPress = () => {
    navigation.navigate('profile');
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="star" size={48} color={Colors.iconInactive} />
      <Text style={styles.emptyTitle}>No Starred Notes</Text>
      <Text style={styles.emptySubtitle}>
        Star notes from other users to save them here for inspiration and forking.
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('explore')}
      >
        <Text style={styles.exploreButtonText}>Explore Public Notes</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Starred Notes</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading starred notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Starred Notes</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Debug Buttons */}
        <View style={styles.debugContainer}>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              console.log('🔍 Manual debug triggered');
              debugStarredState();
              loadStarredNotes();
            }}
          >
            <Text style={styles.debugButtonText}>Debug & Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.debugButton, styles.clearButton]}
            onPress={() => {
              console.log('🗑️ Clear all starred notes triggered');
              clearAllStarredNotes();
              loadStarredNotes();
            }}
          >
            <Text style={styles.debugButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {starredNotes.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.notesList}>
              {starredNotes.map((note) => (
                <StarredNoteCard
                  key={note.id}
                  note={note}
                  onPress={() => handleNotePress(note)}
                  onUnstar={() => handleUnstarNote(note.id)}
                  showDate={false}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.xl,
  },
  notesList: {
    paddingHorizontal: Layout.screen.padding,
    gap: Layout.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textPrimary,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  exploreButton: {
    backgroundColor: Colors.floatingButton,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: 10,
  },
  exploreButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.white,
  },
  debugContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screen.padding,
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  debugButton: {
    backgroundColor: Colors.floatingButton,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 8,
    flex: 1,
  },
  clearButton: {
    backgroundColor: '#ff4444',
  },
  debugButtonText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.white,
    textAlign: 'center',
  },
});

export default StarredNotesScreen;