import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import SwipeableNoteItem from '../components/SwipeableNoteItem';
import { useNotesStore } from '../store/NotesStore';
import BottomNavigationComponent from '../components/BottomNavigationComponent';


const categories = ['Trending', 'Following', 'Idea', 'Routine', 'Journal'];

const ExploreScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState(2); // Explore is index 2 (zap)
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Trending');
  const { globalPublicNotes, toggleStarred, isStarred } = useNotesStore();
  
  console.log('🌍 ExploreScreen - globalPublicNotes:', globalPublicNotes?.length || 0, 'notes');
  
  // Use global public notes (from all users) for explore page
  const exploreNotes = globalPublicNotes || [];
  
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
            >
              {/* Search Results */}
              {searchQuery.trim().length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
                  </Text>
                  {!isSearching && searchResults.length > 0 ? (
                    searchResults.map((note) => (
                      <SwipeableNoteItem
                        key={note.id}
                        note={note}
                        onPress={() => handleNotePress(note)}
                        onDelete={() => {}} // Explore notes can't be deleted
                        isPublic={true}
                      />
                    ))
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
                  {/* Other Users' Notes */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Explore notes</Text>
                    {transformedNotes.map((note) => (
                      <SwipeableNoteItem
                        key={note.id}
                        note={note}
                        onPress={() => handleNotePress(note)}
                        onDelete={() => {}} // Explore notes can't be deleted
                        isPublic={true}
                      />
                    ))}
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
});

export default ExploreScreen;