import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const NoteItemComponent = ({ 
  title = "Note title", 
  timeAgo = "5 hrs ago", 
  onPress,
  author,
  forkCount,
  starCount,
  isStarred = false,
  onStar,
  showStarButton = false,
  forkedFrom = null
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Note: ${title}, created ${timeAgo}`}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {showStarButton && (
            <TouchableOpacity
              style={styles.starButton}
              onPress={() => onStar && onStar()}
            >
              <Icon
                name={isStarred ? 'star' : 'star'}
                size={20}
                color={isStarred ? Colors.floatingButton : Colors.iconInactive}
                fill={isStarred ? Colors.floatingButton : 'none'}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.footer}>
          <Text style={styles.timeAgo}>
            {timeAgo}
          </Text>
          {author && (
            <Text style={styles.author}>
              by {author}
            </Text>
          )}
          {forkedFrom && (
            <View style={styles.forkIndicator}>
              <Icon name="git-branch" size={12} color={Colors.floatingButton} />
              <Text style={styles.forkIndicatorText}>
                forked from {forkedFrom.author.name}
              </Text>
            </View>
          )}
          {(forkCount !== undefined || starCount !== undefined) && (
            <View style={styles.stats}>
              {forkCount !== undefined && (
                <View style={styles.stat}>
                  <Icon name="git-branch" size={12} color={Colors.textSecondary} />
                  <Text style={styles.statText}>{forkCount}</Text>
                </View>
              )}
              {starCount !== undefined && (
                <View style={styles.stat}>
                  <Icon name="star" size={12} color={Colors.textSecondary} />
                  <Text style={styles.statText}>{starCount}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    minHeight: 72,
    justifyContent: 'center',
    marginVertical: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textBlack,
    flex: 1,
  },
  starButton: {
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  author: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  forkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forkIndicatorText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.medium,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  timeAgo: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textGray,
  },
});

export default NoteItemComponent;