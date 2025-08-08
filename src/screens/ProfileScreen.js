import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import BottomNavigationComponent from '../components/BottomNavigationComponent';
import Avatar from '../components/Avatar';
import ProfileStore from '../store/ProfileStore';
import { getConsistentAvatarUrl, getConsistentUsername } from '../utils/avatarUtils';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';
import ProfileService from '../services/profilesClient';
import NotesService from '../services/notes';
import FollowService from '../services/followClient';

// Mock user data matching the design
const mockUser = {
  id: 1,
  username: 'Userid',
  readmeTitle: 'Hello world!',
  readmeContent: `## Welcome to my profile!

I'm a **developer** who loves to create amazing apps. Here's what I'm working on:

- Mobile app development with *React Native*
- Building user-friendly interfaces
- Always learning new technologies

### Current Projects
- [Newton App](https://github.com/newton) - A note-taking app
- Personal portfolio website

> "The best way to predict the future is to create it."

Feel free to check out my public notes below!`,
  myNotesCount: 12,
  starredNotesCount: 4,
  followersCount: 1247,
  followingCount: 456,
  starsCount: 890,
  isFollowing: false,
};

const ProfileScreen = ({ navigation }) => {
  const [activeNavTab, setActiveNavTab] = useState(3); // Profile is index 3
  const { user, profile, updateProfile } = useAuth();
  const [readmeData, setReadmeData] = useState({
    title: mockUser.readmeTitle,
    content: mockUser.readmeContent,
  });
  
  // Social features state
  const [isFollowing, setIsFollowing] = useState(mockUser.isFollowing);

  // Use actual user data if available, otherwise fallback to mock
  const currentUser = user ? {
    id: user.id,
    username: profile?.username || user.username || user.email?.split('@')[0] || 'alexkim',
    readmeTitle: readmeData.title,
    readmeContent: readmeData.content,
    myNotesCount: mockUser.myNotesCount,
    starredNotesCount: mockUser.starredNotesCount,
    followersCount: mockUser.followersCount,
    followingCount: mockUser.followingCount,
    starsCount: mockUser.starsCount,
    isFollowing: isFollowing,
  } : mockUser;
  const [followersCount, setFollowersCount] = useState(0); // Start with 0, will load real data
  const [followingCount, setFollowingCount] = useState(0); // Start with 0, will load real data
  const [highlightNotes, setHighlightNotes] = useState([]);
  
  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [userProfilePhotoForNotes, setUserProfilePhotoForNotes] = useState(ProfileStore.getProfilePhoto());
  
  // Get consistent username for display
  const getUsernameForDisplay = () => {
    return profile?.username || user?.username || user?.email?.split('@')[0] || 'alexkim';
  };

  // Notes store
  const { privateNotes, publicNotes, globalPublicNotes, isFavorite, toggleFavorite, getStarredNotes, starredNotes } = useNotesStore();

  // Calculate actual notes count - user's own public notes only
  const myNotesCount = publicNotes.length; // publicNotes already contains only user's own public notes
  
  // Get starred notes - use the data from NotesStore
  const userStarredNotes = React.useMemo(() => {
    console.log('⭐ ProfileScreen calculating starred notes');
    console.log('⭐ starredNotes from store (local IDs):', starredNotes?.length || 0, 'IDs');
    console.log('⭐ getStarredNotes() (note objects):', getStarredNotes()?.length || 0, 'notes');
    console.log('⭐ starredNotes array detail:', starredNotes);
    
    const result = getStarredNotes();
    console.log('⭐ ProfileScreen using starred notes:', result?.length || 0);
    console.log('⭐ ProfileScreen starred notes details:', result?.map(n => `${n.title}(${n.id})`));
    return result;
  }, [getStarredNotes, starredNotes]);
  
  const starredNotesCount = userStarredNotes?.length || 0;

  console.log('📊 Profile counts - My notes:', myNotesCount, 'Starred notes:', starredNotesCount);
  console.log('📊 Profile data - publicNotes:', publicNotes.length, 'globalPublicNotes:', globalPublicNotes?.length);
  console.log('📊 Public notes details:', publicNotes.map(n => `${n.title}(${n.is_public})`));

  useEffect(() => {
    // Check for global readme data on every render
    const checkForUpdates = () => {
      const newReadmeData = global.newReadmeData;
      if (newReadmeData) {
        console.log('📝 Updating readme with new data:', newReadmeData);
        setReadmeData(newReadmeData);
        global.newReadmeData = null; // Clear the global data
      }
    };

    checkForUpdates();
    
    // Set up an interval to check for updates
    const interval = setInterval(checkForUpdates, 100);
    
    // Load saved profile photo
    loadProfilePhoto();
    
    // Load highlight notes
    loadHighlightNotes();
    
    // Load real social stats
    loadRealSocialStats();
    
    return () => clearInterval(interval);
  }, []);

  // Subscribe to notes changes for highlight updates and count updates
  useEffect(() => {
    console.log('📊 Notes changed - updating highlights and counts');
    console.log('📊 Public notes count:', publicNotes?.length);
    console.log('📊 Latest public note updated_at:', publicNotes?.[0]?.updated_at);
    loadHighlightNotes();
  }, [
    privateNotes?.length, 
    publicNotes?.length,
    // Also watch for changes in the most recent public note's updated_at
    publicNotes?.[0]?.updated_at,
    // Watch the entire publicNotes array to catch any updates
    JSON.stringify(publicNotes?.map(n => ({ id: n.id, updated_at: n.updated_at })))
  ]);

  // Subscribe to profile photo changes for highlight notes
  useEffect(() => {
    const unsubscribe = ProfileStore.subscribe(() => {
      setUserProfilePhotoForNotes(ProfileStore.getProfilePhoto());
    });
    return unsubscribe;
  }, []);

  // Load profile photo when AuthContext profile changes
  useEffect(() => {
    if (profile?.avatar_url) {
      console.log('📸 AuthContext profile avatar_url changed, updating local state:', profile.avatar_url);
      setProfilePhoto(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  const loadProfilePhoto = async () => {
    try {
      // First try to load from AuthContext profile (most up-to-date)
      if (profile?.avatar_url) {
        console.log('📸 Loading avatar from AuthContext profile:', profile.avatar_url);
        setProfilePhoto(profile.avatar_url);
        await saveProfilePhoto(profile.avatar_url); // Save to local storage too
        return;
      }
      
      // Then try to load from Supabase if user is authenticated
      if (user?.id) {
        const { data: profileData, error } = await ProfileService.getProfile(user.id);
        if (!error && profileData?.avatar_url) {
          console.log('📸 Loading avatar from Supabase:', profileData.avatar_url);
          setProfilePhoto(profileData.avatar_url);
          await saveProfilePhoto(profileData.avatar_url); // Save to local storage too
          return;
        }
      }
      
      // Fallback to local storage
      const savedPhoto = await AsyncStorage.getItem('profilePhoto');
      if (savedPhoto) {
        console.log('📸 Loading avatar from local storage:', savedPhoto);
        setProfilePhoto(savedPhoto);
      }
    } catch (error) {
      console.log('Error loading profile photo:', error);
    }
  };

  const saveProfilePhoto = async (uri) => {
    try {
      await AsyncStorage.setItem('profilePhoto', uri);
      ProfileStore.setProfilePhoto(uri); // Update shared store
    } catch (error) {
      console.log('Error saving profile photo:', error);
    }
  };

  const deleteProfilePhoto = async () => {
    try {
      // Delete from Supabase if there's a current profile photo
      if (profilePhoto && user?.id) {
        const { error } = await ProfileService.deleteAvatar(user.id, profilePhoto);
        if (error) {
          console.error('📸 Failed to delete from Supabase:', error);
          Alert.alert('Error', 'Failed to delete profile photo from server.');
          return;
        }
      }
      
      // Remove from local storage
      await AsyncStorage.removeItem('profilePhoto');
      setProfilePhoto(null);
      ProfileStore.setProfilePhoto(null); // Update shared store
      
      // Update AuthContext profile to remove avatar_url
      await updateProfile({ avatar_url: null });
      
      console.log('📸 Profile photo deleted successfully and profile updated');
      Alert.alert('Success', 'Profile photo deleted!');
    } catch (error) {
      console.error('📸 Error deleting profile photo:', error);
      Alert.alert('Error', 'Failed to delete profile photo.');
    }
  };
  
  // Load real social stats using FollowService
  const loadRealSocialStats = async () => {
    try {
      if (!user?.id) {
        console.log('📊 ProfileScreen: No user ID available for social stats');
        setFollowersCount(0);
        setFollowingCount(0);
        return;
      }

      console.log('📊 ProfileScreen: Loading real follow stats for user:', user.id);

      // Initialize follows table if needed (first time setup)
      await FollowService.initializeFollowsTable();

      // Get real followers count
      const { success: followersSuccess, count: followers } = await FollowService.getFollowersCount(user.id);
      if (followersSuccess) {
        setFollowersCount(followers);
        console.log('👥 ProfileScreen: Real followers count:', followers);
      } else {
        setFollowersCount(0);
      }

      // Get real following count
      const { success: followingSuccess, count: following } = await FollowService.getFollowingCount(user.id);
      if (followingSuccess) {
        setFollowingCount(following);
        console.log('👥 ProfileScreen: Real following count:', following);
      } else {
        setFollowingCount(0);
      }

    } catch (err) {
      console.error('❌ ProfileScreen: Exception loading follow stats:', err);
      setFollowersCount(0);
      setFollowingCount(0);
    }
  };
  
  const loadHighlightNotes = () => {
    // Use publicNotes directly since it already contains only user's own public notes
    const userPublicNotes = publicNotes.filter(note => 
      note.isPublic !== false // Make sure it's actually a public note
    );
    
    // Sort by MOST RECENTLY UPDATED first for "Recent" section
    const sortedNotes = userPublicNotes.sort((a, b) => {
      console.log('📈 Comparing notes for sorting:', {
        a: { title: a.title, updated_at: a.updated_at },
        b: { title: b.title, updated_at: b.updated_at }
      });
      
      // Primary sort: most recently updated first
      const aUpdatedDate = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0);
      const bUpdatedDate = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0);
      const dateDiff = bUpdatedDate.getTime() - aUpdatedDate.getTime();
      
      if (dateDiff !== 0) {
        console.log('📈 Sorted by updated_at:', a.title, 'vs', b.title, '→', dateDiff > 0 ? 'b wins' : 'a wins');
        return dateDiff; // Most recently updated first
      }
      
      // Secondary sort: if update times are equal, sort by star count
      const aStarCount = a.star_count || a.starCount || 0;
      const bStarCount = b.star_count || b.starCount || 0;
      return bStarCount - aStarCount;
    });
    
    console.log('📈 Final sorted notes order:', sortedNotes.map(n => `${n.title} (updated: ${n.updated_at})`));
    
    // Take only the first 2 notes for highlight section
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
        id: note.id,
        title: note.title,
        forkCount: note.fork_count || note.forksCount || note.forkCount || 0,
        starCount: note.star_count || note.starCount || 0,
        username: getUsernameForDisplay(),
        isStarred: false // Simplified to avoid circular dependency - will be calculated in render
      };
    });
    
    setHighlightNotes(highlightData);
    console.log('📈 Loaded highlight notes:', highlightData.length, 'notes');
    console.log('📈 Highlight notes with counts:', highlightData.map(n => `${n.title}: star=${n.starCount}, fork=${n.forkCount}`));
  };

  const handleProfilePhotoPress = () => {
    try {
      console.log('📸 Profile photo pressed, current photo:', profilePhoto ? 'exists' : 'none');
      
      if (profilePhoto) {
        // Show options to change or delete photo
        Alert.alert(
          'Profile Photo',
          'What would you like to do?',
          [
            { text: 'Change Photo', onPress: () => {
              try {
                selectProfilePhoto();
              } catch (error) {
                console.error('📸 Error in change photo:', error);
                Alert.alert('Error', 'Failed to change photo');
              }
            }},
            { text: 'Delete Photo', onPress: () => {
              Alert.alert(
                'Delete Photo',
                'Are you sure you want to delete your profile photo?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => {
                    try {
                      deleteProfilePhoto();
                    } catch (error) {
                      console.error('📸 Error in delete photo:', error);
                      Alert.alert('Error', 'Failed to delete photo');
                    }
                  }}
                ]
              );
            }},
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        // No photo, show upload option
        selectProfilePhoto();
      }
    } catch (error) {
      console.error('📸 Error in handleProfilePhotoPress:', error);
      Alert.alert('Error', 'Failed to handle profile photo action');
    }
  };

  const selectProfilePhoto = async () => {
    try {
      console.log('📸 Starting photo selection process...');
      
      // Check if user is logged in
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to upload a profile photo.');
        return;
      }
      
      // For iOS Simulator, offer sample photo option first
      if (Platform.OS === 'ios' && __DEV__) {
        Alert.alert(
          'Profile Photo',
          'Running on iOS Simulator. Image picker may not work properly. Would you like to use a sample photo instead?',
          [
            { 
              text: 'Use Sample Photo', 
              onPress: async () => {
                try {
                  const samplePhotoUri = 'https://i.pravatar.cc/150?img=3';
                  
                  // Update local state
                  setProfilePhoto(samplePhotoUri);
                  await saveProfilePhoto(samplePhotoUri);
                  
                  // Update AuthContext profile so it's available across the app
                  await updateProfile({ avatar_url: samplePhotoUri });
                  
                  console.log('📸 Sample profile photo set and profile updated');
                  Alert.alert('Success', 'Sample profile photo set!');
                } catch (error) {
                  console.error('📸 Error setting sample photo:', error);
                  Alert.alert('Error', 'Failed to set sample photo');
                }
              }
            },
            { 
              text: 'Try Image Picker (May Crash)', 
              onPress: () => {
                Alert.alert(
                  'Warning', 
                  'Image picker may cause the app to crash on simulator. Are you sure you want to continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Continue', onPress: () => launchImagePicker() }
                  ]
                );
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        // On device, go straight to image picker
        await launchImagePicker();
      }
    } catch (error) {
      console.error('📸 Error in selectProfilePhoto:', error);
      console.error('📸 Error stack:', error.stack);
      Alert.alert('Error', `Failed to select profile photo: ${error.message}`);
    }
  };

  const launchImagePicker = async () => {
    try {
      console.log('📸 Starting image picker process...');
      
      // Check if ImagePicker is available
      if (!ImagePicker) {
        console.error('📸 ImagePicker is not available');
        Alert.alert('Error', 'Image picker is not available on this device.');
        return;
      }

      console.log('📸 Requesting media library permissions...');
      
      // Request permissions with error handling
      let permissionResult;
      try {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('📸 Permission result:', permissionResult);
      } catch (permissionError) {
        console.error('📸 Permission request failed:', permissionError);
        Alert.alert('Permission Error', 'Failed to request camera roll permissions. Please check your device settings.');
        return;
      }
      
      if (permissionResult.status !== 'granted') {
        console.log('📸 Permission denied:', permissionResult.status);
        Alert.alert(
          'Permission Required', 
          'We need access to your photo library to set a profile picture. Please go to Settings and enable photo library access for this app.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
        return;
      }

      console.log('📸 Permission granted, launching image picker...');
      
      // Add a small delay to ensure permission state is stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Launch image picker with minimal options to avoid crashes
      let pickerResult;
      try {
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false, // Disable editing to avoid potential crashes
          quality: 0.7, // Lower quality to reduce memory usage
          allowsMultipleSelection: false,
        });
        console.log('📸 Picker completed, result:', JSON.stringify(pickerResult, null, 2));
      } catch (pickerError) {
        console.error('📸 Image picker failed:', pickerError);
        Alert.alert('Image Picker Error', 'Failed to open image picker. This feature may not be available on the simulator.');
        return;
      }

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const imageUri = pickerResult.assets[0].uri;
        console.log('📸 Selected image URI:', imageUri);
        
        if (!imageUri) {
          console.error('📸 No image URI received');
          Alert.alert('Error', 'Failed to get image from picker');
          return;
        }
        
        // Update local state
        setProfilePhoto(imageUri);
        await saveProfilePhoto(imageUri);
        
        // Update AuthContext profile so it's available across the app
        try {
          await updateProfile({ avatar_url: imageUri });
          console.log('📸 Profile updated successfully');
        } catch (updateError) {
          console.error('📸 Profile update failed:', updateError);
          // Don't fail the whole operation if profile update fails
        }
        
        console.log('📸 Profile photo set locally and profile updated:', imageUri);
        Alert.alert('Success', 'Profile photo updated!');
        
      } else {
        console.log('📸 Image selection was canceled');
        // Don't show an alert for cancellation, it's normal user behavior
      }
    } catch (error) {
      console.error('📸 Unexpected error in launchImagePicker:', error);
      console.error('📸 Error stack:', error.stack);
      Alert.alert(
        'Unexpected Error', 
        `An unexpected error occurred: ${error.message}. Image picker may not work properly on the simulator.`
      );
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
        navigation.navigate('explore');
        break;
      case 3:
        // Current screen (Profile)
        break;
    }
  };

  const handleMyNotesPress = () => {
    console.log('My notes pressed');
    navigation.navigate('notesList', {
      listType: 'myNotes',
      username: getUsernameForDisplay(),
      userId: user?.id,
      userProfile: profile,
      title: 'My Notes',
      isCurrentUser: false, // ALWAYS show public notes only in profile "My Notes" section
      // Add origin information for proper back navigation
      originScreen: 'profile'
    });
  };

  const handleStarredNotesPress = () => {
    console.log('Starred notes pressed');
    navigation.navigate('notesList', {
      listType: 'starredNotes',
      username: getUsernameForDisplay(),
      userId: user?.id,
      userProfile: profile,
      title: 'Starred Notes',
      isCurrentUser: true,
      // Add origin information for proper back navigation
      originScreen: 'profile'
    });
  };

  const handleNotePress = (note) => {
    console.log('Highlight note pressed:', note.title);
    // Navigate to note detail with return to profile
    navigation.navigate('noteDetail', { 
      noteId: note.id,
      returnToScreen: 'profile'
    });
  };

  const handleEditReadme = () => {
    console.log('📝 Opening edit readme with current data:', readmeData);
    
    navigation.navigate('editReadme', {
      currentTitle: readmeData.title,
      currentContent: readmeData.content,
    });
  };

  const handleSettingsPress = () => {
    console.log('⚙️ Settings pressed');
    navigation.navigate('settings');
  };

  // Social interaction handlers
  const handleFollowPress = () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);
    console.log(isFollowing ? '👥 Unfollowed user' : '👥 Followed user');
  };


  const handleFollowersPress = () => {
    console.log('👥 Followers pressed');
    // TODO: Navigate to followers list
  };

  const handleFollowingPress = () => {
    console.log('👥 Following pressed');
    // TODO: Navigate to following list
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft} />
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Icon name="share" size={24} color={Colors.primaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleSettingsPress}>
                <Icon name="settings" size={24} color={Colors.primaryText} />
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
                imageUrl={profilePhoto}
                username={getUsernameForDisplay()}
                showCamera={true}
                onPress={handleProfilePhotoPress}
              />
              <Text style={styles.username}>{currentUser.username}</Text>
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

            {/* Follow Button Section - Hidden on own profile */}
            {false && (
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
              <TouchableOpacity onPress={handleEditReadme}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
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
                    {readmeData.content || '*No content yet. Click Edit to add some!*'}
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
                          userId: user?.id,
                          currentUser: user,
                          currentProfile: profile,
                          currentProfilePhoto: userProfilePhotoForNotes,
                          profiles: profile,
                          avatarUrl: userProfilePhotoForNotes,
                          username: getUsernameForDisplay()
                        })}
                        username={getConsistentUsername({
                          userId: user?.id,
                          currentUser: user,
                          currentProfile: profile,
                          profiles: profile,
                          username: getUsernameForDisplay()
                        })}
                      />
                      <Text style={styles.highlightUsername}>{getUsernameForDisplay()}</Text>
                    </View>
                    <Text style={styles.highlightNoteTitle}>{note.title}</Text>
                    <View style={styles.highlightStats}>
                      <View style={styles.statChip}>
                        <Icon name="star" size={12} color={note.starCount > 0 ? '#FFD700' : Colors.secondaryText} />
                        <Text style={styles.highlightStatText}>{note.starCount}</Text>
                      </View>
                      <View style={styles.statChip}>
                        <Icon name="git-branch" size={12} color={Colors.secondaryText} />
                        <Text style={styles.highlightStatText}>{note.forkCount}</Text>
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
  headerLeft: {
    flex: 1,
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
    backgroundColor: Colors.noteCard,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.floatingButton,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.mainBackground,
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
  editButton: {
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
  readmeText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    lineHeight: 22,
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
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  highlightAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
  highlightForkCount: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
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

export default ProfileScreen;