import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

// Import screens
import HomeScreenNew from '../screens/HomeScreenNew';
import SearchScreen from '../screens/SearchScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import CreateNoteScreen from '../screens/CreateNoteScreen';
import EditReadmeScreen from '../screens/EditReadmeScreen';
import MyNotesScreen from '../screens/MyNotesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MoreScreen from '../screens/MoreScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import StarredNotesScreen from '../screens/StarredNotesScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import NotesListScreen from '../screens/NotesListScreen';

const TabNavigator = ({ logout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenProps, setScreenProps] = useState({});
  
  // TRACK STATE CHANGES
  React.useEffect(() => {
    console.log('🔄 TabNavigator state changed:', {
      currentScreen,
      screenPropsKeys: Object.keys(screenProps || {}),
      screenPropsEmpty: !screenProps || Object.keys(screenProps).length === 0
    });
  }, [currentScreen, screenProps]); 

  const tabs = [
    { key: 'home', label: '', icon: 'home' },
    { key: 'explore', label: '', icon: 'search' },
    { key: 'profile', label: '', icon: 'user' },
  ];

  const navigate = (screen, params = {}) => {
    console.log('📍 TabNavigator navigate called!');
    console.log('📍 Screen:', screen);
    console.log('📍 Params:', JSON.stringify(params, null, 2));
    console.log('📍 Params type:', typeof params);
    console.log('📍 Params keys:', Object.keys(params || {}));
    console.log('📍 Current screenProps before update:', screenProps);
    
    // CRITICAL FIX: Use functional state update to ensure we get the latest state
    // and batch updates together
    React.startTransition(() => {
      setCurrentScreen(screen);
      setScreenProps(params);
      
      if (['home', 'search', 'explore', 'profile'].includes(screen)) {
        setActiveTab(screen);
      }
    });
    
    console.log('📍 Navigate function completed, state updates queued');
  };

  const goBack = () => {
    console.log('🔙 GOBACK CALLED!');
    console.log('🔙 Current screen:', currentScreen);
    console.log('🔙 Current screenProps:', screenProps);
    console.log('🔙 screenProps keys:', Object.keys(screenProps || {}));
    
    // Add stack trace to see what called goBack
    console.log('🔙 Stack trace:');
    console.trace();
    
    // Check if we're going back from noteDetail or createNote and need to preserve tab state
    if (currentScreen === 'noteDetail' || currentScreen === 'createNote') {
      if (screenProps.returnToScreen) {
        // Going back to specific screen (like search, notesList, userProfile, etc.)
        if (screenProps.returnToScreen === 'notesList') {
          // Keep notesList screenProps when going back from noteDetail
          setCurrentScreen('notesList');
          // Preserve the original notesList params but remove noteDetail specific ones
          const { noteId, returnToScreen, ...notesListProps } = screenProps;
          setScreenProps(notesListProps);
        } else {
          setCurrentScreen(screenProps.returnToScreen);
          if (['home', 'search', 'explore', 'profile'].includes(screenProps.returnToScreen)) {
            setActiveTab(screenProps.returnToScreen);
            // For main tab screens, clear screenProps
            setScreenProps({});
          } else if (screenProps.returnToScreen === 'userProfile') {
            // CRITICAL FIX: When returning to userProfile, preserve original profile data
            console.log('🔙 Returning to userProfile, preserving profile data');
            const { noteId, returnToScreen, ...originalUserProfileProps } = screenProps;
            console.log('🔙 Preserved userProfile props:', originalUserProfileProps);
            setScreenProps(originalUserProfileProps);
          } else {
            // For other screens, clear screenProps
            setScreenProps({});
          }
        }
      } else if (screenProps.returnToTab) {
        // Going back to home with specific tab state
        setCurrentScreen('home');
        setActiveTab('home');
        setScreenProps({ returnToTab: screenProps.returnToTab });
      } else {
        // Regular back to home
        setCurrentScreen('home');
        setActiveTab('home');
        setScreenProps({});
      }
    } else if (currentScreen === 'notesList') {
      // Special handling for notesList - use originScreen to determine where to go back
      console.log('🔙 Going back from notesList, originScreen:', screenProps.originScreen);
      
      if (screenProps.originScreen === 'profile') {
        // Going back to main ProfileScreen
        setCurrentScreen('profile');
        setActiveTab('profile');
        setScreenProps({});
      } else if (screenProps.originScreen === 'userProfile') {
        // Going back to UserProfileScreen  
        setCurrentScreen('userProfile');
        // Preserve the userProfile params but remove notesList specific ones
        const { listType, title, originScreen, ...userProfileProps } = screenProps;
        setScreenProps(userProfileProps);
        // Keep current activeTab (usually 'explore' when viewing other users)
      } else {
        // Fallback: determine by isCurrentUser
        if (screenProps.isCurrentUser) {
          setCurrentScreen('profile');
          setActiveTab('profile');
          setScreenProps({});
        } else {
          setCurrentScreen('userProfile');
          const { listType, title, originScreen, ...userProfileProps } = screenProps;
          setScreenProps(userProfileProps);
        }
      }
    } else if (['home', 'search', 'explore', 'profile'].includes(activeTab)) {
      setCurrentScreen(activeTab);
      setScreenProps({});
    } else {
      // If activeTab is not a main screen, default to home
      setCurrentScreen('home');
      setActiveTab('home');
      setScreenProps({});
    }
  };

  const renderScreen = () => {
    // Enhanced navigation props to mimic React Navigation API
    const navigationProps = { 
      navigate, 
      goBack, 
      logout,
      // Add missing methods to prevent errors
      getState: () => {
        return {
          type: 'tab',
          index: tabs.findIndex(tab => tab.key === activeTab),
          routeNames: ['home', 'search', 'explore', 'profile'],
          routes: [
            { key: 'home', name: 'home', params: {} },
            { key: 'search', name: 'search', params: {} },
            { key: 'explore', name: 'explore', params: {} },
            { key: 'profile', name: 'profile', params: {} },
            { key: 'userProfile', name: 'userProfile', params: screenProps }
          ],
          stale: false
        };
      },
      // Add other common navigation methods
      setParams: (params) => {
        setScreenProps({ ...screenProps, ...params });
      },
      isFocused: () => true
    };
    
    switch (currentScreen) {
      case 'home':
        return <HomeScreenNew key="home-screen" navigation={navigationProps} initialTab={screenProps.returnToTab} />;
      case 'search':
        return <SearchScreen key="search-screen" navigation={navigationProps} />;
      case 'explore':
        return <ExploreScreen key="explore-screen" navigation={navigationProps} />;
      case 'profile':
        return <ProfileScreen key="profile-screen" navigation={navigationProps} />;
      case 'noteDetail':
        console.log('🔍 DEBUG - screenProps:', JSON.stringify(screenProps, null, 2));
        console.log('🔍 DEBUG - screenProps.noteId:', screenProps?.noteId);
        console.log('🔍 DEBUG - typeof screenProps:', typeof screenProps);
        console.log('🔍 DEBUG - screenProps is null?', screenProps === null);
        console.log('🔍 DEBUG - screenProps is undefined?', screenProps === undefined);
        
        return <NoteDetailScreen 
          key="note-detail" 
          noteId={screenProps?.noteId || 'MISSING_NOTE_ID'}
          note={screenProps?.note || null}
          isStarredNote={screenProps?.isStarredNote || false}
          returnToScreen={screenProps?.returnToScreen}
          returnToTab={screenProps?.returnToTab}
          onStarredRemove={screenProps?.onStarredRemove}
          onBack={goBack} 
          navigation={navigationProps}
          route={{ params: screenProps }}
        />;
      case 'createNote':
        console.log('🎭 Rendering CreateNoteScreen with screenProps:', screenProps);
        return <CreateNoteScreen key="create-note" {...screenProps} onBack={goBack} navigation={navigationProps} />;
      case 'editReadme':
        console.log('📝 Rendering EditReadmeScreen with screenProps:', screenProps);
        return <EditReadmeScreen key="edit-readme" navigation={navigationProps} route={{ params: screenProps }} />;
      case 'myNotes':
        console.log('📄 Rendering MyNotesScreen');
        return <MyNotesScreen key="my-notes" navigation={navigationProps} />;
      case 'settings':
        console.log('⚙️ Rendering SettingsScreen');
        return <SettingsScreen key="settings" navigation={navigationProps} />;
      case 'more':
        console.log('📋 Rendering MoreScreen');
        return <MoreScreen key="more" navigation={navigationProps} />;
      case 'notifications':
        console.log('🔔 Rendering NotificationsScreen');
        return <NotificationsScreen key="notifications" navigation={navigationProps} />;
      case 'starredNotes':
        console.log('⭐ Rendering StarredNotesScreen');
        return <StarredNotesScreen key="starred-notes" navigation={navigationProps} />;
      case 'userProfile':
        console.log('👤 Rendering UserProfileScreen with screenProps:', screenProps);
        console.log('👤 screenProps keys:', Object.keys(screenProps || {}));
        console.log('👤 screenProps is empty?', !screenProps || Object.keys(screenProps).length === 0);
        
        // CRITICAL: If screenProps is empty but we're navigating to userProfile,
        // there might be a state update timing issue
        if (!screenProps || Object.keys(screenProps).length === 0) {
          console.error('⚠️ WARNING: userProfile rendered with empty screenProps!');
          console.error('⚠️ This suggests a React state update timing issue');
        }
        
        // Enhanced route object to mimic React Navigation
        const userProfileRoute = {
          key: 'userProfile-' + Date.now(),
          name: 'userProfile',
          params: screenProps || {},
          path: undefined
        };
        
        console.log('👤 Final route object:', userProfileRoute);
        
        return <UserProfileScreen key="user-profile" navigation={navigationProps} route={userProfileRoute} />;
      case 'notesList':
        console.log('📄 Rendering NotesListScreen with props:', screenProps);
        return <NotesListScreen key="notes-list" navigation={navigationProps} route={{ params: screenProps }} />;
      default:
        return <HomeScreenNew key="home-screen-default" navigation={navigationProps} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Bottom Tab Bar - Hidden since new design has its own navigation */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 20, // For iPhone safe area
    paddingTop: Layout.spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: Layout.spacing.xs,
    color: Colors.iconInactive,
  },
  activeTabIcon: {
    color: Colors.iconActive,
  },
  tabLabel: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.iconInactive,
  },
  activeTabLabel: {
    color: Colors.iconActive,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
  },
});

export default TabNavigator;