import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TextInput, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
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
import { UnifiedHeader } from '../shared/components/layout';
import trendingAlgorithm from '../utils/TrendingAlgorithm';
import personalizedAlgorithm from '../utils/PersonalizedAlgorithm';


const categories = ['For You', 'Trending', 'Following', 'Fresh', 'Creative', 'Tips'];

const ExploreScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState(2); // Explore is index 2 (zap)
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('For You');
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
  
  // 카테고리별 노트 필터링 및 정렬
  const getFilteredAndSortedNotes = async (notes, category) => {
    if (!notes || notes.length === 0) return [];
    
    console.log(`🔍 Filtering notes for category: ${category}`);
    console.log(`🔍 Total notes to filter: ${notes.length}`);
    
    // 노트에 trending 점수 계산 및 추가
    const notesWithScores = notes.map(note => {
      // 노트의 통계 정보 구성 (실제 DB에서 가져올 때 이 정보들을 포함해야 함)
      const stats = {
        stars: note.stars || note.star_count || Math.floor(Math.random() * 50), // 임시 랜덤값
        forks: note.forks || note.fork_count || Math.floor(Math.random() * 20),
        views: note.views || note.view_count || Math.floor(Math.random() * 200),
        comments: note.comments || note.comment_count || Math.floor(Math.random() * 10),
        shares: note.shares || note.share_count || Math.floor(Math.random() * 5)
      };
      
      // 작성자 정보
      const author = {
        follower_count: note.profiles?.follower_count || Math.floor(Math.random() * 100),
        reputation: note.profiles?.reputation || Math.floor(Math.random() * 10),
        verified: note.profiles?.verified || false
      };
      
      // Trending 점수 계산
      const trendingScore = trendingAlgorithm.calculateTrendingScore(note, stats, author);
      
      return {
        ...note,
        stats,
        trending_score: trendingScore,
        engagement_score: trendingAlgorithm.calculateEngagementScore(stats),
        velocity_score: trendingAlgorithm.calculateVelocityScore(stats, stats) // 임시로 같은 값 사용
      };
    });
    
    // 카테고리별 필터링 및 정렬
    switch (category.toLowerCase()) {
      case 'for you':
        console.log('🎯 Applying For You personalized filter');
        try {
          // 사용자 행동 데이터 수집
          const userData = await personalizedAlgorithm.collectUserBehaviorData(user?.id, notesStore, useSocialStore.getState());
          
          // 개인화된 피드 생성
          const personalizedFeed = await personalizedAlgorithm.generatePersonalizedFeed(
            notesWithScores, 
            userData, 
            user?.id
          );
          
          return personalizedFeed;
        } catch (error) {
          console.error('❌ Error generating For You feed:', error);
          // 폴백: 트렌딩 방식으로 정렬
          return notesWithScores
            .sort((a, b) => b.trending_score - a.trending_score)
            .slice(0, 20);
        }
      
      case 'trending':
        return trendingAlgorithm.filterByCategory(notesWithScores, 'trending', 168); // 7일
      
      case 'following':
        console.log('👥 Applying Following filter');
        // TODO: 실제로는 팔로우하는 사용자의 노트만 필터링해야 함
        // 임시로 모든 노트를 최신순으로 표시
        return notesWithScores
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 20);
      
      case 'fresh':
        console.log('🌱 Applying Fresh filter (24 hours)');
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return notesWithScores
          .filter(note => new Date(note.created_at) > oneDayAgo)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 20);
      
      case 'creative':
        console.log('🎨 Applying Creative filter');
        return notesWithScores
          .filter(note => 
            note.category === 'creative' || 
            note.tags?.includes('creative') ||
            note.title?.toLowerCase().includes('creative') ||
            note.content?.toLowerCase().includes('creative') ||
            note.title?.toLowerCase().includes('art') ||
            note.content?.toLowerCase().includes('design') ||
            note.title?.toLowerCase().includes('idea') ||
            note.content?.toLowerCase().includes('inspiration')
          )
          .sort((a, b) => b.trending_score - a.trending_score)
          .slice(0, 20);
      
      case 'tips':
        console.log('💡 Applying Tips filter');
        return notesWithScores
          .filter(note => 
            note.category === 'tips' || 
            note.tags?.includes('tip') ||
            note.title?.toLowerCase().includes('tip') ||
            note.content?.toLowerCase().includes('tip') ||
            note.title?.toLowerCase().includes('how to') ||
            note.content?.toLowerCase().includes('tutorial') ||
            note.title?.toLowerCase().includes('guide') ||
            note.content?.toLowerCase().includes('advice')
          )
          .sort((a, b) => b.trending_score - a.trending_score)
          .slice(0, 20);
      
      default:
        console.log('📋 Using default sorting (trending)');
        return notesWithScores
          .sort((a, b) => b.trending_score - a.trending_score)
          .slice(0, 20);
    }
  };

  // State for filtered notes
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Get filtered and sorted notes based on active category
  useEffect(() => {
    const applyFilter = async () => {
      if (exploreNotes.length === 0) {
        setFilteredNotes([]);
        return;
      }
      
      setIsFilterLoading(true);
      try {
        const filtered = await getFilteredAndSortedNotes(exploreNotes, activeCategory);
        setFilteredNotes(filtered);
      } catch (error) {
        console.error('❌ Error applying filter:', error);
        setFilteredNotes(exploreNotes.slice(0, 20)); // Fallback
      } finally {
        setIsFilterLoading(false);
      }
    };

    applyFilter();
  }, [exploreNotes, activeCategory, user?.id]);
  
  // Transform notes to match SwipeableNoteItem format (keep original note structure)
  const transformedNotes = filteredNotes.map(note => ({
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
      console.log('🔄 Force refreshing popular authors...');
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.mainBackground} />
      
      <UnifiedHeader
        title="Explore"
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
                    <View style={styles.popularAuthorsSection}>
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
                              
                              // PRELOAD BEFORE NAVIGATION for instant display
                              const handleNavigation = async () => {
                                try {
                                  const UnifiedFollowService = require('../services/UnifiedFollowService').default;
                                  const targetUserId = author.user_id || author.id;
                                  
                                  // Check if cache is missing and preload BEFORE navigation
                                  const cachedData = UnifiedFollowService.getFromCache(targetUserId);
                                  
                                  if (!cachedData) {
                                    console.log('⚡ PRELOAD: No cache found, loading data BEFORE navigation...');
                                    
                                    try {
                                      // Quick load before navigation using UnifiedFollowService
                                      const [followersCount, followingCount, isFollowingResult] = await Promise.all([
                                        UnifiedFollowService.getFollowersCount(targetUserId),
                                        UnifiedFollowService.getFollowingCount(targetUserId),
                                        user?.id ? UnifiedFollowService.isFollowing(user.id, targetUserId) : Promise.resolve({ success: true, isFollowing: false })
                                      ]);
                                      
                                      if (followersCount !== undefined && followingCount !== undefined) {
                                        console.log('⚡ PRELOAD: Data cached by UnifiedFollowService before navigation!');
                                      }
                                    } catch (loadError) {
                                      console.log('⚡ PRELOAD: Quick load failed, navigating anyway');
                                    }
                                  } else {
                                    console.log('⚡ PRELOAD: Cache exists, navigating immediately');
                                  }
                                  
                                  // Navigate after preload attempt
                                  navigation.navigate('userProfile', navigationParams);
                                  
                                } catch (error) {
                                  console.error('Navigation error:', error);
                                  Alert.alert('Error', 'Failed to navigate to user profile: ' + error.message);
                                }
                              };
                              
                              handleNavigation();
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
                              {author.publicNotesCount || 0} notes
                            </Text>
                          </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Social Feed */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        {activeCategory === 'For You' ? '🎯 For You' : 
                         activeCategory === 'Trending' ? '🔥 Trending Notes' : 
                         activeCategory === 'Following' ? '👥 Following' :
                         activeCategory === 'Fresh' ? '🌱 Fresh Notes' :
                         activeCategory === 'Creative' ? '🎨 Creative' :
                         activeCategory === 'Tips' ? '💡 Tips & Guides' :
                         'Explore Notes'}
                      </Text>
                      {filteredNotes.length > 0 && (
                        <Text style={styles.sectionCount}>
                          {filteredNotes.length} notes
                        </Text>
                      )}
                    </View>
                    {(feedLoading && exploreNotes.length === 0) || isFilterLoading ? (
                      <View style={styles.loadingState}>
                        <Text style={styles.loadingText}>Loading explore content...</Text>
                      </View>
                    ) : filteredNotes.length > 0 ? (
                      filteredNotes.map((note) => {
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
                        <Icon name="globe" size={48} color={Colors.secondaryText} />
                        <Text style={styles.emptyStateText}>Explore content loading...</Text>
                        <Text style={styles.emptyStateSubtext}>
                          Discovering amazing notes for you
                        </Text>
                      </View>
                    )}
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
  contentWithPadding: {
    flex: 1,
    paddingHorizontal: 20, // 홈화면 기준과 동일
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
  popularAuthorsSection: {
    marginBottom: Layout.spacing.xl + Layout.spacing.md, // 32px + 16px = 48px (더 넓은 간격)
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.md, // 16px 하단 여백 추가
  },
  sectionCount: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    fontWeight: Typography.fontWeight.normal,
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
    paddingBottom: Layout.spacing.xs, // 4px로 최소화
  },
  authorCard: {
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16, // 12 → 16으로 증가
    marginRight: 12,
    width: 100, // 80 → 100으로 증가
    minHeight: 120, // 최소 높이 추가
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
    fontSize: 14, // 12 → 14로 증가
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 8, // 프로필 사진과 이름 사이 간격 추가
  },
  authorStats: {
    fontSize: 12, // 10 → 12로 증가
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ExploreScreen;