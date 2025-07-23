import React from 'react';
import { View, StyleSheet } from 'react-native';
import SwipeableNoteItem from './SwipeableNoteItem';
import AuthorPublicNoteCard from './AuthorPublicNoteCard';
import { useViewMode } from '../store/ViewModeStore';

const NotesListComponent = ({ 
  notes = [
    { id: "1", title: "My journal", timeAgo: "5 hrs ago" },
    { id: "2", title: "Idea notes", timeAgo: "05/08/25" },
    { id: "3", title: "Oio project", timeAgo: "10/04/24" },
    { id: "4", title: "Workout session", timeAgo: "09/12/24" },
  ], 
  onNoteClick,
  onDeleteNote,
  isPublic = false,
  viewMode
}) => {
  const { viewModes } = useViewMode();
  const effectiveViewMode = viewMode || viewModes.TITLE_ONLY;
  
  console.log('📝 NotesListComponent: Effective view mode:', effectiveViewMode);
  return (
    <View style={[
      styles.container,
      effectiveViewMode === viewModes.CONTENT_PREVIEW && styles.containerContentPreview
    ]}>
      {notes.map((note) => (
        isPublic ? (
          <SwipeableNoteItem
            key={note.id}
            note={note}
            onPress={() => onNoteClick?.(note.id)}
            onDelete={onDeleteNote}
            isPublic={true}
            viewMode={effectiveViewMode}
          />
        ) : (
          <SwipeableNoteItem
            key={note.id}
            note={note}
            onPress={() => onNoteClick?.(note.id)}
            onDelete={onDeleteNote}
            isPublic={false}
            viewMode={effectiveViewMode}
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
  containerContentPreview: {
    marginTop: 16, // Slightly less margin for content preview cards
  },
});

export default NotesListComponent;