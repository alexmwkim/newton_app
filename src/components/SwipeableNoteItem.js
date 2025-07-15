import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const SwipeableNoteItem = ({ 
  note,
  onPress,
  onDelete,
  isPublic = false
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -40) {
          // Show delete button
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: -80,
              useNativeDriver: true,
            }),
            Animated.timing(deleteOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start();
        } else {
          // Reset position
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Reset position
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }),
              Animated.timing(deleteOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              })
            ]).start();
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(note.id);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.noteContainer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.noteContent}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Note: ${note.title}, created ${note.timeAgo}`}
        >
          {note.isPublic ? (
            // Public note format (same as explore page)
            <View style={styles.publicContent}>
              <View style={styles.noteHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Icon name="user" size={16} color={Colors.textGray} />
                  </View>
                  <Text style={styles.userName}>{note.username || 'username'}</Text>
                </View>
              </View>
              <Text style={styles.publicTitle}>{note.title}</Text>
              <View style={styles.noteFooter}>
                <View style={styles.statChip}>
                  <Icon name="star" size={12} color={Colors.secondaryText} />
                  <Text style={styles.statText}>{note.starCount || 0}</Text>
                </View>
                <View style={styles.statChip}>
                  <Icon name="git-branch" size={12} color={Colors.secondaryText} />
                  <Text style={styles.statText}>{note.forksCount || 0}</Text>
                </View>
              </View>
            </View>
          ) : (
            // Private note format (original)
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {note.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.timeAgo}>
                  {note.timeAgo}
                </Text>
                {note.forkedFrom && (
                  <View style={styles.forkIndicator}>
                    <Icon name="git-branch" size={12} color={Colors.floatingButton} />
                    <Text style={styles.forkIndicatorText}>
                      from {note.forkedFrom.author.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View style={[styles.deleteButton, { opacity: deleteOpacity }]}>
        <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
          <Icon name="trash-2" size={20} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    position: 'relative',
  },
  noteContainer: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
  },
  noteContent: {
    padding: 16,
    minHeight: 72,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textBlack,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
  timeAgo: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textGray,
  },
  username: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textGray,
    fontStyle: 'italic',
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 4,
    bottom: 4,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    width: 60,
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Public note styles (same as explore page)
  publicContent: {
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
    color: Colors.textGray,
  },
  publicTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textBlack,
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
    color: Colors.textGray,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 12,
  },
  statText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textGray,
  },
});

export default SwipeableNoteItem;