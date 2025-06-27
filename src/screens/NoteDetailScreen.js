import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const NoteDetailScreen = ({ note, onBack, onEdit, onFork, navigation }) => {
  const handleBack = () => {
    if (onBack) onBack();
  };

  const handleEdit = () => {
    navigation.navigate('createNote', { initialNote: note });
  };

  const handleFork = () => {
    const forkedNote = {
      ...note,
      title: `Fork of ${note.title}`,
      isPublic: false,
    };
    navigation.navigate('createNote', { initialNote: forkedNote });
  };

  // Mock note data if none provided
  const displayNote = note || {
    id: 1,
    title: 'Sample Note Title',
    content: `# This is a sample note

This note demonstrates how the note detail view works in the Newton app.

## Features
- Clean, readable typography
- Markdown-like formatting
- Easy navigation back to the list
- Fork functionality for public notes

## Lorem Ipsum
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.

### Sub-section
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
    createdAt: '2 hours ago',
    updatedAt: '1 hour ago',
    author: '@sampleuser',
    isPublic: true,
    forkCount: 12,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {displayNote.isPublic && (
            <TouchableOpacity onPress={handleFork} style={styles.actionButton}>
              <Text style={styles.actionIcon}>🍴</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Note Title */}
        <Text style={styles.title}>{displayNote.title}</Text>
        
        {/* Note Meta */}
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            Created {displayNote.createdAt}
          </Text>
          {displayNote.updatedAt && displayNote.updatedAt !== displayNote.createdAt && (
            <Text style={styles.metaText}>
              • Updated {displayNote.updatedAt}
            </Text>
          )}
        </View>

        {displayNote.isPublic && (
          <View style={styles.publicInfo}>
            <Text style={styles.author}>by {displayNote.author}</Text>
            <Text style={styles.forkCount}>🍴 {displayNote.forkCount} forks</Text>
          </View>
        )}

        {/* Note Content */}
        <View style={styles.noteContent}>
          <Text style={styles.contentText}>{displayNote.content}</Text>
        </View>
      </ScrollView>
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
  backButton: {
    padding: Layout.spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.primaryText,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    padding: Layout.spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    lineHeight: 36,
    marginBottom: Layout.spacing.md,
  },
  meta: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.sm,
  },
  metaText: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
  },
  publicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  author: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  forkCount: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
  },
  noteContent: {
    marginTop: Layout.spacing.md,
  },
  contentText: {
    fontSize: Typography.fontSize.body,
    color: Colors.primaryText,
    lineHeight: 24,
  },
});

export default NoteDetailScreen;