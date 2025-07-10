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

const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenProps, setScreenProps] = useState({}); 

  const tabs = [
    { key: 'home', label: '', icon: 'home' },
    { key: 'explore', label: '', icon: 'search' },
    { key: 'profile', label: '', icon: 'user' },
  ];

  const navigate = (screen, props = {}) => {
    console.log('📍 TabNavigator navigate to:', screen, 'with props:', props);
    setCurrentScreen(screen);
    setScreenProps(props);
    if (['home', 'search', 'explore', 'profile'].includes(screen)) {
      setActiveTab(screen);
    }
  };

  const goBack = () => {
    // Check if we're going back from noteDetail or createNote and need to preserve tab state
    if (currentScreen === 'noteDetail' || currentScreen === 'createNote') {
      if (screenProps.returnToScreen) {
        // Going back to specific screen (like search)
        setCurrentScreen(screenProps.returnToScreen);
        setActiveTab(screenProps.returnToScreen);
        setScreenProps({});
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
    const navigationProps = { navigate, goBack };
    
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
        console.log('📄 Rendering NoteDetailScreen with screenProps:', screenProps);
        return <NoteDetailScreen key="note-detail" {...screenProps} onBack={goBack} navigation={navigationProps} />;
      case 'createNote':
        console.log('🎭 Rendering CreateNoteScreen with screenProps:', screenProps);
        return <CreateNoteScreen key="create-note" {...screenProps} onBack={goBack} navigation={navigationProps} />;
      case 'editReadme':
        console.log('📝 Rendering EditReadmeScreen with screenProps:', screenProps);
        return <EditReadmeScreen key="edit-readme" navigation={navigationProps} route={{ params: screenProps }} />;
      case 'myNotes':
        console.log('📄 Rendering MyNotesScreen');
        return <MyNotesScreen key="my-notes" navigation={navigationProps} />;
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