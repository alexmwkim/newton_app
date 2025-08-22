import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import HomeScreenNew from '../screens/HomeScreenNew';
import SearchScreen from '../screens/SearchScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import CreateNoteScreen from '../screens/CreateNoteScreen';
import EditReadmeScreen from '../screens/EditReadmeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MoreScreen from '../screens/MoreScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import NotesListScreen from '../screens/NotesListScreen';
import FollowListScreen from '../screens/FollowListScreen';

const TabNavigator = ({ logout }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenProps, setScreenProps] = useState({});
  
  // NAVIGATION STACK - Track navigation history for proper back navigation
  const [navigationStack, setNavigationStack] = useState([
    { screen: 'home', props: {} }
  ]);
  
  // TRACK STATE CHANGES
  React.useEffect(() => {
    console.log('🔄 TabNavigator state changed:', {
      currentScreen,
      navigationStackLength: navigationStack.length,
      navigationStackTop: navigationStack[navigationStack.length - 1],
      screenPropsKeys: Object.keys(screenProps || {}),
      screenPropsEmpty: !screenProps || Object.keys(screenProps).length === 0
    });
  }, [currentScreen, screenProps, navigationStack]); 

  const tabs = [
    { key: 'home', label: '', icon: 'home' },
    { key: 'search', label: '', icon: 'search' },
    { key: 'explore', label: '', icon: 'zap' },
    { key: 'profile', label: '', icon: 'user' },
  ];

  const navigate = (screen, params = {}) => {
    console.log('📍 TabNavigator navigate called!');
    console.log('📍 Screen:', screen);
    console.log('📍 Params:', JSON.stringify(params, null, 2));
    console.log('📍 Current navigation stack length:', navigationStack.length);
    
    // PRELOAD: Profile 화면으로 이동할 때 미리 캐시 준비
    if (screen === 'profile' && currentUser?.id) {
      try {
        console.log('⚡ PRELOAD: Preparing follow cache for profile transition');
        const followCacheStore = require('../store/FollowCacheStore').default;
        const FollowService = require('../services/followClient').default;
        
        // 현재 사용자 데이터가 캐시에 없으면 미리 로드
        if (!followCacheStore.getFromCache(currentUser.id)) {
          FollowService.getBatchFollowData(currentUser.id).then(result => {
            if (result.success) {
              followCacheStore.setCache(currentUser.id, {
                followersCount: result.followersCount,
                followingCount: result.followingCount,
                isFollowing: false // 자신이므로 false
              });
              console.log('⚡ PRELOAD: Profile cache prepared instantly');
            }
          }).catch(err => {
            console.log('⚡ PRELOAD: Background profile cache failed (non-critical)');
          });
        }
      } catch (error) {
        console.log('⚡ PRELOAD: Profile cache preparation failed (non-critical)');
      }
    }
    
    // STACK-BASED NAVIGATION: Add to stack instead of replacing
    React.startTransition(() => {
      // IMPORTANT: 현재 홈 화면의 상태를 유지하기 위해 스택 업데이트
      if (currentScreen === 'home' && params.returnToTab) {
        // 홈 화면에서 다른 화면으로 이동할 때, 현재 홈 화면의 상태를 스택에 저장
        setNavigationStack(prevStack => {
          const updatedStack = [...prevStack];
          // 마지막 홈 화면 항목을 현재 returnToTab 상태로 업데이트
          const lastIndex = updatedStack.length - 1;
          if (updatedStack[lastIndex] && updatedStack[lastIndex].screen === 'home') {
            updatedStack[lastIndex] = {
              ...updatedStack[lastIndex],
              props: { 
                ...updatedStack[lastIndex].props,
                returnToTab: params.returnToTab 
              }
            };
          }
          // 새 화면을 스택에 추가
          return [...updatedStack, { screen, props: params }];
        });
      } else {
        // 일반적인 네비게이션: 새 화면을 스택에 추가
        setNavigationStack(prevStack => [
          ...prevStack,
          { screen, props: params }
        ]);
      }
      
      setCurrentScreen(screen);
      setScreenProps(params);
      
      if (['home', 'search', 'explore', 'profile'].includes(screen)) {
        setActiveTab(screen);
      }
    });
    
    console.log('📍 Navigate function completed, added to stack');
  };

  const goBack = () => {
    console.log('🔙 GOBACK CALLED!');
    console.log('🔙 Current navigation stack length:', navigationStack.length);
    console.log('🔙 Current screen:', currentScreen);
    
    // STACK-BASED GO BACK: Pop from stack and go to previous screen
    if (navigationStack.length <= 1) {
      console.log('🔙 At root of stack, staying on current screen');
      return;
    }
    
    React.startTransition(() => {
      // Remove current screen from stack
      const newStack = navigationStack.slice(0, -1);
      const previousNavigation = newStack[newStack.length - 1];
      
      console.log('🔙 Going back to:', previousNavigation.screen);
      console.log('🔙 New stack length:', newStack.length);
      
      setNavigationStack(newStack);
      setCurrentScreen(previousNavigation.screen);
      setScreenProps(previousNavigation.props);
      
      // Update active tab if going back to main tab
      if (['home', 'search', 'explore', 'profile'].includes(previousNavigation.screen)) {
        setActiveTab(previousNavigation.screen);
      }
    });
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
      isFocused: () => true,
      addListener: (eventName, callback) => {
        // Mock implementation for focus events
        if (eventName === 'focus') {
          // Call immediately since we don't have real navigation focus events
          callback();
        }
        // Return unsubscribe function
        return () => {};
      }
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
      case 'settings':
        console.log('⚙️ Rendering SettingsScreen');
        return <SettingsScreen key="settings" navigation={navigationProps} />;
      case 'more':
        console.log('📋 Rendering MoreScreen');
        return <MoreScreen key="more" navigation={navigationProps} />;
      case 'notifications':
        console.log('🔔 Rendering NotificationsScreen');
        return <NotificationsScreen key="notifications" navigation={navigationProps} />;
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
      case 'FollowList':
        console.log('👥 Rendering FollowListScreen with props:', screenProps);
        return <FollowListScreen key="follow-list" navigation={navigationProps} route={{ params: screenProps }} />;
      default:
        return <HomeScreenNew key="home-screen-default" navigation={navigationProps} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Bottom Tab Bar - Hidden since new design has its own navigation */}
    </SafeAreaView>
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