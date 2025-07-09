import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const PublicNoteCard = ({ 
  username = "username", 
  title = "Note title",
  forksCount = 0,
  onPress 
}) => {
  return (
    <View style={styles.noteCard}>
      <TouchableOpacity onPress={onPress} style={styles.noteCardContent}>
        <View style={styles.noteHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Icon name="user" size={16} color={Colors.secondaryText} />
            </View>
            <Text style={styles.userName}>{username}</Text>
          </View>
        </View>
        <Text style={styles.noteTitle}>{title}</Text>
        <View style={styles.noteFooter}>
          <Text style={styles.forkCount}>{forksCount} Forks</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  noteCard: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    marginBottom: Layout.spacing.sm,
    padding: Layout.spacing.md,
  },
  noteCardContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm,
  },
  userName: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Layout.spacing.sm,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forkCount: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
});

export default PublicNoteCard;