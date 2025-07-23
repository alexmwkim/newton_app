import React, { useState, useEffect } from 'react';
import { View, ScrollView, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import Colors from '../constants/Colors';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';

// Builder.io converted components
import HeaderComponent from '../components/HeaderComponent';
import ToggleButtonsComponent from '../components/ToggleButtonsComponent';
import NotesListComponent from '../components/NotesListComponent';
import CreateButtonComponent from '../components/CreateButtonComponent';
import BottomNavigationComponent from '../components/BottomNavigationComponent';
import PinnedNotesSection from '../components/PinnedNotesSection';
import AdminService from '../services/admin';


const HomeScreenNew = ({ navigation, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'private');
  const [activeNavTab, setActiveNavTab] = useState(0);
  const { privateNotes, publicNotes, deleteNote, getPinnedNotes, togglePinned, clearAllPinnedNotesFromDatabase } = useNotesStore();
  const { signOut, user } = useAuth();
  
  // Get pinned notes
  const pinnedNotes = getPinnedNotes();

  // Update activeTab when initialTab prop changes (coming back from note detail)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);


  console.log('🏠 HomeScreen render - Private notes:', privateNotes.length, 'Public notes:', publicNotes.length);
  
  // Debug: Check first note from each category
  if (privateNotes.length > 0) {
    console.log('🔍 First private note:', privateNotes[0].title, 'isPublic:', privateNotes[0].isPublic, 'is_public:', privateNotes[0].is_public);
  }
  if (publicNotes.length > 0) {
    console.log('🔍 First public note:', publicNotes[0].title, 'isPublic:', publicNotes[0].isPublic, 'is_public:', publicNotes[0].is_public);
  }
  
  // Filter notes - pinned notes will appear in both pinned section and main lists
  const filteredPrivateNotes = privateNotes; // Show all private notes
  
  // Since these are user's own notes, no filtering needed - just show all
  const filteredPublicNotes = publicNotes; // Show all user's public notes
  
  console.log('🏠 Pinned:', pinnedNotes.length, 'Filtered Private:', filteredPrivateNotes.length, 'Filtered Public:', filteredPublicNotes.length);
  console.log('🏠 Pinned notes details:', pinnedNotes);
  
  // Debug: Show available note IDs for testing pinning
  if (privateNotes.length > 0) {
    console.log('🔍 Available private note IDs for testing:', privateNotes.map(n => `${n.title}: ${n.id}`));
  }
  if (publicNotes.length > 0) {
    console.log('🔍 Available public note IDs for testing:', publicNotes.map(n => `${n.title}: ${n.id}`));
  }
  
  const currentNotes = activeTab === 'private' ? filteredPrivateNotes : filteredPublicNotes;

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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      `User ID: ${user?.id}\nAre you sure you want to logout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            console.log('🚪 Manual logout triggered');
            await signOut();
          }
        }
      ]
    );
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

  // TEMP: Database cleanup function (for debugging)
  const handleDatabaseCleanup = async () => {
    try {
      console.log('🗑️ Cleaning up Supabase pinned notes database...');
      await clearAllPinnedNotesFromDatabase();
      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
    }
  };

  // TEMP: DISABLED auto-fix to prevent foreign key errors
  React.useEffect(() => {
    // const autoFixUserIds = async () => {
    //   console.log('🔧 Auto-fixing user IDs on app load...');
    //   const result = await AdminService.fixUserIdMismatch();
    //   console.log('🔧 Auto-fix result:', result);
    // };
    
    // Auto-fix user IDs when component mounts
    // autoFixUserIds();
    
    global.cleanupDatabase = handleDatabaseCleanup;
    
    // TEMP: Add direct pin test functions
    global.testPinFirst = async () => {
      if (currentNotes.length > 0) {
        const noteToPin = currentNotes[0];
        console.log('🧪 Testing pin for first note:', noteToPin.title, noteToPin.id);
        try {
          const result = await togglePinned(noteToPin.id);
          console.log('🧪 Pin test result:', result);
        } catch (error) {
          console.error('🧪 Pin test error:', error);
        }
      } else {
        console.log('🧪 No notes available to test');
      }
    };
    
    global.testUnpinFirst = async () => {
      if (pinnedNotes.length > 0) {
        const noteToUnpin = pinnedNotes[0];
        console.log('🧪 Testing unpin for first pinned note:', noteToUnpin.title, noteToUnpin.id);
        try {
          const result = await togglePinned(noteToUnpin.id);
          console.log('🧪 Unpin test result:', result);
        } catch (error) {
          console.error('🧪 Unpin test error:', error);
        }
      } else {
        console.log('🧪 No pinned notes to test');
      }
    };
    
    global.fixUserIds = async () => {
      console.log('🔧 Starting User ID fix...');
      const result = await AdminService.fixUserIdMismatch();
      console.log('🔧 Fix result:', result);
    };
    
    global.fixUserIdsProper = async () => {
      console.log('🔧 Starting PROPER User ID fix...');
      const result = await AdminService.fixUserIdMismatchProper();
      console.log('🔧 PROPER Fix result:', result);
    };
    
    global.fixUserIdsNoConstraints = async () => {
      console.log('🔧 Starting NO-CONSTRAINTS User ID fix...');
      const result = await AdminService.fixUserIdNoConstraints();
      console.log('🔧 NO-CONSTRAINTS Fix result:', result);
    };
    
    return () => {
      delete global.cleanupDatabase;
      delete global.testPinFirst;
      delete global.testUnpinFirst;
      delete global.fixUserIds;
      delete global.fixUserIdsProper;
      delete global.fixUserIdsNoConstraints;
    };
  }, [currentNotes, pinnedNotes, togglePinned]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.mainBackground} />
      
      <View style={styles.content}>
        <View style={styles.mainContent}>
          <HeaderComponent
            onBackPress={handleBackPress}
            onNotificationsPress={handleNotificationsPress}
            onMenuPress={handleLogout}
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
              <PinnedNotesSection
                pinnedNotes={pinnedNotes}
                onNotePress={handleNoteClick}
              />
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