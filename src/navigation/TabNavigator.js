import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import CreateNoteScreen from '../screens/CreateNoteScreen';

const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenProps, setScreenProps] = useState({}); 

  const tabs = [
    { key: 'home', label: '', icon: 'home' },
    { key: 'search', label: '', icon: 'search' },
    { key: 'explore', label: '', icon: 'compass' },
    { key: 'profile', label: '', icon: 'user' },
  ];

  const navigate = (screen, props = {}) => {
    setCurrentScreen(screen);
    setScreenProps(props);
    if (['home', 'search', 'explore', 'profile'].includes(screen)) {
      setActiveTab(screen);
    }
  };

  const goBack = () => {
    setCurrentScreen(activeTab);
    setScreenProps({});
  };

  const renderScreen = () => {
    const navigationProps = { navigate, goBack };
    
    switch (currentScreen) {
      case 'home':
        return <HomeScreen navigation={navigationProps} />;
      case 'search':
        return <ExploreScreen navigation={navigationProps} />;
      case 'explore':
        return <ExploreScreen navigation={navigationProps} />;
      case 'profile':
        return <ProfileScreen navigation={navigationProps} />;
      case 'noteDetail':
        return <NoteDetailScreen {...screenProps} onBack={goBack} navigation={navigationProps} />;
      case 'createNote':
        return <CreateNoteScreen {...screenProps} onBack={goBack} navigation={navigationProps} />;
      default:
        return <HomeScreen navigation={navigationProps} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Screen Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Bottom Tab Bar - Only show on main screens */}
      {['home', 'search', 'explore', 'profile'].includes(currentScreen) && (
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => navigate(tab.key)}
            >
              <Icon
                name={tab.icon}
                size={24}
                color={activeTab === tab.key ? Colors.iconActive : Colors.iconInactive}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
    color: Colors.iconInactive,
  },
  activeTabLabel: {
    color: Colors.iconActive,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default TabNavigator;