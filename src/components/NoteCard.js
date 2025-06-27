import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const NoteCard = ({ title, content, createdAt, author, isPublic, onPress, forkCount }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {isPublic && author && (
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{author.charAt(1)}</Text>
          </View>
          <Text style={styles.authorName}>{author}</Text>
        </View>
      )}
      
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      
      {isPublic && forkCount !== undefined && (
        <View style={styles.footer}>
          <Text style={styles.forkCount}>
            {forkCount} Forks
          </Text>
          <Text style={styles.date}>
            {createdAt}
          </Text>
        </View>
      )}
      
      {!isPublic && (
        <Text style={styles.date}>
          {createdAt}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.noteCard,
    borderRadius: Layout.borderRadius,
    padding: Layout.padding.card,
    marginVertical: Layout.spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.floatingButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  avatarText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  authorName: {
    fontSize: Typography.fontSize.small,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  title: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.sm,
  },
  date: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forkCount: {
    fontSize: Typography.fontSize.small,
    color: Colors.secondaryText,
  },
});

export default NoteCard;