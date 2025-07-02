import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import NoteItemComponent from '../components/NoteItemComponent';
import BottomNavigationComponent from '../components/BottomNavigationComponent';

// Mock search results
const mockSearchResults = [
  {
    id: 1,
    title: 'React Native Best Practices',
    content: 'Complete guide to React Native development patterns and performance optimization...',
    createdAt: '2 hours ago',
    author: '@reactdev',
    isPublic: true,
    forkCount: 34,
  },
  {
    id: 2,
    title: 'JavaScript Performance Tips',
    content: 'Essential techniques to optimize your JavaScript code for better performance...',
    createdAt: '1 day ago',
    author: '@jsexpert',
    isPublic: true,
    forkCount: 23,
  },
  {
    id: 3,
    title: 'My project ideas',
    content: 'Collection of project ideas for mobile app development...',
    createdAt: '3 days ago',
    author: '@yourname',
    isPublic: false,
    forkCount: 0,
  },
];

const mockRecentSearches = [
  'React hooks',
  'JavaScript',
  'Mobile design',
  'API integration',
];

const mockSuggestions = [
  'React Native',
  'Node.js',
  'Design systems',
  'Performance optimization',
  'TypeScript',
];

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState(1); // Search is index 1

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      // Simulate search API call
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    } else {
      setIsSearching(false);
    }
  };

  const handleNotePress = (note) => {
    console.log('Note pressed:', note.title);
    // Navigate to note detail
  };

  const handleRecentSearchPress = (searchTerm) => {
    handleSearch(searchTerm);
  };

  const handleSuggestionPress = (suggestion) => {
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleNavChange = (tabIndex) => {
    setActiveNavTab(tabIndex);
    switch (tabIndex) {
      case 0:
        navigation.navigate('home');
        break;
      case 1:
        // Current screen (Search)
        break;
      case 2:
        navigation.navigate('explore');
        break;
      case 3:
        navigation.navigate('profile');
        break;
    }
  };

  const showResults = searchQuery.trim().length > 0;
  const showRecentAndSuggestions = !showResults;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Search</Text>
          </View>

          <View style={styles.contentWithPadding}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Icon name="search" size={20} color={Colors.secondaryText} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search notes, users, topics..."
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
              {showResults && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
                  </Text>
                  {!isSearching && mockSearchResults
                    .filter(note => 
                      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      note.content.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((note) => (
                      <NoteItemComponent
                        key={note.id}
                        title={note.title}
                        timeAgo={note.createdAt}
                        onPress={() => handleNotePress(note)}
                      />
                    ))}
                  {!isSearching && mockSearchResults.filter(note => 
                    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    note.content.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <View style={styles.emptyState}>
                      <Icon name="search" size={48} color={Colors.secondaryText} />
                      <Text style={styles.emptyStateText}>No results found</Text>
                      <Text style={styles.emptyStateSubtext}>Try searching with different keywords</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Recent Searches & Suggestions */}
              {showRecentAndSuggestions && (
                <>
                  {/* Recent Searches */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    <View style={styles.chipContainer}>
                      {mockRecentSearches.map((search, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.chip}
                          onPress={() => handleRecentSearchPress(search)}
                        >
                          <Icon name="clock" size={16} color={Colors.secondaryText} />
                          <Text style={styles.chipText}>{search}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Suggestions */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Suggestions</Text>
                    <View style={styles.chipContainer}>
                      {mockSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.chip}
                          onPress={() => handleSuggestionPress(suggestion)}
                        >
                          <Icon name="trending-up" size={16} color={Colors.secondaryText} />
                          <Text style={styles.chipText}>{suggestion}</Text>
                        </TouchableOpacity>
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
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  contentWithPadding: {
    flex: 1,
    paddingHorizontal: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 100, // Space for floating navigation
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius,
    marginBottom: Layout.spacing.sm,
  },
  chipText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginLeft: Layout.spacing.xs,
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

export default SearchScreen;