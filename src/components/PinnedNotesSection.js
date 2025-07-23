import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const PinnedNotesSection = ({ pinnedNotes, onNotePress }) => {
  console.log('📌 PinnedNotesSection received:', pinnedNotes?.length || 0, 'notes');
  console.log('📌 PinnedNotesSection data:', pinnedNotes);
  console.log('📌 PinnedNotesSection pinnedNotes type:', typeof pinnedNotes, 'Array.isArray:', Array.isArray(pinnedNotes));
  
  if (!pinnedNotes || !Array.isArray(pinnedNotes) || pinnedNotes.length === 0) {
    console.log('📌 PinnedNotesSection hiding - no pinned notes');
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Pinned notes</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {pinnedNotes.map((note) => {
          // Normalize note data - ensure isPublic is set correctly
          const normalizedNote = {
            ...note,
            isPublic: note.isPublic || note.is_public || false
          };
          
          console.log('📌 PinnedNotesSection - note.title:', normalizedNote.title, 'normalizedNote.isPublic:', normalizedNote.isPublic, 'will show icon:', normalizedNote.isPublic ? 'globe' : 'lock');
          
          return (
            <TouchableOpacity
              key={normalizedNote.id}
              style={styles.pinnedCard}
              onPress={() => onNotePress(normalizedNote.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {normalizedNote.title}
                </Text>
              </View>
              
              <View style={styles.cardFooter}>
                <View style={styles.statusIndicator}>
                  <Icon 
                    name={normalizedNote.isPublic ? "globe" : "lock"} 
                    size={12} 
                    color={Colors.secondaryText} 
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: Layout.spacing.lg,
  },
  header: {
    marginBottom: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.xs,
  },
  headerText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: -0.2,
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.xs,
  },
  pinnedCard: {
    backgroundColor: Colors.noteCard,
    borderRadius: 10,
    padding: Layout.spacing.md,
    marginRight: Layout.spacing.sm,
    width: 160,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  cardHeader: {
    marginBottom: Layout.spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textBlack,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'left',
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  statusIndicator: {
    // No margin needed since it's positioned at bottom left
  },
});

export default PinnedNotesSection;