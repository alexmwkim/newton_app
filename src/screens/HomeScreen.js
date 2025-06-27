import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import NoteCard from '../components/NoteCard';
import ToggleButton from '../components/ToggleButton';
import FloatingActionButton from '../components/FloatingActionButton';

// Mock data for demonstration
const mockPrivateNotes = [
  {
    id: 1,
    title: 'My Daily Thoughts',
    content: 'Today I learned about React Native navigation and it was really interesting...',
    createdAt: '2 hours ago',
    isPublic: false,
  },
  {
    id: 2,
    title: 'Project Ideas',
    content: 'Some ideas for my next project: 1. Mobile app for note-taking 2. Web dashboard...',
    createdAt: '1 day ago',
    isPublic: false,
  },
  {
    id: 3,
    title: 'Book Notes',
    content: 'Key insights from "The Design of Everyday Things" by Don Norman...',
    createdAt: '3 days ago',
    isPublic: false,
  },
];

const mockPublicNotes = [
  {
    id: 4,
    title: 'React Native Best Practices',
    content: 'Here are some best practices I learned while building mobile apps...',
    createdAt: '5 hours ago',
    author: '@developer123',
    isPublic: true,
    forkCount: 12,
  },
  {
    id: 5,
    title: 'Design System Guide',
    content: 'A comprehensive guide to building consistent design systems...',
    createdAt: '1 day ago',
    author: '@designer_pro',
    isPublic: true,
    forkCount: 8,
  },
];

const HomeScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('private');

  const toggleOptions = [
    { icon: 'lock', label: 'Private', value: 'private' },
    { icon: 'globe', label: 'Public', value: 'public' },
  ];

  const currentNotes = selectedTab === 'private' ? mockPrivateNotes : mockPublicNotes;

  const handleNotePress = (note) => {
    navigation.navigate('noteDetail', { note });
  };

  const handleCreateNote = () => {
    navigation.navigate('createNote');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Newton</Text>
        <View style={styles.headerIcons}>
          <Icon name="bell" size={24} color={Colors.primaryText} />
          <Icon name="settings" size={24} color={Colors.primaryText} />
        </View>
      </View>

      <View style={styles.content}>
        <ToggleButton
          options={toggleOptions}
          selectedOption={selectedTab}
          onToggle={setSelectedTab}
        />

        <ScrollView
          style={styles.notesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notesContainer}
        >
          {currentNotes.map((note) => (
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
        </ScrollView>
      </View>

      <FloatingActionButton onPress={handleCreateNote} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screen.padding,
  },
  notesList: {
    flex: 1,
  },
  notesContainer: {
    paddingBottom: 120, // Space for FAB and tab bar
  },
});

export default HomeScreen;