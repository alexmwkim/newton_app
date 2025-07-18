import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Markdown from 'react-native-markdown-display';
// import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import BottomNavigationComponent from '../components/BottomNavigationComponent';
import ProfileStore from '../store/ProfileStore';
import { useNotesStore } from '../store/NotesStore';

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

const mockHighlightNotes = [
  {
    id: 1,
    title: 'project abcd',
    forkCount: 5,
    starCount: 12,
    username: 'userid',
    isStarred: false,
  },
  {
    id: 2,
    title: 'my journal',
    forkCount: 5,
    starCount: 8,
    username: 'userid',
    isStarred: true,
  },
];

const ProfileScreen = ({ navigation }) => {
  const [activeNavTab, setActiveNavTab] = useState(3); // Profile is index 3
  const [readmeData, setReadmeData] = useState({
    title: mockUser.readmeTitle,
    content: mockUser.readmeContent,
  });
  
  // Social features state
  const [isFollowing, setIsFollowing] = useState(mockUser.isFollowing);
  const [followersCount, setFollowersCount] = useState(mockUser.followersCount);
  const [highlightNotes, setHighlightNotes] = useState([]);
  
  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [userProfilePhotoForNotes, setUserProfilePhotoForNotes] = useState(ProfileStore.getProfilePhoto());
  
  // Notes store
  const { privateNotes, publicNotes, isFavorite, toggleFavorite, getStarredNotes } = useNotesStore();

  // Calculate actual notes count
  const currentUser = 'alexnwkim';
  const myNotesCount = privateNotes.length + publicNotes.filter(note => 
    note.username === currentUser || note.author === currentUser
  ).length;
  const starredNotesCount = getStarredNotes().length;

  console.log('📊 Profile counts - My notes:', myNotesCount, 'Starred notes:', starredNotesCount);

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
    
    return () => clearInterval(interval);
  }, []);

  // Subscribe to notes changes for highlight updates and count updates
  useEffect(() => {
    loadHighlightNotes();
    console.log('📊 Notes changed - updating counts');
  }, [privateNotes, publicNotes, isFavorite, starredNotesCount]);

  // Subscribe to profile photo changes for highlight notes
  useEffect(() => {
    const unsubscribe = ProfileStore.subscribe(() => {
      setUserProfilePhotoForNotes(ProfileStore.getProfilePhoto());
    });
    return unsubscribe;
  }, []);

  const loadProfilePhoto = async () => {
    try {
      const savedPhoto = await AsyncStorage.getItem('profilePhoto');
      if (savedPhoto) {
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
      await AsyncStorage.removeItem('profilePhoto');
      setProfilePhoto(null);
      ProfileStore.setProfilePhoto(null); // Update shared store
    } catch (error) {
      console.log('Error deleting profile photo:', error);
    }
  };
  
  const loadHighlightNotes = () => {
    const allNotes = [...privateNotes, ...publicNotes];
    const currentUser = 'alexnwkim'; // Current logged-in user
    
    // Filter for current user's public notes
    const userPublicNotes = allNotes.filter(note => 
      note.isPublic && 
      (note.username === currentUser || note.author === currentUser)
    );
    
    // Sort by modification date ("Just now" first, then by actual date)
    const sortedNotes = userPublicNotes.sort((a, b) => {
      // If both have "Just now", sort by id (newer first)
      if (a.timeAgo === 'Just now' && b.timeAgo === 'Just now') {
        return b.id - a.id;
      }
      // "Just now" notes come first
      if (a.timeAgo === 'Just now') return -1;
      if (b.timeAgo === 'Just now') return 1;
      
      // Sort by actual modification date if available
      if (a.lastModified && b.lastModified) {
        return new Date(b.lastModified) - new Date(a.lastModified);
      }
      
      // Fall back to creation date or id
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      
      return b.id - a.id;
    });
    
    // Take only the first 2 notes for highlight section
    const highlightData = sortedNotes.slice(0, 2).map(note => ({
      id: note.id,
      title: note.title,
      forkCount: note.forksCount || note.forkCount || 0,
      starCount: note.starCount || 0,
      username: note.username || currentUser,
      isStarred: isFavorite(note.id)
    }));
    
    setHighlightNotes(highlightData);
    console.log('📈 Loaded highlight notes:', highlightData.length, 'notes');
  };

  const handleProfilePhotoPress = () => {
    if (profilePhoto) {
      // Show options to change or delete photo
      Alert.alert(
        'Profile Photo',
        'What would you like to do?',
        [
          { text: 'Change Photo', onPress: selectProfilePhoto },
          { text: 'Delete Photo', onPress: () => {
            Alert.alert(
              'Delete Photo',
              'Are you sure you want to delete your profile photo?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: deleteProfilePhoto }
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
  };

  const selectProfilePhoto = async () => {
    // For now, simulate photo upload with a placeholder
    // In a production app, you would use expo-image-picker here
    
    /* 
    // PRODUCTION CODE - uncomment when deploying to device:
    // First, request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload a profile photo.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setProfilePhoto(imageUri);
      await saveProfilePhoto(imageUri);
      console.log('📸 Profile photo updated');
    }
    */
    
    // DEVELOPMENT/SIMULATOR CODE:
    Alert.alert(
      'Upload Profile Photo',
      'Photo upload functionality will be available when running on a device. For now, a sample photo will be used.',
      [
        { 
          text: 'Use Sample Photo', 
          onPress: () => {
            // Use a sample photo URL for demonstration
            const samplePhotoUri = 'https://i.pravatar.cc/150?img=3';
            setProfilePhoto(samplePhotoUri);
            saveProfilePhoto(samplePhotoUri);
            console.log('📸 Sample profile photo set');
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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
    navigation.navigate('myNotes');
  };

  const handleStarredNotesPress = () => {
    console.log('Starred notes pressed');
    navigation.navigate('starredNotes');
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
              <TouchableOpacity style={styles.avatarContainer} onPress={handleProfilePhotoPress}>
                <View style={styles.avatar}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                  ) : (
                    <Icon name="user" size={24} color={Colors.secondaryText} />
                  )}
                </View>
                <View style={styles.cameraIconContainer}>
                  <Icon name="camera" size={16} color={Colors.mainBackground} />
                </View>
              </TouchableOpacity>
              <Text style={styles.username}>{mockUser.username}</Text>
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
                  <Text style={styles.statNumber}>{mockUser.followingCount}</Text>
                  <Text style={styles.statLabel}> following</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Follow Button Section */}
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
              <Text style={styles.highlightTitle}>Highlight</Text>
              <View style={styles.highlightGrid}>
                {highlightNotes.map((note) => (
                  <TouchableOpacity
                    key={note.id}
                    style={styles.highlightCard}
                    onPress={() => handleNotePress(note)}
                  >
                    <View style={styles.highlightCardHeader}>
                      <View style={styles.highlightAvatar}>
                        {userProfilePhotoForNotes ? (
                          <Image source={{ uri: userProfilePhotoForNotes }} style={styles.highlightAvatarImage} />
                        ) : (
                          <Icon name="user" size={16} color={Colors.secondaryText} />
                        )}
                      </View>
                      <Text style={styles.highlightUsername}>{note.username}</Text>
                    </View>
                    <Text style={styles.highlightNoteTitle}>{note.title}</Text>
                    <View style={styles.highlightStats}>
                      <View style={styles.statChip}>
                        <Icon name="star" size={12} color={Colors.secondaryText} />
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
    gap: Layout.spacing.xs,
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