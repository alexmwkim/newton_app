import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import SwipeableNoteItem from '../components/SwipeableNoteItem';
import PublicNoteCard from '../components/PublicNoteCard';
import { useNotesStore } from '../store/NotesStore';
import { useSocialStore } from '../store/SocialStore';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigationComponent from '../components/BottomNavigationComponent';
import NotesService from '../services/notes';
import Avatar from '../components/Avatar';
import { getConsistentAvatarUrl, getConsistentUsername } from '../utils/avatarUtils';


const categories = ['Trending', 'Following', 'Idea', 'Routine', 'Journal'];

const ExploreScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState(2); // Explore is index 2 (zap)
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [refreshing, setRefreshing] = useState(false);
  
  const { user, profile } = useAuth();
  
  // Get consistent username for all notes
  const getUsernameForDisplay = () => {
    return profile?.username || user?.username || user?.email?.split('@')[0] || 'Unknown';
  };
  const notesStore = useNotesStore();
  const { globalPublicNotes, toggleStarred, isStarred } = notesStore;
  const { 
    feed, 
    feedLoading, 
    loadFeed, 
    refreshFeed,
    loadPopularAuthors,
    popularAuthors 
  } = useSocialStore();
  
  console.log('🌍 ExploreScreen - feed:', feed?.length || 0, 'notes');
  
  // State for real public notes
  const [realPublicNotes, setRealPublicNotes] = useState([]);
  
  // Use social feed for explore page, fallback to real public notes if feed is empty
  const exploreNotes = feed.length > 0 ? feed : realPublicNotes;
  
  console.log('🌍 ExploreScreen data source:', feed.length > 0 ? 'Social Feed' : 'Real Public Notes');
  console.log('🌍 Feed loading:', feedLoading, 'Feed length:', feed.length, 'Real public notes length:', realPublicNotes?.length || 0);
  
  // Debug: Log note authors to understand the data structure
  console.log('🌍 Debug - First few notes with author info:');
  exploreNotes.slice(0, 3).forEach((note, idx) => {
    console.log(`🌍 Note ${idx}:`, {
      id: note.id,
      title: note.title,
      user_id: note.user_id,
      userId: note.userId,
      username: note.username,
      profiles: note.profiles,
      user: note.user
    });
  });

  // Function to clean up unwanted user data
  const cleanupUnwantedUser = async (targetUserId) => {
    try {
      const { supabase } = await import('../services/supabase');
      console.log('🧹 Starting cleanup for user:', targetUserId);
      
      // 1. Delete user's notes
      const { data: deletedNotes, error: notesError } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', targetUserId)
        .select();
      
      if (notesError) {
        console.error('🧹 Error deleting notes:', notesError);
      } else {
        console.log('🧹 Deleted notes:', deletedNotes?.length || 0);
      }
      
      // 2. Delete from stars table
      const { data: deletedStars, error: starsError } = await supabase
        .from('stars')
        .delete()
        .eq('user_id', targetUserId)
        .select();
      
      if (starsError) {
        console.error('🧹 Error deleting stars:', starsError);
      } else {
        console.log('🧹 Deleted stars:', deletedStars?.length || 0);
      }
      
      // 3. Delete from pinned notes
      const { data: deletedPinned, error: pinnedError } = await supabase
        .from('user_pinned_notes')
        .delete()
        .eq('user_id', targetUserId)
        .select();
      
      if (pinnedError) {
        console.error('🧹 Error deleting pinned notes:', pinnedError);
      } else {
        console.log('🧹 Deleted pinned notes:', deletedPinned?.length || 0);
      }
      
      // 4. Delete profile
      const { data: deletedProfile, error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', targetUserId)
        .select();
      
      if (profileError) {
        console.error('🧹 Error deleting profile:', profileError);
      } else {
        console.log('🧹 Deleted profile:', deletedProfile);
      }
      
      console.log('🧹 ✅ Cleanup completed for user:', targetUserId);
      
    } catch (error) {
      console.error('🧹 Error during cleanup:', error);
    }
  };


  // Load social feed on mount
  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        console.log('🌍 ExploreScreen useEffect - Loading ALL data for user:', user.id);
        
        // Force load real public notes from Supabase directly
        try {
          console.log('🔄 Forcing real public notes load...');
          const { data: publicNotesData, error } = await NotesService.getPublicNotes(20, 0, 'created_at');
          if (!error && publicNotesData) {
            console.log('✅ Real public notes loaded:', publicNotesData.length, 'notes');
            console.log('📋 First real note:', publicNotesData[0] ? {
              id: publicNotesData[0].id,
              title: publicNotesData[0].title,
              user_id: publicNotesData[0].user_id,
              profiles: publicNotesData[0].profiles
            } : 'No notes');
            setRealPublicNotes(publicNotesData);
          } else {
            console.error('❌ Failed to load real public notes:', error);
            setRealPublicNotes([]);
          }
        } catch (err) {
          console.error('❌ Exception loading real public notes:', err);
          setRealPublicNotes([]);
        }
        
        // Also load social feed
        loadFeed(user.id, true); // Force refresh to get latest data
        loadPopularAuthors();
      }
    };
    
    loadData();
  }, [user?.id, loadFeed, loadPopularAuthors]);
  
  // Transform notes to match SwipeableNoteItem format (keep original note structure)
  const transformedNotes = exploreNotes.map(note => ({
    ...note,
    // Ensure required fields for SwipeableNoteItem
    isPublic: true,
    is_public: true,
    starCount: note.starCount || note.star_count || 0,
    forkCount: note.forksCount || note.forkCount || note.fork_count || 0,
    username: note.username || note.profiles?.username || 'Unknown'
  }));

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      // Filter notes based on search query
      const filteredNotes = transformedNotes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        (note.content || '').toLowerCase().includes(query.toLowerCase()) ||
        (note.username || '').toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filteredNotes);
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleNotePress = (note) => {
    console.log('Note pressed:', note.title);
    navigation.navigate('noteDetail', { 
      noteId: note.id,
      returnToScreen: 'explore' // Return to explore screen after viewing note
    });
  };

  const handleStarNote = (noteId) => {
    toggleStarred(noteId);
  };

  const handleForkNote = (noteId) => {
    console.log('Forking note:', noteId);
    // TODO: Implement fork functionality with Supabase
  };

  const handleRefresh = async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    try {
      // Refresh real public notes
      const { data: publicNotesData, error } = await NotesService.getPublicNotes(20, 0, 'created_at');
      if (!error && publicNotesData) {
        setRealPublicNotes(publicNotesData);
      }
      
      await refreshFeed(user.id);
      await loadPopularAuthors();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
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
        // Current screen (Explore)
        break;
      case 3:
        navigation.navigate('profile');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Explore</Text>
          </View>

          <View style={styles.contentWithPadding}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Icon name="search" size={20} color={Colors.secondaryText} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Notes"
                  placeholderTextColor={Colors.secondaryText}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                    <Icon name="x" size={20} color={Colors.secondaryText} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Category Filter Tabs */}
            <View style={styles.categoryContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {categories.map((category, index) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryTab,
                      activeCategory === category && styles.activeCategoryTab,
                      index === 0 && styles.firstCategoryTab
                    ]}
                    onPress={() => setActiveCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      activeCategory === category && styles.activeCategoryText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

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
              {/* Search Results */}
              {searchQuery.trim().length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
                  </Text>
                  {!isSearching && searchResults.length > 0 ? (
                    searchResults.map((note) => {
                      // Get consistent username using helper function
                      const noteAuthor = getConsistentUsername({
                        userId: note.user_id,
                        currentUser: user,
                        currentProfile: profile,
                        profiles: note.profiles,
                        username: note.username || note.user?.username
                      });
                      
                      // Get consistent avatar URL using helper function
                      const resolvedAvatarUrl = getConsistentAvatarUrl({
                        userId: note.user_id,
                        currentUser: user,
                        currentProfile: profile,
                        currentProfilePhoto: profile?.avatar_url,
                        profiles: note.profiles,
                        avatarUrl: note.avatar_url || note.user?.avatar_url,
                        username: noteAuthor
                      });
                      
                      return (
                        <PublicNoteCard
                          key={note.id}
                          username={noteAuthor}
                          title={note.title || 'Untitled'}
                          forksCount={note.forkCount || note.fork_count || 0}
                          starsCount={note.starCount || note.star_count || 0}
                          avatarUrl={resolvedAvatarUrl}
                          onPress={() => handleNotePress(note)}
                        />
                      );
                    })
                  ) : !isSearching ? (
                    <View style={styles.emptyState}>
                      <Icon name="search" size={48} color={Colors.secondaryText} />
                      <Text style={styles.emptyStateText}>No results found</Text>
                      <Text style={styles.emptyStateSubtext}>Try searching with different keywords</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <>
                  {/* Popular Authors Section */}
                  {popularAuthors.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Popular Notetakers</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.authorsScrollContent}
                      >
                        {popularAuthors.slice(0, 5).map((author, index) => {
                          // DEBUG: Log each author in the list
                          console.log(`📋 Popular Author ${index}:`, {
                            id: author.id,
                            user_id: author.user_id,
                            username: author.username,
                            hasAllRequiredFields: !!(author.id && author.user_id && author.username)
                          });
                          
                          return (
                          <TouchableOpacity 
                            key={author.id} 
                            style={[styles.authorCard, index === 0 && styles.firstAuthorCard]}
                            onPress={() => {
                              console.log('🔥 AUTHOR CARD PRESSED!', author.username);
                              // ENHANCED DEBUG: Log complete author object
                              console.log('🔍 FULL AUTHOR OBJECT:', JSON.stringify(author, null, 2));
                              console.log('🔍 Author keys:', Object.keys(author));
                              console.log('🔍 Author.id:', author.id);
                              console.log('🔍 Author.user_id:', author.user_id);
                              console.log('🔍 Author.username:', author.username);
                              
                              console.log('Navigate to profile:', author.id, author.username);
                              console.log('Current user ID:', user?.id);
                              console.log('Current user username:', getUsernameForDisplay());
                              
                              // ALWAYS navigate to UserProfileScreen from Explore page for better UX
                              // Users expect to return to Explore page when pressing back button
                              console.log('Navigating to user profile from Explore page:', author.username);
                              console.log('Navigation params will be:', { 
                                userId: author.user_id, // Using user_id as intended
                                username: author.username || 'Unknown',
                                profileData: author,
                                isCurrentUser: author.user_id === user?.id // Flag to indicate if it's current user (use user_id for accuracy)
                              });
                              
                              // SAFETY CHECK: Ensure we have required data before navigating
                              if (!author.user_id && !author.id) {
                                console.error('❌ CRITICAL: Author has no user_id or id:', author);
                                Alert.alert('Error', 'Cannot navigate - missing user information');
                                return;
                              }
                              
                              // Use fallbacks if data is missing
                              const navigationParams = {
                                userId: author.user_id || author.id, // Fallback to id if user_id missing
                                username: author.username || 'Unknown User',
                                profileData: author,
                                isCurrentUser: (author.user_id || author.id) === user?.id
                              };
                              
                              console.log('🚀 FINAL NAVIGATION PARAMS:', JSON.stringify(navigationParams, null, 2));
                              
                              try {
                                navigation.navigate('userProfile', navigationParams);
                              } catch (error) {
                                console.error('Navigation error:', error);
                                Alert.alert('Error', 'Failed to navigate to user profile: ' + error.message);
                              }
                            }}
                          >
                            <Avatar
                              size="medium"
                              imageUrl={getConsistentAvatarUrl({
                                userId: author.user_id || author.id, // Fallback to author.id if user_id not available
                                currentUser: user,
                                currentProfile: profile,
                                currentProfilePhoto: profile?.avatar_url,
                                profiles: author,
                                avatarUrl: author.avatar_url,
                                username: author.username
                              })}
                              username={getConsistentUsername({
                                userId: author.user_id || author.id, // Fallback to author.id if user_id not available
                                currentUser: user,
                                currentProfile: profile,
                                profiles: author,
                                username: author.username
                              })}
                            />
                            <Text style={styles.authorName} numberOfLines={1}>
                              {author.username || 'Unknown'}
                            </Text>
                            <Text style={styles.authorStats}>
                              {author.notes?.length || 0} notes
                            </Text>
                          </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Social Feed */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      {activeCategory === 'Trending' ? 'Trending Notes' : 
                       activeCategory === 'Following' ? 'Following' : 
                       'Explore Notes'}
                    </Text>
                    {feedLoading && exploreNotes.length === 0 ? (
                      <View style={styles.loadingState}>
                        <Text style={styles.loadingText}>Loading...</Text>
                      </View>
                    ) : exploreNotes.length > 0 ? (
                      exploreNotes.map((note) => {
                        // Get consistent username using helper function
                        const noteAuthor = getConsistentUsername({
                          userId: note.user_id,
                          currentUser: user,
                          currentProfile: profile,
                          profiles: note.profiles,
                          username: note.username || note.user?.username
                        });
                        
                        // Get consistent avatar URL using helper function
                        const resolvedAvatarUrl = getConsistentAvatarUrl({
                          userId: note.user_id,
                          currentUser: user,
                          currentProfile: profile,
                          currentProfilePhoto: profile?.avatar_url,
                          profiles: note.profiles,
                          avatarUrl: note.avatar_url || note.user?.avatar_url,
                          username: noteAuthor
                        });
                        
                        return (
                          <PublicNoteCard
                            key={note.id}
                            username={noteAuthor}
                            title={note.title || 'Untitled'}
                            forksCount={note.forkCount || note.fork_count || 0}
                            starsCount={note.starCount || note.star_count || 0}
                            avatarUrl={resolvedAvatarUrl}
                            onPress={() => handleNotePress(note)}
                          />
                        );
                      })
                    ) : (
                      <View style={styles.emptyState}>
                        <Icon name="globe" size={48} color={Colors.textSecondary} />
                        <Text style={styles.emptyStateText}>No notes to explore</Text>
                        <Text style={styles.emptyStateSubtext}>
                          Check back later for new content
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
        
        {/* Floating Elements - Bottom Navigation */}
        <View style={styles.floatingElements}>
          <BottomNavigationComponent
            activeTab={activeNavTab}
            onTabChange={handleNavChange}
          />
        </View>
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
    position: 'relative',
  },
  mainContent: {
    flex: 1,
    marginTop: 0,
  },
  header: {
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  contentWithPadding: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    marginVertical: Layout.spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mainBackground,
    borderRadius: 8,
    paddingHorizontal: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#D4CCC2',
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  clearButton: {
    padding: Layout.spacing.xs,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 100, // Space for floating navigation
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.heading,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginTop: Layout.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: Layout.spacing.sm,
    textAlign: 'center',
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.md,
  },
  floatingElements: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  categoryContainer: {
    marginBottom: Layout.spacing.md,
  },
  categoryScrollContent: {
    paddingLeft: 0,
    paddingRight: 16,
    alignItems: 'flex-start',
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: Layout.spacing.sm,
    borderRadius: 18,
    backgroundColor: '#F8F6F3',
  },
  activeCategoryTab: {
    backgroundColor: '#000000',
  },
  firstCategoryTab: {
    marginLeft: 0,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  activeCategoryText: {
    color: Colors.mainBackground,
  },
  noteCard: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    marginBottom: Layout.spacing.sm,
    padding: Layout.spacing.md,
  },
  noteCardContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Layout.spacing.sm for consistency
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm,
  },
  userName: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Layout.spacing.sm,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forkCount: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 12,
  },
  statText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridNoteCard: {
    width: '48%',
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    marginBottom: Layout.spacing.sm,
    padding: Layout.spacing.md,
  },
  gridNoteContent: {
    flex: 1,
  },
  gridNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  gridNoteTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Layout.spacing.sm,
  },
  gridNoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedCard: {
    marginHorizontal: 0,
    marginVertical: 6,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
  },
  authorsScrollContent: {
    paddingLeft: 0,
    paddingRight: 16,
  },
  authorCard: {
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  firstAuthorCard: {
    marginLeft: 0,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  authorAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorAvatarText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  authorName: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  authorStats: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ExploreScreen;