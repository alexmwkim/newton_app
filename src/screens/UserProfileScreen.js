import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Markdown from 'react-native-markdown-display';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import BottomNavigationComponent from '../components/BottomNavigationComponent';
import Avatar from '../components/Avatar';
import ProfileService from '../services/profilesClient';
import { getConsistentAvatarUrl, getConsistentUsername } from '../utils/avatarUtils';
import { useAuth } from '../contexts/AuthContext';
import { useNotesStore } from '../store/NotesStore';
import NotesService from '../services/notes';
import FollowService from '../services/followClient';

// User data for display
const createUserData = (username) => ({
  id: username === 'David Lee' ? 'david-lee-id' : 'unknown-user-id',
  username: username || 'Unknown User',
  readmeTitle: `Hello from ${username || 'Unknown'}!`,
  readmeContent: `## Welcome to my profile!

I'm **${username || 'a user'}** who loves to create and share knowledge. Here's what I'm working on:

- Writing insightful notes and articles
- Sharing ideas with the community
- Always learning new things

### My Interests
- Technology and innovation
- Creative writing
- Knowledge sharing

> "Knowledge shared is knowledge multiplied."

Feel free to check out my public notes below!`,
});

const UserProfileScreen = ({ navigation, route }) => {
  // CRITICAL DEBUG: Check if route and route.params exist
  console.log('🔍 ROUTE DEBUG - route exists:', !!route);
  console.log('🔍 ROUTE DEBUG - route.params exists:', !!route?.params);
  console.log('🔍 ROUTE DEBUG - route.params keys:', route?.params ? Object.keys(route.params) : 'no params');
  
  const { userId, username, profileData, isCurrentUser: routeIsCurrentUser } = route.params || {};
  const { user: currentUser, profile: currentProfile } = useAuth();
  
  // CRITICAL FIX: Dynamically calculate isCurrentUser instead of relying on route params
  const isCurrentUser = React.useMemo(() => {
    const calculated = userId === currentUser?.id || profileData?.user_id === currentUser?.id;
    console.log('🔍 DYNAMIC isCurrentUser calculation FORCED UPDATE:', {
      calculated,
      routeIsCurrentUser,
      userId,
      currentUserId: currentUser?.id,
      profileDataUserId: profileData?.user_id,
      match1: userId === currentUser?.id,
      match2: profileData?.user_id === currentUser?.id
    });
    return calculated;
  }, [userId, profileData?.user_id, currentUser?.id]);
  
  // ENHANCED DEBUG: Log all navigation data
  console.log('🔍 UserProfileScreen UPDATED VERSION opened with route params:', {
    userId,
    username,
    hasProfileData: !!profileData,
    isCurrentUser,
    profileDataUsername: profileData?.username,
    profileDataUserId: profileData?.user_id,
    profileDataId: profileData?.id
  });
  
  // CRITICAL DEBUG: Log the full route object
  console.log('🔍 FULL ROUTE PARAMS:', JSON.stringify(route.params, null, 2));
  
  // EMERGENCY FIX: If no route params, this might be a navigation issue
  if (!route?.params || (!userId && !profileData)) {
    console.error('❌ CRITICAL: No route params received - this is a navigation issue!');
    console.error('❌ Route object:', route);
    console.error('❌ Navigation might have failed or params were lost');
    console.error('❌ Route name:', route?.name);
    console.error('❌ Route key:', route?.key);
    
    // SAFE navigation.getState() call
    if (navigation && typeof navigation.getState === 'function') {
      try {
        console.error('❌ Navigation state:', JSON.stringify(navigation.getState(), null, 2));
      } catch (error) {
        console.error('❌ Failed to get navigation state:', error.message);
      }
    } else {
      console.error('❌ Navigation object is invalid:', typeof navigation);
      console.error('❌ Navigation keys:', navigation ? Object.keys(navigation) : 'null');
    }
  }
  const [activeNavTab, setActiveNavTab] = useState(2); // Explore is index 2
  const [userProfile, setUserProfile] = useState(null);
  const [userPublicNotes, setUserPublicNotes] = useState([]);
  const [readmeData, setReadmeData] = useState({ title: '', content: '' });
  const [highlightNotes, setHighlightNotes] = useState([]);
  
  // Social features state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  // Create user data for display
  const userData = createUserData(username);
  const displayUser = userProfile || userData;
  
  // Notes store for highlight functionality and current user data consistency
  const { globalPublicNotes, publicNotes, getStarredNotes, starredNotes } = useNotesStore();

  // Load user profile data
  useEffect(() => {
    const loadData = async () => {
      // CRITICAL: Load profile first, then notes (profile contains user_id needed for notes)
      await loadUserProfile();
    };
    loadData();
  }, [userId, username]);

  // TRACK PROFILE STATE CHANGES
  useEffect(() => {
    console.log('🔄 userProfile state changed:', userProfile ? {
      username: userProfile.username,
      user_id: userProfile.user_id,
      id: userProfile.id
    } : 'null');
  }, [userProfile]);

  // Load notes after profile is loaded (separate useEffect for proper sequencing)
  useEffect(() => {
    const loadNotesAfterProfile = async () => {
      // Only load notes after we have profile data or confirmed current user
      if (isCurrentUser || userProfile) {
        await loadUserPublicNotes();
      }
    };
    loadNotesAfterProfile();
  }, [userProfile, isCurrentUser]); // Trigger when profile loads or isCurrentUser changes

  // Load starred notes count for other users - FORCED EXECUTION
  useEffect(() => {
    const loadStarredNotesCount = async () => {
      console.log('🔍 FORCE-DEBUGGING loadStarredNotesCount CONDITIONS:', {
        isCurrentUser,
        hasUserProfile: !!userProfile,
        userProfileUserId: userProfile?.user_id,
        profileDataUserId: profileData?.user_id,
        conditionMet: !isCurrentUser && (userProfile?.user_id || profileData?.user_id)
      });
      
      // CRITICAL FIX: Use profileData as fallback if userProfile not loaded yet
      const targetUserId = userProfile?.user_id || profileData?.user_id;
      
      if (!isCurrentUser && targetUserId) {
        console.log('🔍 EXECUTING loadStarredNotesCount for targetUserId:', targetUserId);
        try {
          console.log('⭐ DEBUGGING: Loading starred notes count for other user:', targetUserId);
          console.log('⭐ DEBUGGING: profile details:', {
            userProfileUsername: userProfile?.username,
            profileDataUsername: profileData?.username,
            targetUserId: targetUserId
          });
          
          const { data, error } = await NotesService.getStarredNotes(targetUserId, 50, 0);
          
          console.log('⭐ DEBUGGING: NotesService.getStarredNotes result:', {
            hasData: !!data,
            dataLength: data?.length || 0,
            hasError: !!error,
            errorMessage: error
          });
          
          if (!error && data) {
            setRealStarredNotesCount(data.length);
            console.log('⭐ DEBUGGING: Set realStarredNotesCount to:', data.length, 'for user:', userProfile?.username || profileData?.username);
            console.log('⭐ DEBUGGING: Starred notes details:', data.map(n => `${n.title}(${n.id})`));
          } else {
            console.log('⭐ DEBUGGING: Failed to load starred notes count, setting to 0. Error:', error);
            setRealStarredNotesCount(0);
          }
        } catch (error) {
          console.error('⭐ DEBUGGING: Exception loading starred notes count:', error);
          setRealStarredNotesCount(0);
        }
      }
    };
    
    loadStarredNotesCount();
  }, [userProfile, isCurrentUser, profileData]);

  const loadUserProfile = async () => {
    try {
      console.log('👤 loadUserProfile called with:', { userId, username, profileData: !!profileData });
      
      // ENHANCED DEBUG: Check what data we received
      if (profileData) {
        console.log('📋 profileData received:', {
          id: profileData.id,
          user_id: profileData.user_id,
          username: profileData.username,
          avatar_url: profileData.avatar_url
        });
        
        // TEMPORARY FIX: If profileData has no username but we have route username, fix it
        if (!profileData.username && username && username !== 'Unknown') {
          console.log('🔧 TEMP FIX: profileData missing username, using route username:', username);
          profileData.username = username;
        }
      }
      
      // Load user profile if available
      let profile = profileData;
      if (!profile && userId) {
        console.log('🔍 Loading profile from database for userId:', userId);
        
        // Load profile using user_id (now consistently passed from ExploreScreen)
        let profileResult = await ProfileService.getProfile(userId);
        
        console.log('📋 ProfileService.getProfile result:', {
          hasData: !!profileResult.data,
          hasError: !!profileResult.error,
          error: profileResult.error,
          dataUsername: profileResult.data?.username,
          dataUserId: profileResult.data?.user_id
        });
        
        if (!profileResult.error && profileResult.data) {
          profile = profileResult.data;
          console.log('✅ Profile loaded successfully:', {
            username: profile.username,
            user_id: profile.user_id,
            profile_id: profile.id
          });
        } else {
          console.error('❌ Failed to load profile:', profileResult.error);
          console.error('❌ This will cause fallback to Unknown User');
        }
      } else if (profile) {
        console.log('✅ Using provided profileData:', {
          username: profile.username,
          user_id: profile.user_id,
          profile_id: profile.id
        });
      } else {
        console.error('❌ No profile data and no userId provided - will use fallback');
      }
      
          // CRITICAL FIX: Ensure we always set the profile, even if it's from profileData
      if (profile) {
        console.log('✅ Setting profile state:', profile.username);
        setUserProfile(profile);
      } else {
        console.error('❌ No profile to set - this will show as Unknown User');
        setUserProfile(null);
      }
      
      // TRACK STATE CHANGES: Monitor when userProfile state changes
      console.log('📊 Profile state will be updated to:', profile ? profile.username : 'null');
      
      // Set up readme data with proper fallback
      const readmeTitle = profile?.readme_title || `Hello from ${profile?.username || username || 'Unknown'}!`;
      const readmeContent = profile?.readme_content || `## Welcome to my profile!

I'm **${profile?.username || username || 'a user'}** who loves to create and share knowledge. Here's what I'm working on:

- Writing insightful notes and articles
- Sharing ideas with the community
- Always learning new things

### My Interests
- Technology and innovation
- Creative writing
- Knowledge sharing

> "Knowledge shared is knowledge multiplied."

Feel free to check out my public notes below!`;
      
      setReadmeData({
        title: readmeTitle,
        content: readmeContent
      });
      
      // Calculate real social stats based on actual data
      await loadRealSocialStats(profile);
      
      console.log('👤 Profile setup complete:', {
        username: profile?.username || username,
        hasReadme: !!(profile?.readme_title || profile?.readme_content),
        userId: profile?.user_id || 'unknown'
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Use fallback data
      const fallbackUser = createUserData(username);
      setReadmeData({
        title: fallbackUser.readmeTitle,
        content: fallbackUser.readmeContent
      });
    }
  };

  const loadRealSocialStats = async (profileData = null) => {
    try {
      const targetProfile = profileData || userProfile;
      if (!userId || !targetProfile?.user_id) {
        console.log('📊 UserProfileScreen: No userId or user_id provided for social stats');
        setFollowersCount(0);
        setFollowingCount(0);
        setIsFollowing(false);
        return;
      }

      console.log('📊 UserProfileScreen: Loading real follow stats for user:', targetProfile.user_id);

      // Initialize follows table if needed (first time setup)
      await FollowService.initializeFollowsTable();

      // Get real followers count using user_id from profile
      const { success: followersSuccess, count: followers } = await FollowService.getFollowersCount(targetProfile.user_id);
      if (followersSuccess) {
        setFollowersCount(followers);
        console.log('👥 UserProfileScreen: Real followers count:', followers);
      } else {
        setFollowersCount(0);
      }

      // Get real following count
      const { success: followingSuccess, count: following } = await FollowService.getFollowingCount(targetProfile.user_id);
      if (followingSuccess) {
        setFollowingCount(following);
        console.log('👥 UserProfileScreen: Real following count:', following);
      } else {
        setFollowingCount(0);
      }

      // Check if current user is following this user (only if not current user)
      if (!isCurrentUser) {
        const { success: followingCheckSuccess, isFollowing: followingStatus } = await FollowService.isFollowing(currentUser?.id, targetProfile.user_id);
        if (followingCheckSuccess) {
          setIsFollowing(followingStatus);
          console.log('👥 UserProfileScreen: Follow status:', followingStatus);
        } else {
          setIsFollowing(false);
        }
      }

    } catch (err) {
      console.error('❌ UserProfileScreen: Exception loading follow stats:', err);
      setFollowersCount(0);
      setFollowingCount(0);
      setIsFollowing(false);
    }
  };
  
  // Process highlight notes from NotesStore data (for current user consistency)
  // EXACT SAME LOGIC AS PROFILESCREEN for complete consistency
  const loadHighlightNotesFromNotesStoreData = (notesData) => {
    try {
      console.log('📈 Processing highlight notes from NotesStore data (EXACT ProfileScreen logic)');
      console.log('📈 Input notes:', notesData?.length || 0);
      
      if (!notesData || notesData.length === 0) {
        console.log('📈 No notes to process for highlights');
        setHighlightNotes([]);
        return;
      }
      
      // Filter notes exactly like ProfileScreen
      const userPublicNotes = notesData.filter(note => 
        note.isPublic !== false // Make sure it's actually a public note
      );
      
      // EXACT SAME SORT LOGIC AS PROFILESCREEN
      const sortedNotes = userPublicNotes.sort((a, b) => {
        console.log('📈 Comparing notes for sorting:', {
          a: { title: a.title, updated_at: a.updated_at },
          b: { title: b.title, updated_at: b.updated_at }
        });
        
        // Primary sort: most recently updated first (EXACT same logic as ProfileScreen)
        const aUpdatedDate = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0);
        const bUpdatedDate = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0);
        const dateDiff = bUpdatedDate.getTime() - aUpdatedDate.getTime();
        
        console.log('📈 Date comparison:', {
          a: { date: aUpdatedDate.toISOString(), timestamp: aUpdatedDate.getTime() },
          b: { date: bUpdatedDate.toISOString(), timestamp: bUpdatedDate.getTime() },
          diff: dateDiff
        });
        
        // If dates are different, use date sort
        if (dateDiff !== 0) {
          return dateDiff;
        }
        
        // Secondary sort: if dates are same, sort by star count (EXACT same as ProfileScreen)
        const aStarCount = a.star_count || a.starCount || 0;
        const bStarCount = b.star_count || b.starCount || 0;
        return bStarCount - aStarCount;
      });
      
      console.log('📈 Final sorted notes order:', sortedNotes.map(n => `${n.title} (updated: ${n.updated_at})`));
      
      // Take only the first 2 notes for highlight section - same as ProfileScreen
      const highlightData = sortedNotes.slice(0, 2).map(note => {
        console.log('📈 Processing note for highlight:', {
          id: note.id,
          title: note.title,
          star_count: note.star_count,
          starCount: note.starCount,
          fork_count: note.fork_count,
          forkCount: note.forkCount
        });
        
        return {
          ...note,
          starCount: note.star_count || note.starCount || 0,
          forkCount: note.fork_count || note.forkCount || 0,
        };
      });
      
      setHighlightNotes(highlightData);
      console.log('📈 Loaded highlight notes from NotesStore:', highlightData.length, 'notes');
      console.log('📈 Highlight notes with counts:', highlightData.map(n => `${n.title}: star=${n.starCount}, fork=${n.forkCount}`));
    } catch (error) {
      console.error('📈 Error processing highlight notes from NotesStore:', error);
      setHighlightNotes([]);
    }
  };
  
  const loadUserPublicNotes = async () => {
    try {
      console.log('📥 Loading real public notes for user:', username, 'userId:', userId, 'isCurrentUser:', isCurrentUser);
      
      // CRITICAL FIX: If this is the current user, use NotesStore data for consistency
      if (isCurrentUser) {
        console.log('✅ Using NotesStore data for current user (consistency with ProfileScreen)');
        
        console.log('📊 NotesStore publicNotes:', publicNotes?.length || 0, 'notes');
        console.log('📊 PublicNotes details:', publicNotes?.map(n => `${n.title}(${n.is_public})`));
        
        setUserPublicNotes(publicNotes || []);
        // Process highlight notes exactly like ProfileScreen for complete consistency
        loadHighlightNotesFromNotesStoreData(publicNotes || []);
        return;
      }
      
      // For other users, we need to get the actual user_id from the profile
      let actualUserId = userId;
      
      // If userProfile is loaded, use its user_id (the auth user ID)
      if (userProfile?.user_id) {
        actualUserId = userProfile.user_id;
        console.log('📥 Using user_id from loaded profile:', actualUserId);
      } else {
        console.log('📥 Profile not yet loaded, trying with provided userId:', actualUserId);
      }
      
      if (!actualUserId) {
        console.error('❌ No actualUserId available for loading notes');
        setUserPublicNotes([]);
        setHighlightNotes([]);
        return;
      }
      
      // Load real notes from Supabase for other users using the correct user_id
      console.log('📥 Loading notes from Supabase for user_id:', actualUserId);
      const { data: notes, error } = await NotesService.getUserNotes(actualUserId, true); // true = public only
      
      if (error) {
        console.error('❌ Error loading user public notes:', error);
        setUserPublicNotes([]);
        setHighlightNotes([]);
        return;
      }
      
      console.log('✅ Loaded real public notes for', username, ':', notes?.length || 0, 'notes');
      console.log('📋 First real note:', notes?.[0] ? {
        id: notes[0].id,
        title: notes[0].title,
        content: notes[0].content?.substring(0, 50) + '...',
        user_id: notes[0].user_id,
        profiles: notes[0].profiles
      } : 'No notes');
      
      const realNotes = notes || [];
      setUserPublicNotes(realNotes);
      
      // Process highlight notes with proper sorting (same logic as ProfileScreen)
      loadHighlightNotesFromNotesStoreData(realNotes);
    } catch (err) {
      console.error('❌ Exception loading user public notes:', err);
      setUserPublicNotes([]);
      setHighlightNotes([]);
    }
  };

  // Social interaction handlers - Real follow/unfollow functionality
  const handleFollowPress = async () => {
    try {
      if (!userId || !userProfile?.user_id) {
        console.error('❌ No userId or user_id to follow/unfollow');
        return;
      }

      console.log('👥 Toggle follow for user:', userProfile.user_id, 'current status:', isFollowing);
      
      // Show loading state (optional - could add loading indicator)
      const originalFollowing = isFollowing;
      const originalCount = followersCount;
      
      // Optimistic update
      setIsFollowing(!isFollowing);
      setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);
      
      // Perform actual follow/unfollow using user_id from userProfile
      const { success, isFollowing: newFollowingStatus, error } = await FollowService.toggleFollow(currentUser?.id, userProfile.user_id);
      
      if (success) {
        // Update with actual result
        setIsFollowing(newFollowingStatus);
        console.log('✅ Follow toggle successful:', newFollowingStatus ? 'Now following' : 'Unfollowed');
        
        // Refresh follower count
        await loadRealSocialStats();
      } else {
        // Revert optimistic update on error
        console.error('❌ Follow toggle failed:', error);
        setIsFollowing(originalFollowing);
        setFollowersCount(originalCount);
        Alert.alert('Error', error || 'Failed to update follow status');
      }
      
    } catch (error) {
      console.error('❌ Follow press error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };
  
  const handleFollowersPress = () => {
    console.log('👥 Followers pressed for', username);
    // TODO: Navigate to followers list
  };

  const handleFollowingPress = () => {
    console.log('👥 Following pressed for', username);
    // TODO: Navigate to following list
  };
  
  const handleMyNotesPress = () => {
    console.log('📝 My notes pressed for', username);
    navigation.navigate('notesList', {
      listType: 'myNotes',
      username: displayUsername,
      userId: userId,
      userProfile: userProfile,
      title: isCurrentUser ? 'My Notes' : `${displayUsername}'s Notes`,
      isCurrentUser: false, // ALWAYS show public notes only in profile "My Notes" section
      // Add origin information for proper back navigation
      originScreen: 'userProfile',
      profileData: userProfile
    });
  };

  const handleStarredNotesPress = () => {
    console.log('⭐ Starred notes pressed for', username);
    navigation.navigate('notesList', {
      listType: 'starredNotes',
      username: displayUsername,
      userId: userId,
      userProfile: userProfile,
      title: isCurrentUser ? 'Starred Notes' : `${displayUsername}'s Starred Notes`,
      isCurrentUser: isCurrentUser,
      // Add origin information for proper back navigation
      originScreen: 'userProfile',
      profileData: userProfile
    });
  };
  
  const handleNotePress = (note) => {
    console.log('🗒️ RECENT NOTE PRESSED!');
    console.log('🗒️ Note:', note.title);
    console.log('🗒️ Note ID:', note.id);
    console.log('🗒️ Navigation object:', typeof navigation);
    console.log('🗒️ Navigation keys:', navigation ? Object.keys(navigation) : 'null');
    
    try {
      console.log('🗒️ Calling navigation.navigate...');
      
      // CRITICAL FIX: Preserve current UserProfile data when navigating to noteDetail
      const navigationParams = {
        noteId: note.id,
        returnToScreen: 'userProfile',
        // Preserve all current UserProfile data for proper back navigation
        userId: userId,
        username: username, 
        profileData: profileData,
        isCurrentUser: isCurrentUser
      };
      
      console.log('🗒️ Navigation params with preserved profile data:', navigationParams);
      
      navigation.navigate('noteDetail', navigationParams);
      console.log('🗒️ Navigation.navigate call completed');
    } catch (error) {
      console.error('🗒️ Navigation error:', error);
    }
  };
  
  const handleSharePress = () => {
    console.log('📤 Share pressed for', username);
    // TODO: Implement share functionality
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

  // ENHANCED: Better username resolution with more fallbacks
  const displayUsername = React.useMemo(() => {
    const resolved = userProfile?.username || username || profileData?.username || 'Unknown User';
    console.log('🏷️ displayUsername resolved:', resolved, 'from:', {
      userProfileUsername: userProfile?.username,
      routeUsername: username,
      profileDataUsername: profileData?.username
    });
    return resolved;
  }, [userProfile?.username, username, profileData?.username]);
  const myNotesCount = userPublicNotes.length;
  
  // Load real starred notes count for all users
  const [realStarredNotesCount, setRealStarredNotesCount] = useState(0);
  
  const starredNotesCount = React.useMemo(() => {
    console.log('⭐ DEBUGGING: starredNotesCount calculation triggered');
    console.log('⭐ DEBUGGING: isCurrentUser:', isCurrentUser);
    console.log('⭐ DEBUGGING: realStarredNotesCount:', realStarredNotesCount);
    console.log('⭐ DEBUGGING: displayUsername:', displayUsername);
    
    if (isCurrentUser) {
      console.log('⭐ DEBUGGING: Using NotesStore data for current user');
      console.log('⭐ starredNotes from store (local IDs):', starredNotes?.length || 0, 'IDs');
      console.log('⭐ getStarredNotes() (note objects):', getStarredNotes()?.length || 0, 'notes');
      
      const userStarredNotes = getStarredNotes();
      const count = userStarredNotes?.length || 0;
      console.log('⭐ DEBUGGING: Current user starred count:', count);
      console.log('⭐ DEBUGGING: Current user starred notes details:', userStarredNotes?.map(n => `${n.title}(${n.id})`));
      return count;
    } else {
      console.log('⭐ DEBUGGING: Using realStarredNotesCount for other user:', realStarredNotesCount);
      return realStarredNotesCount;
    }
  }, [isCurrentUser, getStarredNotes, starredNotes, realStarredNotesCount]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={Colors.primaryText} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton} onPress={handleSharePress}>
                <Icon name="share" size={24} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <Avatar
                size="large"
                imageUrl={userProfile?.avatar_url}
                username={displayUsername}
              />
              <Text style={styles.username}>{displayUsername}</Text>
            </View>

            {/* Social Stats Section */}
            <View style={styles.socialStats}>
              <TouchableOpacity onPress={handleFollowersPress}>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{followersCount}</Text>
                  <Text style={styles.statLabel}> followers</Text>
                </Text>
              </TouchableOpacity>
              <Text style={styles.statSeparator}>  </Text>
              <TouchableOpacity onPress={handleFollowingPress}>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{followingCount}</Text>
                  <Text style={styles.statLabel}> following</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Follow Button Section - Only show for other users, not current user */}
            {!isCurrentUser && (
              <View style={styles.followButtonSection}>
                <TouchableOpacity 
                  style={[styles.followButton, isFollowing && styles.followingButton]} 
                  onPress={handleFollowPress}
                >
                  <Icon 
                    name={isFollowing ? "user-check" : "user-plus"} 
                    size={16} 
                    color={isFollowing ? Colors.secondaryText : Colors.mainBackground} 
                  />
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Readme Header */}
            <View style={styles.readmeHeader}>
              <Text style={styles.readmeLabel}>Readme</Text>
            </View>

            {/* Readme Section */}
            <View style={styles.readmeSection}>
              <View style={styles.readmeContent}>
                <Text style={styles.readmeTitle}>{readmeData.title}</Text>
                <ScrollView style={styles.markdownContainer} nestedScrollEnabled={true}>
                  <Markdown 
                    style={markdownStyles}
                    mergeStyle={false}
                  >
                    {readmeData.content || '*No content yet.*'}
                  </Markdown>
                </ScrollView>
              </View>
            </View>

            {/* My Notes Section */}
            <TouchableOpacity style={styles.menuItem} onPress={handleMyNotesPress}>
              <Text style={styles.menuItemText}>My notes</Text>
              <View style={styles.menuItemRight}>
                <Text style={styles.menuItemCount}>{myNotesCount}</Text>
                <Icon name="chevron-right" size={20} color={Colors.secondaryText} />
              </View>
            </TouchableOpacity>

            {/* Starred Notes Section */}
            <TouchableOpacity style={styles.menuItem} onPress={handleStarredNotesPress}>
              <Text style={styles.menuItemText}>Starred notes</Text>
              <View style={styles.menuItemRight}>
                <Text style={styles.menuItemCount}>{starredNotesCount}</Text>
                <Icon name="chevron-right" size={20} color={Colors.secondaryText} />
              </View>
            </TouchableOpacity>

            {/* Highlight Section */}
            <View style={styles.highlightSection}>
              <Text style={styles.highlightTitle}>Recent</Text>
              <View style={styles.highlightGrid}>
                {highlightNotes.map((note) => (
                  <TouchableOpacity
                    key={note.id}
                    style={styles.highlightCard}
                    onPress={() => handleNotePress(note)}
                  >
                    <View style={styles.highlightCardHeader}>
                      <Avatar
                        size="small"
                        imageUrl={getConsistentAvatarUrl({
                          userId: userProfile?.user_id,
                          currentUser: currentUser,
                          currentProfile: currentProfile,
                          currentProfilePhoto: currentProfile?.avatar_url,
                          profiles: userProfile,
                          avatarUrl: userProfile?.avatar_url,
                          username: displayUsername
                        })}
                        username={getConsistentUsername({
                          userId: userProfile?.user_id,
                          currentUser: currentUser,
                          currentProfile: currentProfile,
                          profiles: userProfile,
                          username: displayUsername
                        })}
                      />
                      <Text style={styles.highlightUsername}>{displayUsername}</Text>
                    </View>
                    <Text style={styles.highlightNoteTitle}>{note.title}</Text>
                    <View style={styles.highlightStats}>
                      <View style={styles.statChip}>
                        <Icon name="star" size={12} color={note.star_count > 0 ? '#FFD700' : Colors.secondaryText} />
                        <Text style={styles.highlightStatText}>{note.star_count || 0}</Text>
                      </View>
                      <View style={styles.statChip}>
                        <Icon name="git-branch" size={12} color={Colors.secondaryText} />
                        <Text style={styles.highlightStatText}>{note.fork_count || 0}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
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
    backgroundColor: Colors.noteCard,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.noteCard,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  followButtonSection: {
    paddingHorizontal: Layout.screen.padding,
    paddingBottom: Layout.spacing.lg,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryText,
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: 10,
    gap: Layout.spacing.sm,
    minWidth: 120,
  },
  followingButton: {
    backgroundColor: Colors.noteCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.mainBackground,
  },
  followingButtonText: {
    color: Colors.secondaryText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for floating navigation
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  username: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  socialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  statText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  statLabel: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  statSeparator: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  readmeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    marginBottom: Layout.spacing.sm,
  },
  readmeSection: {
    backgroundColor: Colors.noteCard,
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  readmeLabel: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  readmeContent: {
    // No background or border radius - just content styling
  },
  readmeTitle: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
    backgroundColor: Colors.noteCard,
    marginHorizontal: Layout.screen.padding,
    marginBottom: Layout.spacing.sm,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  menuItemCount: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  highlightSection: {
    paddingHorizontal: Layout.screen.padding,
    paddingTop: Layout.spacing.lg,
  },
  highlightTitle: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginBottom: Layout.spacing.md,
  },
  highlightGrid: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: Layout.spacing.md,
  },
  highlightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm, // 8px for consistency
  },
  highlightAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  highlightAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  highlightAvatarText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  highlightUsername: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  highlightNoteTitle: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Layout.spacing.sm,
  },
  highlightStats: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  highlightStatText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
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
  markdownContainer: {
    maxHeight: 150,
  },
});

// Markdown styles for readme content
const markdownStyles = {
  body: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    lineHeight: 22,
  },
  heading1: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  heading2: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 6,
    marginTop: 10,
    lineHeight: 20,
  },
  heading3: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.xs,
    marginTop: Layout.spacing.sm,
  },
  strong: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
  },
  em: {
    fontStyle: 'italic',
    color: Colors.primaryText,
  },
  link: {
    color: Colors.floatingButton,
    textDecorationLine: 'underline',
  },
  paragraph: {
    marginBottom: Layout.spacing.sm,
    lineHeight: 22,
  },
  list_item: {
    marginBottom: Layout.spacing.xs,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
    paddingLeft: Layout.spacing.sm,
    marginLeft: Layout.spacing.xs,
    fontStyle: 'italic',
    color: Colors.secondaryText,
  },
  code_inline: {
    backgroundColor: Colors.border,
    fontFamily: 'Courier',
    fontSize: Typography.fontSize.small,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  code_block: {
    backgroundColor: Colors.border,
    fontFamily: 'Courier',
    fontSize: Typography.fontSize.small,
    padding: Layout.spacing.sm,
    borderRadius: 6,
    marginVertical: Layout.spacing.xs,
  },
};

export default UserProfileScreen;