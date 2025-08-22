import React, { useState, useEffect } from 'react';
import { View, ScrollView, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Colors from '../constants/Colors';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../localization/i18n';
import { useViewMode } from '../store/ViewModeStore';

// Components
import { UnifiedHeader } from '../shared/components/layout';
import ToggleButtons from '../shared/components/form/ToggleButtons';
import NotesListComponent from '../components/NotesListComponent';
import FloatingActionButton from '../shared/components/buttons/FloatingActionButton';
import BottomNavigationComponent from '../components/BottomNavigationComponent';
import PinnedNotesSection from '../components/PinnedNotesSection';
import ViewModeModal from '../components/ViewModeModal';
import UnifiedFollowService from '../services/UnifiedFollowService';


const HomeScreenNew = ({ navigation, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'private');
  const [activeNavTab, setActiveNavTab] = useState(0);
  const [viewModeModalVisible, setViewModeModalVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 80, right: 16 });
  const { privateNotes, publicNotes, deleteNote, getPinnedNotes, togglePinned, clearAllPinnedNotesFromDatabase } = useNotesStore();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const { currentViewMode } = useViewMode();
  
  // Get pinned notes
  const pinnedNotes = getPinnedNotes();

  // Update activeTab when initialTab prop changes (coming back from note detail)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // App initialization + Follow data preload for instant Profile transitions
  useEffect(() => {
    console.log('🚀 HomeScreen initialized (admin services disabled in client mode)');
    
    // Network diagnostics removed - debug files cleaned up
    
    // PRELOAD: 현재 사용자의 팔로우 데이터를 미리 캐시
    if (user?.id) {
      try {
        console.log('⚡ PRELOAD: Loading follow data for instant Profile access');
        // UnifiedFollowService는 이미 top-level에서 import됨
        
        // 캐시 확인 후 필요한 경우에만 백그라운드 로딩
        const cachedData = UnifiedFollowService.getFromCache(UnifiedFollowService.getCacheKey('followersCount', { userId: user.id }));
        if (!cachedData) {
          // 백그라운드에서 조용히 로딩 (UI 차단 없음)
          setTimeout(() => {
            Promise.all([
              UnifiedFollowService.getFollowersCount(user.id),
              UnifiedFollowService.getFollowingCount(user.id)
            ]).then(() => {
              console.log('⚡ PRELOAD: Follow data cached for Profile screen');
            }).catch(() => {
              console.log('⚡ PRELOAD: Background caching failed (non-critical)');
            });
          }, 1000); // 1초 지연으로 앱 시작 성능에 영향 최소화
        } else {
          console.log('⚡ PRELOAD: Follow data already cached');
        }
      } catch (error) {
        console.log('⚡ PRELOAD: Failed to preload follow data (non-critical)');
      }
    }
  }, [user?.id]);


  // Safe array access to prevent length undefined errors
  const safePrivateNotes = privateNotes || [];
  const safePublicNotes = publicNotes || [];
  const safePinnedNotes = pinnedNotes || [];
  
  console.log('🏠 HomeScreen render - Private notes:', safePrivateNotes.length, 'Public notes:', safePublicNotes.length);
  
  // Filter notes - pinned notes will appear in both pinned section and main lists
  const filteredPrivateNotes = safePrivateNotes; // Show all private notes
  
  // Since these are user's own notes, no filtering needed - just show all
  const filteredPublicNotes = safePublicNotes; // Show all user's public notes
  
  console.log('🏠 Pinned:', safePinnedNotes.length, 'Filtered Private:', filteredPrivateNotes.length, 'Filtered Public:', filteredPublicNotes.length);
  console.log('🏠 Pinned notes details:', safePinnedNotes);
  
  // Debug: Show available note IDs for testing pinning
  if (safePrivateNotes.length > 0) {
    console.log('🔍 Available private note IDs for testing:', safePrivateNotes.map(n => `${n.title}: ${n.id}`));
  }
  if (safePublicNotes.length > 0) {
    console.log('🔍 Available public note IDs for testing:', safePublicNotes.map(n => `${n.title}: ${n.id}`));
  }
  
  const currentNotes = activeTab === 'private' ? filteredPrivateNotes : filteredPublicNotes;
  const safeCurrentNotes = currentNotes || [];

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
    console.log('🔍 ===== HOME SCREEN NOTE CLICK =====');
    console.log('🔍 noteId clicked:', noteId);
    console.log('🔍 noteId type:', typeof noteId);
    console.log('🔍 activeTab:', activeTab);
    console.log('🔍 currentNotes length:', safeCurrentNotes.length);
    console.log('🔍 currentNotes sample:', safeCurrentNotes.slice(0, 2).map(n => ({ id: n.id, title: n.title })));
    console.log('🔍 Note found in currentNotes?', safeCurrentNotes.find(n => n.id === noteId) ? 'YES' : 'NO');
    
    const foundNote = safeCurrentNotes.find(n => n.id === noteId);
    if (foundNote) {
      console.log('🔍 Found note details:', {
        id: foundNote.id,
        title: foundNote.title,
        hasContent: !!foundNote.content,
        contentLength: foundNote.content?.length || 0
      });
    }
    
    navigation.navigate('noteDetail', { 
      noteId, 
      note: foundNote, // 실제 노트 데이터도 함께 전달
      returnToTab: activeTab // Pass current tab state
    });
    console.log('🔍 ===== NAVIGATION CALLED =====');
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
    console.log('👁️ View mode menu pressed - opening dropdown');
    
    // Calculate dropdown position based on header button position
    // The more-horizontal button is typically at top-right of header
    const calculatedPosition = {
      top: 80, // Below the header (header height + status bar)
      right: 16, // Standard margin from right edge
    };
    
    setDropdownPosition(calculatedPosition);
    setViewModeModalVisible(true);
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
      if (safeCurrentNotes.length > 0) {
        const noteToPin = safeCurrentNotes[0];
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
      // const result = await AdminService.fixUserIdMismatch(); // Disabled for client safety
      console.log('🔧 Fix result:', result);
    };
    
    global.fixUserIdsProper = async () => {
      console.log('🔧 Starting PROPER User ID fix...');
      // const result = await AdminService.fixUserIdMismatchProper(); // Disabled for client safety
      console.log('🔧 PROPER Fix result:', result);
    };
    
    global.fixUserIdsNoConstraints = async () => {
      console.log('🔧 Starting NO-CONSTRAINTS User ID fix...');
      // const result = await AdminService.fixUserIdNoConstraints(); // Disabled for client safety
      console.log('🔧 NO-CONSTRAINTS Fix result:', result);
    };
    
    // Follow system test functions (disabled for client safety)
    global.testFollowSystem = async () => {
      console.log('👥 Follow system test disabled (admin services not available in client mode)');
    };
    
    global.checkFollowTable = async () => {
      console.log('👥 Table check disabled (admin services not available in client mode)');
    };
    
    global.createFollowsTable = async () => {
      console.log('🔧 Table creation disabled (admin services not available in client mode)');
    };
    
    return () => {
      delete global.cleanupDatabase;
      delete global.testPinFirst;
      delete global.testUnpinFirst;
      delete global.fixUserIds;
      delete global.fixUserIdsProper;
      delete global.fixUserIdsNoConstraints;
      delete global.testFollowSystem;
      delete global.checkFollowTable;
      delete global.createFollowsTable;
    };
  }, [safeCurrentNotes, safePinnedNotes, togglePinned]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.mainBackground} />
      
      <UnifiedHeader
        title=""
        leftElement="logo"
        onLeftPress={handleLogoPress}
        showBackButton={false}
        rightElements={[
          { name: 'bell', onPress: handleNotificationsPress },
          { name: 'more-horizontal', onPress: handleMenuPress }
        ]}
        screenType="main"
        transparent={true}
      />
      
          <View style={styles.contentWithPadding}>
            <ToggleButtons
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
            
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <PinnedNotesSection
                pinnedNotes={safePinnedNotes}
                onNotePress={handleNoteClick}
              />
              <NotesListComponent
                notes={safeCurrentNotes}
                onNoteClick={handleNoteClick}
                onDeleteNote={handleDeleteNote}
                isPublic={activeTab === 'public'}
                viewMode={currentViewMode}
              />
            </ScrollView>
          </View>
        
        {/* Floating Elements - Overlay */}
        <View style={styles.floatingElements}>
          <FloatingActionButton onPress={handleCreateNote} />
          <BottomNavigationComponent
            activeTab={activeNavTab}
            onTabChange={handleNavChange}
          />
        </View>

      {/* View Mode Dropdown Modal */}
      <ViewModeModal
        visible={viewModeModalVisible}
        onClose={() => setViewModeModalVisible(false)}
        position={dropdownPosition}
      />
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
    paddingHorizontal: 20, // NoteDetail 기준 20px 복원
    paddingTop: 24, // 탑헤더와 토글 사이 간격 추가
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
    paddingHorizontal: 20, // 모든 페이지 표준 좌우 마진 (20px)
    alignItems: 'center',
    pointerEvents: 'box-none', // Allow touches to pass through to scroll
  },
});

export default HomeScreenNew;