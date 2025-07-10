import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import NoteItemComponent from '../components/NoteItemComponent';
import BottomNavigationComponent from '../components/BottomNavigationComponent';
import { useNotesStore } from '../store/NotesStore';



const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState(1); // Search is index 1
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load recent searches from AsyncStorage on component mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        console.log('🔍 Loading recent searches from storage...');
        const stored = await AsyncStorage.getItem('recentSearches');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('🔍 Loaded recent searches from storage:', parsed);
          setRecentSearches(parsed);
        } else {
          console.log('🔍 No recent searches found in storage');
        }
      } catch (error) {
        console.log('🔍 Error loading recent searches:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRecentSearches();
  }, []);
  
  // Save recent searches to AsyncStorage whenever they change
  const saveRecentSearches = async (searches) => {
    try {
      console.log('🔍 SAVING to AsyncStorage:', searches);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(searches));
      console.log('🔍 ✅ Successfully saved recent searches to storage:', searches);
      
      // Verify it was saved correctly
      const verification = await AsyncStorage.getItem('recentSearches');
      console.log('🔍 Verification - what was actually saved:', verification);
    } catch (error) {
      console.log('🔍 Error saving recent searches:', error);
    }
  };
  
  // Get all notes from the store
  const storeData = useNotesStore();
  console.log('🔍 Search - Store data:', storeData);
  const privateNotes = storeData.privateNotes || [];
  const publicNotes = storeData.publicNotes || [];
  const allNotes = [...privateNotes, ...publicNotes];
  console.log('🔍 Total notes available:', allNotes.length, 'Recent searches:', recentSearches.length);
  console.log('🔍 All note titles:', allNotes.map(note => note.title));
  
  // Generate suggestions from note titles and content
  const suggestions = useMemo(() => {
    const words = new Set();
    
    allNotes.forEach(note => {
      // Extract words from title
      if (note.title) {
        const titleWords = note.title.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2) // Only words longer than 2 characters
          .filter(word => !/^\d+$/.test(word)) // Exclude pure numbers
          .filter(word => !word.includes('📏') && !word.includes('✅')); // Exclude emoji words
        titleWords.forEach(word => words.add(word));
      }
      
      // Extract meaningful words from content
      if (note.content) {
        const contentWords = note.content.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3) // Only longer words from content
          .filter(word => !/^\d+$/.test(word)) // Exclude pure numbers
          .filter(word => !word.includes('📏') && !word.includes('✅')) // Exclude emoji words
          .slice(0, 10); // Limit to first 10 words to avoid too many suggestions
        contentWords.forEach(word => words.add(word));
      }
    });
    
    // Convert to array and sort by frequency/relevance
    return Array.from(words).slice(0, 8); // Limit to 8 suggestions
  }, [allNotes]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      
      // Filter notes based on search query
      const filtered = allNotes.filter(note => {
        const searchLower = query.toLowerCase();
        const titleMatch = note.title?.toLowerCase().includes(searchLower);
        const contentMatch = note.content?.toLowerCase().includes(searchLower);
        const matches = titleMatch || contentMatch;
        
        console.log('🔍 Checking note:', note.title, 'matches:', matches, 'titleMatch:', titleMatch, 'contentMatch:', contentMatch);
        return matches;
      });
      
      console.log('🔍 Search query:', query, 'Total notes:', allNotes.length, 'Filtered results:', filtered.length);
      
      // Simulate search delay for better UX
      setTimeout(() => {
        setSearchResults(filtered);
        setIsSearching(false);
        
        // Don't add to recent searches here - only when user clicks on a note
      }, 300);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const handleNotePress = (note, fromSearchResults = false) => {
    console.log('🔍 Note pressed:', note.title, 'From search results:', fromSearchResults);
    console.log('🔍 Note object:', note);
    
    // Only add to recent searches if clicked from search results
    if (fromSearchResults && note.title && note.title.trim()) {
      const noteTitle = note.title.trim();
      console.log('🔍 Adding clicked note from search results to recent searches:', noteTitle);
      
      setRecentSearches(prev => {
        console.log('🔍 Previous recent searches:', prev);
        // Remove if already exists
        const filtered = prev.filter(search => search.toLowerCase() !== noteTitle.toLowerCase());
        // Add to beginning
        const newRecent = [noteTitle, ...filtered].slice(0, 6);
        console.log('🔍 Updated recent searches with clicked note:', newRecent);
        
        // Save immediately to AsyncStorage
        saveRecentSearches(newRecent);
        
        return newRecent;
      });
    } else {
      console.log('🔍 Not adding to recent searches - fromSearchResults:', fromSearchResults, 'hasTitle:', !!note.title);
    }
    
    navigation.navigate('noteDetail', { 
      noteId: note.id,
      returnToScreen: 'search' // Return to search page instead of home
    });
  };

  const handleRecentSearchPress = (noteTitle) => {
    console.log('🔍 Recent note title pressed:', noteTitle);
    
    // Find the note with this title and navigate directly to it
    const foundNote = allNotes.find(note => note.title === noteTitle);
    if (foundNote) {
      console.log('🔍 Found note directly, navigating to:', foundNote.title);
      handleNotePress(foundNote, false); // false = not from search results, don't add to recent
    } else {
      // Fallback to search if note not found
      handleSearch(noteTitle);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };
  
  const clearRecentSearches = async () => {
    console.log('🔍 Clearing recent searches');
    setRecentSearches([]);
    await saveRecentSearches([]);
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
                  placeholder="Search your notes..."
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
                  {!isSearching && searchResults.map((note) => (
                    <View key={note.id} style={styles.noteItem}>
                      <TouchableOpacity onPress={() => handleNotePress(note, true)} style={styles.noteItemContent}>
                        <View style={styles.noteItemHeader}>
                          <Text style={styles.noteTitle}>{note.title}</Text>
                          <View style={styles.noteStatusContainer}>
                            <Icon 
                              name={note.isPublic ? "globe" : "lock"} 
                              size={14} 
                              color={note.isPublic ? Colors.floatingButton : Colors.secondaryText} 
                            />
                          </View>
                        </View>
                        {note.content && (
                          <Text style={styles.noteContent} numberOfLines={2}>
                            {note.content}
                          </Text>
                        )}
                        <Text style={styles.noteTimeAgo}>{note.timeAgo}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {!isSearching && searchResults.length === 0 && searchQuery.trim().length > 0 && (
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
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Recent Searches</Text>
                      {recentSearches.length > 0 && (
                        <TouchableOpacity onPress={clearRecentSearches} style={styles.clearButton}>
                          <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.chipContainer}>
                      {isLoading ? (
                        <Text style={styles.emptyText}>Loading recent searches...</Text>
                      ) : recentSearches.length > 0 ? (
                        recentSearches.map((search, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.chip}
                            onPress={() => handleRecentSearchPress(search)}
                          >
                            <Icon name="clock" size={16} color={Colors.secondaryText} />
                            <Text style={styles.chipText}>{search}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.emptyText}>No recent searches</Text>
                      )}
                    </View>
                  </View>

                  {/* Suggestions */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Suggestions</Text>
                    <View style={styles.chipContainer}>
                      {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.chip}
                            onPress={() => handleSuggestionPress(suggestion)}
                          >
                            <Icon name="trending-up" size={16} color={Colors.secondaryText} />
                            <Text style={styles.chipText}>{suggestion}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.emptyText}>No suggestions available</Text>
                      )}
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
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.md,
    letterSpacing: -0.2,
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
  noteItem: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    marginBottom: Layout.spacing.sm,
    overflow: 'hidden',
  },
  noteItemContent: {
    padding: Layout.spacing.md,
  },
  noteItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.xs,
  },
  noteTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginRight: Layout.spacing.sm,
  },
  noteStatusContainer: {
    flexShrink: 0,
  },
  noteContent: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    lineHeight: 20,
    marginBottom: Layout.spacing.xs,
  },
  noteTimeAgo: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  emptyText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: Layout.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  clearButton: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
  },
  clearButtonText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default SearchScreen;