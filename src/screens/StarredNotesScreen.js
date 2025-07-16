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

const StarredNotesScreen = ({ navigation }) => {
  const [starredNotes, setStarredNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStarredNotes();
  }, []);

  const loadStarredNotes = async () => {
    setLoading(true);
    
    // Mock data for starred notes from other users
    const mockStarredNotes = [
      {
        id: 'starred_1',
        title: 'Morning Routine for Productivity',
        content: '# Daily Morning Routine\n\n## 6:00 AM - Wake Up\n- Drink a glass of water\n- 5 minutes of deep breathing\n\n## 6:15 AM - Exercise\n- 20 minutes cardio\n- 10 minutes stretching\n\n## 6:45 AM - Journaling\n- Write 3 things I\'m grateful for\n- Set daily intentions\n\n## 7:00 AM - Breakfast\n- Healthy protein + fruit\n- Review daily schedule',
        author: {
          id: 'user_1',
          name: 'Sarah Chen',
          avatar: '👩‍💻',
        },
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-01-15T08:30:00Z',
        isPublic: true,
        forkCount: 24,
        starCount: 189,
        tags: ['productivity', 'morning', 'routine'],
        starredAt: '2024-01-16T10:00:00Z',
      },
      {
        id: 'starred_2',
        title: 'React Native Best Practices',
        content: '# React Native Development Tips\n\n## Performance Optimization\n- Use FlatList for large lists\n- Implement proper key props\n- Avoid inline functions in render\n\n## Code Organization\n- Keep components small and focused\n- Use custom hooks for logic\n- Implement proper error boundaries\n\n## Testing Strategy\n- Unit tests for utilities\n- Integration tests for components\n- E2E tests for critical flows',
        author: {
          id: 'alexnwkim',
          name: 'alexnwkim',
          avatar: '👨‍💻',
        },
        createdAt: '2024-01-14T14:20:00Z',
        updatedAt: '2024-01-14T14:20:00Z',
        isPublic: true,
        forkCount: 18,
        starCount: 156,
        tags: ['react-native', 'development', 'best-practices'],
        starredAt: '2024-01-15T16:30:00Z',
        isOwnNote: true,
      },
      {
        id: 'starred_3',
        title: 'Investment Portfolio Strategy',
        content: '# Personal Investment Strategy\n\n## Asset Allocation\n- 60% Stock Index Funds\n- 30% Bond Index Funds\n- 10% REITs\n\n## Monthly Investment Plan\n- $1000 total monthly investment\n- $600 to stock index funds\n- $300 to bond funds\n- $100 to REITs\n\n## Rebalancing Schedule\n- Review quarterly\n- Rebalance if allocation drifts >5%\n- Tax-loss harvest in December',
        author: {
          id: 'user_3',
          name: 'Jennifer Kim',
          avatar: '👩‍💼',
        },
        createdAt: '2024-01-13T11:45:00Z',
        updatedAt: '2024-01-13T11:45:00Z',
        isPublic: true,
        forkCount: 31,
        starCount: 287,
        tags: ['finance', 'investing', 'strategy'],
        starredAt: '2024-01-14T09:15:00Z',
      },
      {
        id: 'starred_4',
        title: 'Meal Prep Sunday Ideas',
        content: '# Weekly Meal Prep Guide\n\n## Breakfast Options\n- Overnight oats with berries\n- Egg muffins with vegetables\n- Greek yogurt parfait\n\n## Lunch Ideas\n- Quinoa bowl with roasted vegetables\n- Chicken and rice with steamed broccoli\n- Lentil salad with feta cheese\n\n## Dinner Plans\n- Sheet pan salmon with asparagus\n- Slow cooker chicken stew\n- Vegetarian chili with cornbread\n\n## Prep Tips\n- Wash and chop vegetables on Sunday\n- Cook grains in bulk\n- Marinate proteins overnight',
        author: {
          id: 'alexnwkim',
          name: 'alexnwkim',
          avatar: '👨‍🍳',
        },
        createdAt: '2024-01-12T16:00:00Z',
        updatedAt: '2024-01-12T16:00:00Z',
        isPublic: true,
        forkCount: 42,
        starCount: 324,
        tags: ['meal-prep', 'cooking', 'healthy'],
        starredAt: '2024-01-13T12:30:00Z',
        isOwnNote: true,
      },
    ];

    setTimeout(() => {
      setStarredNotes(mockStarredNotes);
      setLoading(false);
    }, 1000);
  };

  const handleNotePress = (note) => {
    navigation.navigate('noteDetail', {
      note: note,
      isStarred: true,
      returnToScreen: 'starredNotes',
      onFork: () => handleForkNote(note),
      onUnstar: () => handleUnstarNote(note.id),
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
    Alert.alert(
      'Remove from Starred',
      'Remove this note from your starred collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setStarredNotes(prev => prev.filter(note => note.id !== noteId));
          },
        },
      ]
    );
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
});

export default StarredNotesScreen;