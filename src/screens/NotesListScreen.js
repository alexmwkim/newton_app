import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { Spacing } from '../constants/StyleControl';
import PublicNoteCard from '../components/PublicNoteCard';
import SwipeableNoteItem from '../components/SwipeableNoteItem';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';
import NotesService from '../services/notes';
import { getConsistentAvatarUrl, getConsistentUsername } from '../utils/avatarUtils';
import { UnifiedHeader } from '../shared/components/layout';
import BottomNavigationComponent from '../components/BottomNavigationComponent';

const NotesListScreen = ({ navigation, route }) => {
  const { 
    listType,           // 'myNotes', 'starredNotes', 'recent'
    username,           // User whose notes to show
    userId,             // User ID whose notes to show
    userProfile,        // Full user profile data
    title,              // Screen title
    isCurrentUser = false
  } = route.params || {};

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState(3); // Profile 탭에서 온 경우가 많음

  const { user, profile } = useAuth();
  const { publicNotes, privateNotes, getStarredNotes } = useNotesStore();

  // Get display username
  const displayUsername = userProfile?.username || username || 'Unknown User';
  
  // SECURITY CRITICAL: Only allow private notes for exact current user match
  // Use ONLY the isCurrentUser flag passed from navigation - do not infer
  const isActuallyCurrentUser = isCurrentUser === true;
  
  // Override title for current user to always show "My Notes" / "Starred Notes"
  const getFinalTitle = () => {
    if (listType === 'myNotes' && isActuallyCurrentUser) {
      return 'My Notes';
    } else if (listType === 'starredNotes' && isActuallyCurrentUser) {
      return 'Starred Notes';
    } else {
      return title || getDefaultTitle();
    }
  };
  
  const displayTitle = getFinalTitle();

  // Debug logging for title logic (can be removed in production)
  console.log('🔍 NotesListScreen title resolved:', {
    listType,
    displayUsername,
    isCurrentUser,
    isActuallyCurrentUser,
    finalTitle: displayTitle
  });

  function getDefaultTitle() {
    const defaultTitle = (() => {
      switch (listType) {
        case 'myNotes':
          return isActuallyCurrentUser ? 'My Notes' : `${displayUsername}'s Notes`;
        case 'starredNotes':
          return isActuallyCurrentUser ? 'Starred Notes' : `${displayUsername}'s Starred Notes`;
        case 'recent':
          return 'Recent Notes';
        default:
          return 'Notes';
      }
    })();
    
    return defaultTitle;
  }

  useEffect(() => {
    loadNotes();
  }, [listType, userId, isCurrentUser, isActuallyCurrentUser]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      let notesData = [];

      switch (listType) {
        case 'myNotes':
          notesData = await loadMyNotes();
          break;
        case 'starredNotes':
          notesData = await loadStarredNotes();
          break;
        case 'recent':
          notesData = await loadRecentNotes();
          break;
        default:
          notesData = [];
      }

      setNotes(notesData);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyNotes = async () => {
    try {
      console.log('🔒 SECURITY CHECK - Loading my notes for:', { 
        isCurrentUser, 
        isActuallyCurrentUser, 
        userId, 
        displayUsername,
        currentUserId: user?.id
      });

      // SECURITY CRITICAL: Only show private notes if EXACTLY the current user
      if (isCurrentUser === true && user?.id) {
        console.log('✅ SECURITY OK: Current user accessing own notes - including private');
        const allNotes = [...(publicNotes || []), ...(privateNotes || [])];
        return allNotes.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      } else {
        // For other users OR any uncertain cases, load ONLY public notes
        console.log('🔒 SECURITY ENFORCED: Loading PUBLIC NOTES ONLY for user:', userId);
        const actualUserId = userProfile?.user_id || userId;
        const { data, error } = await NotesService.getUserNotes(actualUserId, true); // true = public only
        
        if (error) {
          console.error('❌ Error loading user notes:', error);
          return [];
        }
        
        console.log('✅ Loaded user PUBLIC notes only:', data?.length || 0);
        return data || [];
      }
    } catch (error) {
      console.error('Error loading my notes:', error);
      return [];
    }
  };

  const loadStarredNotes = async () => {
    try {
      console.log('⭐ Loading starred notes for:', { isCurrentUser, isActuallyCurrentUser, userId, displayUsername });

      if (isCurrentUser === true && user?.id) {
        // For current user, use NotesStore starred notes
        console.log('✅ Using NotesStore starred notes for current user');
        const starredNotes = getStarredNotes();
        return starredNotes || [];
      } else {
        // For other users, load their starred notes from Supabase
        console.log('📥 Loading starred notes from Supabase for user:', userId);
        const actualUserId = userProfile?.user_id || userId;
        const { data, error } = await NotesService.getStarredNotes(actualUserId, 20, 0);
        
        if (error) {
          console.error('❌ Error loading starred notes:', error);
          return [];
        }
        
        console.log('✅ Loaded starred notes:', data?.length || 0);
        return data || [];
      }
    } catch (error) {
      console.error('Error loading starred notes:', error);
      return [];
    }
  };

  const loadRecentNotes = async () => {
    try {
      console.log('🕐 Loading recent notes');
      const { data, error } = await NotesService.getRecentNotes(50, 0);
      
      if (error) {
        console.error('❌ Error loading recent notes:', error);
        return [];
      }
      
      console.log('✅ Loaded recent notes:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error loading recent notes:', error);
      return [];
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const handleNavChange = (tabIndex) => {
    setActiveNavTab(tabIndex);
    switch (tabIndex) {
      case 0:
        navigation.navigate('home');
        break;
      case 1:
        navigation.navigate('search');
        break;
      case 2:
        navigation.navigate('explore');
        break;
      case 3:
        navigation.navigate('profile');
        break;
    }
  };

  const handleNotePress = (note) => {
    console.log('Note pressed:', note.title);
    navigation.navigate('noteDetail', { 
      noteId: note.id,
      returnToScreen: 'notesList',
      // Pass current screen params so goBack can restore them
      listType,
      username,
      userId,
      userProfile,
      title,
      isCurrentUser: isActuallyCurrentUser,
      originScreen: route.params?.originScreen || (isActuallyCurrentUser ? 'profile' : 'userProfile'),
      profileData: route.params?.profileData
    });
  };

  const renderNote = (note, index) => {
    const isPublic = note.isPublic !== false && note.is_public !== false;
    
    if (isActuallyCurrentUser && (listType === 'myNotes')) {
      // For current user's notes, use SwipeableNoteItem (supports both public and private)
      return (
        <SwipeableNoteItem
          key={note.id}
          note={{
            ...note,
            isPublic,
            starCount: note.starCount || note.star_count || 0,
            forkCount: note.forkCount || note.fork_count || 0,
            username: displayUsername
          }}
          onPress={() => handleNotePress(note)}
          style={styles.noteItem}
        />
      );
    } else {
      // For other cases, use PublicNoteCard
      const noteAuthor = getConsistentUsername({
        userId: note.user_id,
        currentUser: user,
        currentProfile: profile,
        profiles: note.profiles,
        username: note.username
      });
      
      const avatarUrl = getConsistentAvatarUrl({
        userId: note.user_id,
        currentUser: user,
        currentProfile: profile,
        currentProfilePhoto: profile?.avatar_url,
        profiles: note.profiles,
        avatarUrl: note.avatar_url || userProfile?.avatar_url,
        username: noteAuthor
      });

      return (
        <PublicNoteCard
          key={note.id}
          username={noteAuthor}
          title={note.title || 'Untitled'}
          forksCount={note.forkCount || note.fork_count || 0}
          starsCount={note.starCount || note.star_count || 0}
          avatarUrl={avatarUrl}
          onPress={() => handleNotePress(note)}
          style={styles.noteCard}
        />
      );
    }
  };

  const renderEmptyState = () => {
    let icon, title, subtitle;

    switch (listType) {
      case 'myNotes':
        icon = 'file-text';
        title = isActuallyCurrentUser ? 'No notes yet' : `${displayUsername} hasn't shared any notes`;
        subtitle = isActuallyCurrentUser ? 'Create your first note to get started' : 'Check back later for new content';
        break;
      case 'starredNotes':
        icon = 'star';
        title = isActuallyCurrentUser ? 'No starred notes' : `${displayUsername} has no starred notes`;
        subtitle = isActuallyCurrentUser ? 'Star notes to save them here' : 'Check back later for new starred notes';
        break;
      case 'recent':
        icon = 'clock';
        title = 'No recent notes';
        subtitle = 'Check back later for new content';
        break;
      default:
        icon = 'file';
        title = 'No notes found';
        subtitle = 'Try again later';
    }

    return (
      <View style={styles.emptyState}>
        <Icon name={icon} size={48} color={Colors.secondaryText} />
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.mainBackground} />
      
      <UnifiedHeader
        title={displayTitle}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
          />
        }
      >
          {loading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : notes.length > 0 ? (
            <View style={styles.notesContainer}>
              {notes.map((note, index) => renderNote(note, index))}
            </View>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
        
      {/* Floating Elements - Bottom Navigation */}
      <View style={styles.floatingElements}>
        <BottomNavigationComponent
          activeTab={activeNavTab}
          onTabChange={handleNavChange}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.mainBackground,
  },
  content: {
    flex: 1,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  
  // Direct header implementation (same as NoteDetailScreen)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textBlack,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    alignItems: 'flex-end',
    marginRight: 12,
    width: 40, // Same width as back button for balance
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screen.horizontal,
    paddingTop: Layout.spacing.md,
  },
  notesContainer: {
    gap: Layout.spacing.sm,
  },
  noteItem: {
    marginBottom: Layout.spacing.sm,
  },
  noteCard: {
    marginBottom: Layout.spacing.sm,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl * 2,
  },
  loadingText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl * 3,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.heading,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
    maxWidth: 250,
  },
  floatingElements: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
});

export default NotesListScreen;