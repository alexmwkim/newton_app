import React, { useState, useEffect } from 'react';
import { View, ScrollView, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { useNotesStore } from '../store/NotesStore';

// Builder.io converted components
import HeaderComponent from '../components/HeaderComponent';
import ToggleButtonsComponent from '../components/ToggleButtonsComponent';
import NotesListComponent from '../components/NotesListComponent';
import CreateButtonComponent from '../components/CreateButtonComponent';
import BottomNavigationComponent from '../components/BottomNavigationComponent';

// Mock data matching the design
const mockPrivateNotes = [
  {
    id: 1,
    title: '📏 Scroll gap fixed - Notes have proper margin ✅ LIVE RELOAD TEST',
    timeAgo: '5 hrs ago',
  },
  {
    id: 2,
    title: 'Idea notes',
    timeAgo: '05/08/25',
  },
  {
    id: 3,
    title: 'Oio project',
    timeAgo: '10/04/24',
  },
  {
    id: 4,
    title: 'Workout session',
    timeAgo: '09/12/24',
  },
  {
    id: 5,
    title: 'Morning thoughts',
    timeAgo: '1 day ago',
  },
  
 
  
  
 
  
  
];

const mockPublicNotes = [
  {
    id: 13,
    title: 'React Native Best Practices',
    timeAgo: '5 hours ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 5,
    starCount: 24,
  },
  {
    id: 14,
    title: 'Design System Guide',
    timeAgo: '1 day ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 12,
    starCount: 67,
  },
  {
    id: 15,
    title: 'JavaScript Performance Tips',
    timeAgo: '2 days ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 8,
    starCount: 41,
  },
  {
    id: 16,
    title: 'Mobile App Architecture',
    timeAgo: '3 days ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 15,
    starCount: 89,
  },
  {
    id: 17,
    title: 'UI/UX Design Principles',
    timeAgo: '1 week ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 3,
    starCount: 16,
  },
  {
    id: 18,
    title: 'Remote Work Tips',
    timeAgo: '1 week ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 7,
    starCount: 33,
  },
  {
    id: 19,
    title: 'Building Great Teams',
    timeAgo: '2 weeks ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 22,
    starCount: 156,
  },
  {
    id: 20,
    title: 'Productivity Hacks',
    timeAgo: '2 weeks ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 11,
    starCount: 78,
  },
  {
    id: 21,
    title: 'Tech Industry Insights',
    timeAgo: '3 weeks ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 6,
    starCount: 29,
  },
  {
    id: 22,
    title: 'Startup Lessons Learned',
    timeAgo: '1 month ago',
    username: 'alexnwkim',
    avatarUrl: 'https://via.placeholder.com/24',
    forksCount: 18,
    starCount: 134,
  },
];

const HomeScreenNew = ({ navigation, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'private');
  const [activeNavTab, setActiveNavTab] = useState(0);
  const { privateNotes, publicNotes, deleteNote } = useNotesStore();

  // Update activeTab when initialTab prop changes (coming back from note detail)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);


  console.log('🏠 HomeScreen render - Private notes:', privateNotes.length, 'Public notes:', publicNotes.length);
  const currentNotes = activeTab === 'private' ? privateNotes : publicNotes;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleNavChange = (tabIndex) => {
    setActiveNavTab(tabIndex);
    // Handle navigation to different screens
    switch (tabIndex) {
      case 0:
        // Home - current screen
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

  const handleNoteClick = (noteId) => {
    navigation.navigate('noteDetail', { 
      noteId, 
      returnToTab: activeTab // Pass current tab state
    });
  };

  const handleCreateNote = () => {
    console.log('🚀 Creating note');
    navigation.navigate('createNote', { 
      returnToTab: activeTab
    });
  };

  const handleDeleteNote = (noteId) => {
    deleteNote(noteId, activeTab === 'public');
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleNotificationsPress = () => {
    console.log('🔔 Notifications pressed');
    navigation.navigate('notifications');
  };

  const handleMenuPress = () => {
    console.log('📋 More menu pressed');
    navigation.navigate('more');
  };

  const handleLogoPress = () => {
    // Refresh the page by resetting state
    setActiveTab('private');
    setActiveNavTab(0);
    // Could also trigger a data refresh here
    console.log('Logo pressed - refreshing page');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.mainBackground} />
      
      <View style={styles.content}>
        <View style={styles.mainContent}>
          <HeaderComponent
            onBackPress={handleBackPress}
            onNotificationsPress={handleNotificationsPress}
            onMenuPress={handleMenuPress}
            onLogoPress={handleLogoPress}
          />
          
          <View style={styles.contentWithPadding}>
            <ToggleButtonsComponent
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
            
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <NotesListComponent
                notes={currentNotes}
                onNoteClick={handleNoteClick}
                onDeleteNote={handleDeleteNote}
                isPublic={activeTab === 'public'}
              />
            </ScrollView>
          </View>
        </View>
        
        {/* Floating Elements - Overlay */}
        <View style={styles.floatingElements}>
          <CreateButtonComponent onPress={handleCreateNote} />
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
  contentWithPadding: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0, // Maximum space when scrolling near toggle buttons
    paddingBottom: 0, // Ensure content doesn't appear behind floating nav
  },
  floatingElements: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
    pointerEvents: 'box-none', // Allow touches to pass through to scroll
  },
});

export default HomeScreenNew;