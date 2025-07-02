import React from 'react';
import { View, StyleSheet } from 'react-native';
import SwipeableNoteItem from './SwipeableNoteItem';
import AuthorPublicNoteCard from './AuthorPublicNoteCard';

const NotesListComponent = ({ 
  notes = [
    { id: "1", title: "My journal", timeAgo: "5 hrs ago" },
    { id: "2", title: "Idea notes", timeAgo: "05/08/25" },
    { id: "3", title: "Oio project", timeAgo: "10/04/24" },
    { id: "4", title: "Workout session", timeAgo: "09/12/24" },
  ], 
  onNoteClick,
  onDeleteNote,
  isPublic = false
}) => {
  return (
    <View style={styles.container}>
      {notes.map((note) => (
        isPublic ? (
          <SwipeableNoteItem
            key={note.id}
            note={note}
            onPress={() => onNoteClick?.(note.id)}
            onDelete={onDeleteNote}
            isPublic={true}
          />
        ) : (
          <SwipeableNoteItem
            key={note.id}
            note={note}
            onPress={() => onNoteClick?.(note.id)}
            onDelete={onDeleteNote}
            isPublic={false}
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