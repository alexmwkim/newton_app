import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import NoteCard from '../components/NoteCard';

// Mock data for explore screen
const mockTrendingNotes = [
  {
    id: 1,
    title: 'Building a Mobile-First Design System',
    content: 'Complete guide to creating design systems that work across platforms...',
    createdAt: '2 hours ago',
    author: '@uxmaster',
    isPublic: true,
    forkCount: 45,
  },
  {
    id: 2,
    title: 'JavaScript Performance Tips',
    content: 'Essential techniques to optimize your JavaScript code for better performance...',
    createdAt: '4 hours ago',
    author: '@jsdev',
    isPublic: true,
    forkCount: 23,
  },
  {
    id: 3,
    title: 'Remote Work Best Practices',
    content: 'Lessons learned from 3 years of remote work and team management...',
    createdAt: '6 hours ago',
    author: '@remote_leader',
    isPublic: true,
    forkCount: 67,
  },
];

const mockRecentNotes = [
  {
    id: 4,
    title: 'Getting Started with React Native',
    content: 'A beginner-friendly guide to React Native development...',
    createdAt: '1 hour ago',
    author: '@rn_beginner',
    isPublic: true,
    forkCount: 5,
  },
  {
    id: 5,
    title: 'CSS Grid Layout Patterns',
    content: 'Common layout patterns using CSS Grid with examples...',
    createdAt: '3 hours ago',
    author: '@css_expert',
    isPublic: true,
    forkCount: 12,
  },
];

const ExploreScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleNotePress = (note) => {
    console.log('Note pressed:', note.title);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={Colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Trending Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Trending</Text>
            {mockTrendingNotes.map((note) => (
              <NoteCard
                key={note.id}
                title={note.title}
                content={note.content}
                createdAt={note.createdAt}
                author={note.author}
                isPublic={note.isPublic}
                forkCount={note.forkCount}
                onPress={() => handleNotePress(note)}
              />
            ))}
          </View>

          {/* Recent Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕒 Recent</Text>
            {mockRecentNotes.map((note) => (
              <NoteCard
                key={note.id}
                title={note.title}
                content={note.content}
                createdAt={note.createdAt}
                author={note.author}
                isPublic={note.isPublic}
                forkCount={note.forkCount}
                onPress={() => handleNotePress(note)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    color: Colors.primaryText,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screen.padding,
  },
  searchContainer: {
    marginVertical: Layout.spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.noteCard,
    borderRadius: Layout.borderRadius,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.heading,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.md,
  },
});

export default ExploreScreen;