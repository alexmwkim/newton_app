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
    id: 1,
    title: 'Building a Mobile-First Design System',
    content: 'Complete guide to creating design systems that work across platforms...',
    createdAt: '2 hours ago',
    author: '@uxmaster',
    isPublic: true,
    forkCount: 45,
  },
  {
    id: 2,
    title: 'JavaScript Performance Tips',
    content: 'Essential techniques to optimize your JavaScript code for better performance...',
    createdAt: '4 hours ago',
    author: '@jsdev',
    isPublic: true,
    forkCount: 23,
  },
  {
    id: 3,
    title: 'Remote Work Best Practices',
    content: 'Lessons learned from 3 years of remote work and team management...',
    createdAt: '6 hours ago',
    author: '@remote_leader',
    isPublic: true,
    forkCount: 67,
  },
];

const mockRecentNotes = [
  {
    id: 4,
    title: 'Getting Started with React Native',
    content: 'A beginner-friendly guide to React Native development...',
    createdAt: '1 hour ago',
    author: '@rn_beginner',
    isPublic: true,
    forkCount: 5,
  },
  {
    id: 5,
    title: 'CSS Grid Layout Patterns',
    content: 'Common layout patterns using CSS Grid with examples...',
    createdAt: '3 hours ago',
    author: '@css_expert',
    isPublic: true,
    forkCount: 12,
  },
];

const ExploreScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState(2); // Explore is index 2 (zap)
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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
      const filteredRecent = mockRecentNotes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase()) ||
        note.author.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults([...filteredTrending, ...filteredRecent]);
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
                  placeholder="Search notes and users..."
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
                      <NoteItemComponent
                        key={note.id}
                        title={note.title}
                        timeAgo={note.createdAt}
                        onPress={() => handleNotePress(note)}
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
                  {/* Trending Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trending</Text>
                    {mockTrendingNotes.map((note) => (
                      <NoteItemComponent
                        key={note.id}
                        title={note.title}
                        timeAgo={note.createdAt}
                        onPress={() => handleNotePress(note)}
                      />
                    ))}
                  </View>

                  {/* Recent Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent</Text>
                    {mockRecentNotes.map((note) => (
                      <NoteItemComponent
                        key={note.id}
                        title={note.title}
                        timeAgo={note.createdAt}
                        onPress={() => handleNotePress(note)}
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
    fontWeight: Typography.fontWeight.bold,
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
    backgroundColor: Colors.noteCard,
    borderRadius: Layout.borderRadius,
    paddingHorizontal: Layout.spacing.md,
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
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
    fontSize: Typography.fontSize.heading,
    fontWeight: Typography.fontWeight.bold,
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
});

export default ExploreScreen;