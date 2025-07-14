import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import NoteItemComponent from '../components/NoteItemComponent';
import BottomNavigationComponent from '../components/BottomNavigationComponent';

// Mock data for explore screen
const mockTrendingNotes = [
  {
    id: 101,
    title: 'Building a Mobile-First Design System',
    content: 'Complete guide to creating design systems that work across platforms...',
    createdAt: '2 hours ago',
    author: 'userid001',
    isPublic: true,
    forkCount: 6,
    starCount: 23,
  },
  {
    id: 102,
    title: 'JavaScript Performance Tips',
    content: 'Essential techniques to optimize your JavaScript code for better performance...',
    createdAt: '4 hours ago',
    author: 'userid002',
    isPublic: true,
    forkCount: 5,
    starCount: 18,
  },
];

const mockPopularNotes = [
  {
    id: 103,
    title: 'Remote Work Best Practices',
    content: 'Lessons learned from 3 years of remote work and team management...',
    createdAt: '6 hours ago',
    author: 'userid003',
    isPublic: true,
    forkCount: 5,
    starCount: 31,
  },
  {
    id: 104,
    title: 'Getting Started with React Native',
    content: 'A beginner-friendly guide to React Native development...',
    createdAt: '1 hour ago',
    author: 'userid004',
    isPublic: true,
    forkCount: 5,
    starCount: 12,
  },
];

const categories = ['Trending', 'Following', 'Idea', 'Routine', 'Journal'];

const ExploreScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState(2); // Explore is index 2 (zap)
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Trending');

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      // Filter notes based on search query
      const filteredTrending = mockTrendingNotes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase()) ||
        note.author.toLowerCase().includes(query.toLowerCase())
      );
      const filteredPopular = mockPopularNotes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase()) ||
        note.author.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults([...filteredTrending, ...filteredPopular]);
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
                      <View key={note.id} style={styles.noteCard}>
                        <TouchableOpacity onPress={() => handleNotePress(note)} style={styles.noteCardContent}>
                          <View style={styles.noteHeader}>
                            <View style={styles.userInfo}>
                              <View style={styles.avatar}>
                                <Icon name="user" size={16} color={Colors.secondaryText} />
                              </View>
                              <Text style={styles.userName}>{note.author}</Text>
                            </View>
                          </View>
                          <Text style={styles.noteTitle}>{note.title}</Text>
                          <View style={styles.noteFooter}>
                            <View style={styles.statChip}>
                              <Icon name="star" size={12} color={Colors.secondaryText} />
                              <Text style={styles.statText}>{note.starCount}</Text>
                            </View>
                            <View style={styles.statChip}>
                              <Icon name="git-branch" size={12} color={Colors.secondaryText} />
                              <Text style={styles.statText}>{note.forkCount}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
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
                  {/* Trending Notes */}
                  <View style={styles.section}>
                    {mockTrendingNotes.map((note) => (
                      <View key={note.id} style={styles.noteCard}>
                        <TouchableOpacity onPress={() => handleNotePress(note)} style={styles.noteCardContent}>
                          <View style={styles.noteHeader}>
                            <View style={styles.userInfo}>
                              <View style={styles.avatar}>
                                <Icon name="user" size={16} color={Colors.secondaryText} />
                              </View>
                              <Text style={styles.userName}>{note.author}</Text>
                            </View>
                          </View>
                          <Text style={styles.noteTitle}>{note.title}</Text>
                          <View style={styles.noteFooter}>
                            <View style={styles.statChip}>
                              <Icon name="star" size={12} color={Colors.secondaryText} />
                              <Text style={styles.statText}>{note.starCount}</Text>
                            </View>
                            <View style={styles.statChip}>
                              <Icon name="git-branch" size={12} color={Colors.secondaryText} />
                              <Text style={styles.statText}>{note.forkCount}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  {/* Popular Notes Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Popular notes</Text>
                    <View style={styles.gridContainer}>
                      {mockPopularNotes.map((note) => (
                        <View key={note.id} style={styles.gridNoteCard}>
                          <TouchableOpacity onPress={() => handleNotePress(note)} style={styles.gridNoteContent}>
                            <View style={styles.gridNoteHeader}>
                              <View style={styles.userInfo}>
                                <View style={styles.avatar}>
                                  <Icon name="user" size={16} color={Colors.secondaryText} />
                                </View>
                                <Text style={styles.userName}>{note.author}</Text>
                              </View>
                            </View>
                            <Text style={styles.gridNoteTitle}>{note.title}</Text>
                            <View style={styles.gridNoteFooter}>
                              <View style={styles.statChip}>
                                <Icon name="star" size={12} color={Colors.secondaryText} />
                                <Text style={styles.statText}>{note.starCount}</Text>
                              </View>
                              <View style={styles.statChip}>
                                <Icon name="git-branch" size={12} color={Colors.secondaryText} />
                                <Text style={styles.statText}>{note.forkCount}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
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