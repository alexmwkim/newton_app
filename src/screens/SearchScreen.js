import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import SwipeableNoteItem from '../components/SwipeableNoteItem';
import BottomNavigationComponent from '../components/BottomNavigationComponent';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';
import { UnifiedHeader } from '../shared/components/layout';



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
  const { user } = useAuth();
  
  console.log('🔍 ==========================================');
  console.log('🔍 AUTHENTICATION CHECK');
  console.log('🔍 Current logged-in user:', user);
  console.log('🔍 User ID:', user?.id);
  console.log('🔍 User email:', user?.email);
  console.log('🔍 ==========================================');
  
  const privateNotes = storeData.privateNotes || [];
  const publicNotes = storeData.publicNotes || [];
  const allNotes = [...privateNotes, ...publicNotes];
  
  console.log('🔍 ==========================================');
  console.log('🔍 NOTES DATA ANALYSIS');
  console.log('🔍 Total notes available:', allNotes.length);
  console.log('🔍 Private notes:', privateNotes.length);
  console.log('🔍 Public notes:', publicNotes.length);
  
  allNotes.forEach((note, index) => {
    console.log(`🔍 Note ${index + 1}:`, {
      title: note.title,
      user_id: note.user_id,
      isOwner: note.user_id === user?.id,
      isPublic: note.is_public || note.isPublic,
      contentPreview: (note.content || '').substring(0, 50) + '...'
    });
  });
  console.log('🔍 ==========================================');
  
  // Helper function to extract pure text content from note content (excluding image paths, card markup etc.)
  const extractPureTextContent = (content) => {
    if (!content || typeof content !== 'string') return '';
    
    // Remove image blocks: 🖼️ Image: [path]
    let cleanContent = content.replace(/🖼️\s*Image:\s*[^\n]*/g, '');
    
    // Remove card markup but keep card content: 📋 Card: [content]
    cleanContent = cleanContent.replace(/📋\s*Card:\s*/g, '');
    
    // Remove any remaining special block markers
    cleanContent = cleanContent.replace(/[🖼️📋]\s*/g, '');
    
    // Clean up extra whitespace and newlines
    cleanContent = cleanContent.replace(/\n\s*\n/g, '\n').trim();
    
    return cleanContent;
  };

  // Helper function for Korean initial consonant (chosung) search
  const getChosung = (text) => {
    const chosungList = [
      'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 
      'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];
    
    return text.split('').map(char => {
      const code = char.charCodeAt(0);
      // 한글 완성형 범위 (가-힣)
      if (code >= 0xAC00 && code <= 0xD7A3) {
        const chosungIndex = Math.floor((code - 0xAC00) / 28 / 21);
        return chosungList[chosungIndex];
      }
      // 이미 자음/모음이면 그대로 반환
      if (chosungList.includes(char)) {
        return char;
      }
      return char; // 한글이 아닌 문자는 그대로
    }).join('');
  };

  // Enhanced search function with Korean initial consonant support
  const searchMatch = (text, query) => {
    if (!text || !query) return false;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // 1. 일반 텍스트 검색 (기존 방식)
    if (textLower.includes(queryLower)) {
      return true;
    }
    
    // 2. 한글 초성 검색
    const textChosung = getChosung(text);
    const queryChosung = getChosung(query);
    
    // 입력이 초성만으로 이루어진 경우
    const isChosungQuery = /^[ㄱ-ㅎ]+$/.test(query);
    if (isChosungQuery) {
      return textChosung.includes(queryChosung);
    }
    
    return false;
  };
  
  // Generate suggestions from note titles only
  const suggestions = useMemo(() => {
    const titles = new Set();
    
    allNotes.forEach(note => {
      // Use complete note titles as suggestions
      if (note.title && note.title.trim().length > 0) {
        titles.add(note.title.trim());
      }
    });
    
    // Convert to array and sort alphabetically, limit to 8 suggestions
    return Array.from(titles)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 8);
  }, [allNotes]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      
      // Filter notes based on search query - only title and pure text content with Korean initial consonant support
      const filtered = allNotes.filter(note => {
        const titleMatch = searchMatch(note.title, query);
        
        // Extract pure text content (excluding image paths, card markup etc.)
        const pureTextContent = extractPureTextContent(note.content);
        const contentMatch = searchMatch(pureTextContent, query);
        
        const matches = titleMatch || contentMatch;
        
        console.log('🔍 ==========================================');
        console.log('🔍 Checking note:', note.title);
        console.log('🔍 Search query:', `"${query}"`);
        console.log('🔍 Title:', `"${note.title}"`);
        console.log('🔍 Title chosung:', `"${getChosung(note.title || '')}"`);
        console.log('🔍 Raw content preview:', `"${(note.content || '').substring(0, 100)}..."`);
        console.log('🔍 Pure text content:', `"${pureTextContent}"`);
        console.log('🔍 Content chosung:', `"${getChosung(pureTextContent || '')}"`);
        console.log('🔍 Is chosung query:', /^[ㄱ-ㅎ]+$/.test(query));
        console.log('🔍 Title match:', titleMatch);
        console.log('🔍 Content match (pure text only):', contentMatch);
        console.log('🔍 Final matches:', matches);
        console.log('🔍 ==========================================');
        
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.mainBackground} />
      
      <UnifiedHeader
        title="Search"
        showBackButton={false}
        transparent={true}
        screenType="main"
      />

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
                    <SwipeableNoteItem
                      key={note.id}
                      note={note}
                      onPress={() => handleNotePress(note, true)}
                      onDelete={() => {}} // Disable delete in search results
                      isPublic={note.isPublic}
                      viewMode="TITLE_ONLY" // Use title only mode for search results
                    />
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
    paddingHorizontal: 20, // 홈화면 기준과 동일
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
    paddingHorizontal: 20, // 모든 페이지 표준 좌우 마진 (20px)
    alignItems: 'center',
    pointerEvents: 'box-none',
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
  clearButtonSection: {
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