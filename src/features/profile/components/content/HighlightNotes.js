import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';
import { Spacing } from '../../../../constants/StyleControl';

/**
 * 개별 하이라이트 노트 카드
 */
const HighlightNoteCard = ({ note, onPress, onStarPress, isStarred }) => (
  <TouchableOpacity 
    style={styles.noteCard}
    onPress={() => onPress(note)}
    activeOpacity={0.7}
  >
    <View style={styles.noteHeader}>
      <Text style={styles.noteTitle} numberOfLines={2}>
        {note.title}
      </Text>
      
      <TouchableOpacity
        style={styles.starButton}
        onPress={() => onStarPress(note.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon 
          name={isStarred ? "star" : "star"} 
          size={16} 
          color={isStarred ? Colors.warning : Colors.text.secondary}
          style={isStarred && styles.starFilled}
        />
      </TouchableOpacity>
    </View>
    
    <View style={styles.noteStats}>
      <View style={styles.statChip}>
        <Icon name="star" size={12} color={Colors.text.secondary} />
        <Text style={styles.statText}>{note.starCount || 0}</Text>
      </View>
      
      <View style={styles.statChip}>
        <Icon name="git-branch" size={12} color={Colors.text.secondary} />
        <Text style={styles.statText}>{note.forkCount || 0}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

/**
 * 하이라이트 노트 섹션
 */
const HighlightNotes = ({
  notes = [],
  loading = false,
  onNotePress,
  onStarPress,
  onViewAllPress,
  isNoteStarred,
  showViewAll = true,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Highlight Notes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Highlight Notes</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="file-text" size={32} color={Colors.text.secondary} />
          <Text style={styles.emptyText}>No public notes yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first public note to showcase your work
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Highlight Notes</Text>
        
        {showViewAll && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={onViewAllPress}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="chevron-right" size={14} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.notesGrid}>
        {notes.map((note) => (
          <HighlightNoteCard
            key={note.id}
            note={note}
            onPress={onNotePress}
            onStarPress={onStarPress}
            isStarred={isNoteStarred ? isNoteStarred(note.id) : false}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingVertical: Layout.spacing.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xsmall,
  },
  viewAllText: {
    ...Typography.caption,
    color: Colors.primary,
    marginRight: 4,
    fontWeight: '500',
  },
  
  // 노트 그리드
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.medium,
  },
  noteCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Layout.spacing.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.small,
  },
  noteTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
    marginRight: Layout.spacing.small,
  },
  starButton: {
    padding: 2,
  },
  starFilled: {
    // 별표 채워진 상태 추가 스타일
  },
  noteStats: {
    flexDirection: 'row',
    gap: Layout.spacing.small,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginLeft: 4,
    fontSize: 11,
  },
  
  // 로딩 및 빈 상태
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xlarge,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xlarge,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '500',
    marginTop: Layout.spacing.medium,
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Layout.spacing.small,
    textAlign: 'center',
    maxWidth: 200,
  },
});

export default HighlightNotes;