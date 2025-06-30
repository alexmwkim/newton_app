import React from 'react';
import { View, StyleSheet } from 'react-native';
import NoteItemComponent from './NoteItemComponent';
import AuthorPublicNoteCard from './AuthorPublicNoteCard';

const NotesListComponent = ({ 
  notes = [
    { id: "1", title: "My journal", timeAgo: "5 hrs ago" },
    { id: "2", title: "Idea notes", timeAgo: "05/08/25" },
    { id: "3", title: "Oio project", timeAgo: "10/04/24" },
    { id: "4", title: "Workout session", timeAgo: "09/12/24" },
  ], 
  onNoteClick,
  isPublic = false
}) => {
  return (
    <View style={styles.container}>
      {notes.map((note) => (
        isPublic ? (
          <AuthorPublicNoteCard
            key={note.id}
            title={note.title}
            timeAgo={note.timeAgo}
            username={note.username}
            avatarUrl={note.avatarUrl}
            forksCount={note.forksCount}
            onPress={() => onNoteClick?.(note.id)}
          />
        ) : (
          <NoteItemComponent
            key={note.id}
            title={note.title}
            timeAgo={note.timeAgo}
            onPress={() => onNoteClick?.(note.id)}
          />
        )
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    width: '100%',
  },
});

export default NotesListComponent;