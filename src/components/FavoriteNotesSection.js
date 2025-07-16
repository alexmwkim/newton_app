import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const FavoriteNotesSection = ({ favoriteNotes, onNotePress }) => {
  if (favoriteNotes.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Favorite notes</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {favoriteNotes.map((note) => (
          <TouchableOpacity
            key={note.id}
            style={styles.favoriteCard}
            onPress={() => onNotePress(note.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {note.title}
              </Text>
            </View>
            
            <View style={styles.cardFooter}>
              <View style={styles.statusIndicator}>
                <Icon 
                  name={note.isPublic ? "globe" : "lock"} 
                  size={12} 
                  color={Colors.secondaryText} 
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  favoriteCard: {
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

export default FavoriteNotesSection;