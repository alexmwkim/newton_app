import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import BottomNavigationComponent from '../components/BottomNavigationComponent';

// Mock user data matching the design
const mockUser = {
  id: 1,
  username: 'Userid',
  readmeTitle: 'Hello world!',
  readmeContent: 'StaLorem ipsum dolor sit amet, ure adipiscing ewf asf wefwf tjrrete etegy votkroa rkfserer..',
  myNotesCount: 12,
  collectedNotesCount: 4,
};

const mockHighlightNotes = [
  {
    id: 1,
    title: 'project abcd',
    forkCount: 5,
    username: 'userid',
  },
  {
    id: 2,
    title: 'my journal',
    forkCount: 5,
    username: 'userid',
  },
];

const ProfileScreen = ({ navigation }) => {
  const [activeNavTab, setActiveNavTab] = useState(3); // Profile is index 3
  const [readmeData, setReadmeData] = useState({
    title: mockUser.readmeTitle,
    content: mockUser.readmeContent,
  });

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
    
    return () => clearInterval(interval);
  }, []);

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
  };

  const handleCollectedNotesPress = () => {
    console.log('Collected notes pressed');
  };

  const handleNotePress = (note) => {
    console.log('Note pressed:', note.title);
  };

  const handleEditReadme = () => {
    console.log('📝 Opening edit readme with current data:', readmeData);
    
    navigation.navigate('editReadme', {
      currentTitle: readmeData.title,
      currentContent: readmeData.content,
    });
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
              <TouchableOpacity style={styles.headerButton}>
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
              <View style={styles.avatar}>
                <Icon name="user" size={24} color={Colors.secondaryText} />
              </View>
              <Text style={styles.username}>{mockUser.username}</Text>
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
                <Text style={styles.readmeText}>{readmeData.content}</Text>
              </View>
            </View>

            {/* My Notes Section */}
            <TouchableOpacity style={styles.menuItem} onPress={handleMyNotesPress}>
              <Text style={styles.menuItemText}>My notes</Text>
              <View style={styles.menuItemRight}>
                <Text style={styles.menuItemCount}>{mockUser.myNotesCount}</Text>
                <Icon name="chevron-right" size={20} color={Colors.secondaryText} />
              </View>
            </TouchableOpacity>

            {/* Collected Notes Section */}
            <TouchableOpacity style={styles.menuItem} onPress={handleCollectedNotesPress}>
              <Text style={styles.menuItemText}>Collected notes</Text>
              <View style={styles.menuItemRight}>
                <Text style={styles.menuItemCount}>{mockUser.collectedNotesCount}</Text>
                <Icon name="chevron-right" size={20} color={Colors.secondaryText} />
              </View>
            </TouchableOpacity>

            {/* Highlight Section */}
            <View style={styles.highlightSection}>
              <Text style={styles.highlightTitle}>Highlight</Text>
              <View style={styles.highlightGrid}>
                {mockHighlightNotes.map((note) => (
                  <TouchableOpacity
                    key={note.id}
                    style={styles.highlightCard}
                    onPress={() => handleNotePress(note)}
                  >
                    <View style={styles.highlightCardHeader}>
                      <View style={styles.highlightAvatar}>
                        <Icon name="user" size={16} color={Colors.secondaryText} />
                      </View>
                      <Text style={styles.highlightUsername}>{note.username}</Text>
                    </View>
                    <Text style={styles.highlightNoteTitle}>{note.title}</Text>
                    <Text style={styles.highlightForkCount}>{note.forkCount} Forks</Text>
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
    gap: Layout.spacing.md,
  },
  headerButton: {
    padding: Layout.spacing.xs,
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.noteCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  readmeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    marginBottom: Layout.spacing.md,
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
  floatingElements: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
});

export default ProfileScreen;