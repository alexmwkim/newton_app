import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import NotesListComponent from '../components/NotesListComponent';
import { useNotesStore } from '../store/NotesStore';

const MyNotesScreen = ({ navigation }) => {
  const { publicNotes, deleteNote } = useNotesStore();
  
  // Filter notes by current user (in a real app, this would filter by actual user ID)
  const myPublicNotes = publicNotes.filter(note => note.username === 'alexnwkim');

  const handleNoteClick = (noteId) => {
    navigation.navigate('noteDetail', { 
      noteId, 
      returnToScreen: 'myNotes'
    });
  };

  const handleDeleteNote = (noteId) => {
    deleteNote(noteId, true); // true for public notes
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Icon name="chevron-left" size={24} color={Colors.primaryText} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My notes</Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <NotesListComponent
              notes={myPublicNotes}
              onNoteClick={handleNoteClick}
              onDeleteNote={handleDeleteNote}
              isPublic={true}
            />
          </ScrollView>
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
  backButton: {
    padding: Layout.spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 40, // Same width as back button for centering
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Layout.screen.padding,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.xl,
  },
});

export default MyNotesScreen;