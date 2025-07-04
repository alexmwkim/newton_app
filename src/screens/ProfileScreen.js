import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import NoteItemComponent from '../components/NoteItemComponent';
import BottomNavigationComponent from '../components/BottomNavigationComponent';

// Mock user data
const mockUser = {
  id: 1,
  username: '@yourname',
  bio: 'Passionate about technology, design, and sharing knowledge. Building great things one note at a time.',
  publicNotesCount: 12,
  forksReceived: 89,
  following: 45,
  followers: 127,
};

const mockUserNotes = [
  {
    id: 1,
    title: 'My Design Philosophy',
    content: 'What I learned about creating user-centered designs over the past few years...',
    createdAt: '2 days ago',
    author: '@yourname',
    isPublic: true,
    forkCount: 15,
  },
  {
    id: 2,
    title: 'React Hooks Guide',
    content: 'A comprehensive guide to using React hooks effectively in your projects...',
    createdAt: '1 week ago',
    author: '@yourname',
    isPublic: true,
    forkCount: 28,
  },
  {
    id: 3,
    title: 'Building Better Teams',
    content: 'Thoughts on fostering collaboration and communication in remote teams...',
    createdAt: '2 weeks ago',
    author: '@yourname',
    isPublic: true,
    forkCount: 42,
  },
];

const ProfileScreen = ({ navigation }) => {
  const [activeNavTab, setActiveNavTab] = useState(3); // Profile is index 3

  const handleNotePress = (note) => {
    console.log('Note pressed:', note.title);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Info */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>YN</Text>
                </View>
              </View>
              
              <Text style={styles.username}>{mockUser.username}</Text>
              <Text style={styles.bio}>{mockUser.bio}</Text>
              
              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{mockUser.publicNotesCount}</Text>
                  <Text style={styles.statLabel}>Public Notes</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{mockUser.forksReceived}</Text>
                  <Text style={styles.statLabel}>Forks Received</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{mockUser.followers}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{mockUser.following}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
            </View>

            {/* Public Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Public Notes</Text>
              {mockUserNotes.map((note) => (
                <NoteItemComponent
                  key={note.id}
                  title={note.title}
                  timeAgo={note.createdAt}
                  onPress={() => handleNotePress(note)}
                />
              ))}
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
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for floating navigation
  },
  profileSection: {
    padding: Layout.screen.padding,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: Layout.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.noteCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.heading,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  username: {
    fontSize: Typography.fontSize.heading,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.sm,
  },
  bio: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Layout.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.fontSize.title,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  statLabel: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: Layout.spacing.xs,
  },
  notesSection: {
    padding: Layout.screen.padding,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.heading,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.md,
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