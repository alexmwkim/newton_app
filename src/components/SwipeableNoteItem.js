import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import ProfileStore from '../store/ProfileStore';
import { useNotesStore } from '../store/NotesStore';

const SwipeableNoteItem = ({ 
  note,
  onPress,
  onDelete,
  isPublic = false
}) => {
  const [userProfilePhoto, setUserProfilePhoto] = useState(ProfileStore.getProfilePhoto());
  const currentUser = 'alexnwkim'; // Current logged-in user
  const { toggleStarred, isStarred } = useNotesStore();
  
  // Local star count state for immediate UI updates
  const [localStarCount, setLocalStarCount] = useState(
    note.starCount || note.star_count || 0
  );
  
  // Force re-render when star state changes
  const [, forceUpdate] = useState({});
  
  // Normalize note data - ensure isPublic is set correctly
  const normalizedNote = {
    ...note,
    isPublic: note.isPublic || note.is_public || false
  };
  
  useEffect(() => {
    const unsubscribe = ProfileStore.subscribe(() => {
      setUserProfilePhoto(ProfileStore.getProfilePhoto());
    });
    return unsubscribe;
  }, []);
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

  const handleStarPress = async (event) => {
    event.stopPropagation(); // Prevent note opening
    
    console.log('⭐ ==========================================');
    console.log('⭐ handleStarPress - note.title:', normalizedNote.title);
    console.log('⭐ handleStarPress - note.id:', normalizedNote.id);
    console.log('⭐ handleStarPress - normalizedNote.isPublic:', normalizedNote.isPublic);
    console.log('⭐ handleStarPress - current starred state:', isStarred(normalizedNote.id));
    console.log('⭐ handleStarPress - current localStarCount:', localStarCount);
    
    // Only for public notes, use starred system
    if (normalizedNote.isPublic) {
      console.log('⭐ ✅ Public note star clicked - using starred system for note:', normalizedNote.id);
      
      // Optimistic UI update - immediately update star count
      const currentlyStarred = isStarred(normalizedNote.id);
      const newStarCount = currentlyStarred ? localStarCount - 1 : localStarCount + 1;
      setLocalStarCount(newStarCount);
      console.log('⭐ 🔄 Optimistic UI update - star count changed from', localStarCount, 'to', newStarCount);
      
      try {
        console.log('⭐ 🔄 Calling toggleStarred...');
        const newStarredState = await toggleStarred(normalizedNote.id);
        console.log('⭐ 🎉 toggleStarred completed successfully, new state:', newStarredState);
        
        // Force component re-render to reflect new star state
        forceUpdate({});
        console.log('⭐ 🔄 Forced component re-render to update star UI');
        console.log('⭐ ==========================================');
      } catch (error) {
        console.error('⭐ ❌ toggleStarred failed:', error);
        // Rollback optimistic update on failure
        setLocalStarCount(localStarCount);
        console.log('⭐ 🔄 Rolled back optimistic update to:', localStarCount);
        console.log('⭐ ==========================================');
      }
    } else {
      console.log('⭐ ❌ Private note - starred system not available');
      console.log('⭐ ==========================================');
    }
  };

  const handleForkPress = (event) => {
    event.stopPropagation(); // Prevent note opening
    Alert.alert(
      'Fork Note',
      `Create your own version of "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fork',
          onPress: () => {
            // TODO: Implement fork functionality
            console.log('Forking note:', note.id);
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
          {/* Debug check for public/private logic */}
          {console.log('🎨 SwipeableNoteItem render - note.title:', normalizedNote.title, 'normalizedNote.isPublic:', normalizedNote.isPublic, 'will show as:', normalizedNote.isPublic ? 'PUBLIC' : 'PRIVATE')}
          {normalizedNote.isPublic ? (
            // Public note format (same as explore page)
            <View style={styles.publicContent}>
              <View style={styles.noteHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    {(() => {
                      // Debug note data for troubleshooting
                      console.log('🏠 Home note debug:', {
                        title: normalizedNote.title,
                        username: normalizedNote.username,
                        user_id: normalizedNote.user_id,
                        currentUser: currentUser,
                        hasProfiles: !!normalizedNote.profiles,
                        profiles: normalizedNote.profiles
                      });
                      
                      // Check if this is current user's note by multiple criteria
                      const isCurrentUser = normalizedNote.username === currentUser || 
                                          normalizedNote.user_id === currentUser ||
                                          !normalizedNote.username; // If no username, assume current user for home screen
                      
                      // Get profile photo for the note author
                      const authorAvatar = normalizedNote.profiles?.avatar_url;
                      const currentUserAvatar = userProfilePhoto;
                      
                      // For current user's notes, prioritize their actual profile photo
                      let displayAvatar;
                      if (isCurrentUser) {
                        displayAvatar = currentUserAvatar || 'https://i.pravatar.cc/150?img=3';
                      } else {
                        // For other users, use their profile or generate consistent avatar
                        displayAvatar = authorAvatar;
                        if (!displayAvatar && normalizedNote.username) {
                          const userHash = normalizedNote.username.length % 70 + 1;
                          displayAvatar = `https://i.pravatar.cc/150?img=${userHash}`;
                        }
                      }
                      
                      return displayAvatar ? (
                        <Image 
                          source={{ uri: displayAvatar }} 
                          style={styles.avatarImage}
                          onError={(error) => {
                            console.log('🖼️ Avatar load failed for:', normalizedNote.username);
                          }}
                        />
                      ) : (
                        <Icon name="user" size={16} color={Colors.textGray} />
                      );
                    })()}
                  </View>
                  <Text style={styles.userName}>
                    {(() => {
                      // Check if this is current user's note and display appropriate username
                      const isCurrentUserNote = normalizedNote.username === currentUser || 
                                              normalizedNote.user_id === currentUser ||
                                              !normalizedNote.username; // If no username, assume current user for home screen
                      
                      if (isCurrentUserNote) {
                        return '@Alex Kim'; // Show formatted username like in note detail page
                      } else {
                        const username = normalizedNote.username || normalizedNote.profiles?.username || 'unknown';
                        return `@${username}`;
                      }
                    })()}
                  </Text>
                </View>
                
                {/* Trending/Popular badge for high star/fork counts */}
                {(normalizedNote.starCount >= 5 || normalizedNote.forkCount >= 3) && (
                  <View style={styles.trendingBadge}>
                    <Icon name="trending-up" size={12} color={Colors.floatingButton} />
                    <Text style={styles.trendingText}>Popular</Text>
                  </View>
                )}
              </View>
              <Text style={styles.publicTitle}>{normalizedNote.title}</Text>
              <View style={styles.noteFooter}>
                <TouchableOpacity 
                  style={styles.statChip}
                  onPress={handleStarPress}
                  activeOpacity={0.7}
                >
                  <Icon 
                    name={isStarred(normalizedNote.id) ? "star" : "star"} 
                    size={12} 
                    color={isStarred(normalizedNote.id) ? Colors.floatingButton : Colors.secondaryText}
                    solid={isStarred(normalizedNote.id)} // Use solid for filled star
                  />
                  <Text style={[styles.statText, isStarred(normalizedNote.id) && styles.starredText]}>
                    {localStarCount}
                  </Text>
                </TouchableOpacity>
                
                {/* Fork count display for all public notes */}
                <View style={styles.statChip}>
                  <Icon name="git-branch" size={12} color={Colors.secondaryText} />
                  <Text style={styles.statText}>{normalizedNote.forksCount || normalizedNote.forkCount || normalizedNote.fork_count || 0}</Text>
                </View>
              </View>
            </View>
          ) : (
            // Private note format (without star icon)
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {normalizedNote.title}
              </Text>
              {normalizedNote.forkedFrom && (
                <View style={styles.forkIndicator}>
                  <Icon name="git-branch" size={12} color={Colors.floatingButton} />
                  <Text style={styles.forkIndicatorText}>
                    from {normalizedNote.forkedFrom.author.name}
                  </Text>
                </View>
              )}
              <Text style={styles.username}>{normalizedNote.username || normalizedNote.timeAgo}</Text>
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
    textAlign: 'left',
    marginBottom: 4,
  },
  forkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  forkIndicatorText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.medium,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
  starredText: {
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.medium,
  },
  // Trending badge styles
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
    borderWidth: 1,
    borderColor: Colors.floatingButton,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  trendingText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default SwipeableNoteItem;