import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import ProfileStore from '../store/ProfileStore';
import { useNotesStore } from '../store/NotesStore';
import { useViewMode } from '../store/ViewModeStore';

const SwipeableNoteItem = ({ 
  note,
  onPress,
  onDelete,
  isPublic = false,
  viewMode
}) => {
  const { viewModes } = useViewMode();
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

  // Helper function to extract images from note content
  const extractImagesFromContent = (content) => {
    const imageMatches = content.match(/🖼️\s*Image:\s*([^\n]*)/g);
    if (!imageMatches) return [];
    
    return imageMatches.map(match => {
      const url = match.replace(/🖼️\s*Image:\s*/, '').trim();
      return url;
    }).filter(url => url && url.length > 0);
  };

  // Helper function to extract cards from note content
  const extractCardsFromContent = (content) => {
    const cardMatches = content.match(/📋\s*Card:\s*([^\n]*(?:\n(?!📋|🖼️)[^\n]*)*)/g);
    if (!cardMatches) return [];
    
    return cardMatches.map(match => {
      const cardContent = match.replace(/📋\s*Card:\s*/, '').trim();
      // Get first 3 lines only
      const lines = cardContent.split('\n').slice(0, 3);
      return lines.join('\n').trim();
    }).filter(content => content && content.length > 0);
  };

  // Helper function to generate content preview from actual note content
  const generateContentPreview = (note) => {
    // Use actual note content if available
    let content = note.content || note.body || '';
    
    // If no content, show placeholder
    if (!content || content.trim() === '') {
      return { text: '(내용 없음)', images: [] };
    }
    
    // Parse content blocks in order to find the first content type
    const parts = content.split(/\n\n/);
    let firstContentImages = [];
    let processedText = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      if (part.startsWith('🖼️ Image:')) {
        // If first content is image, extract it for preview
        if (firstContentImages.length === 0 && processedText === '') {
          const imageUrl = part.replace('🖼️ Image:', '').trim();
          if (imageUrl) {
            firstContentImages.push(imageUrl);
          }
        }
        // Skip adding to text since we show as thumbnail
        continue;
      } else if (part.startsWith('📋 Card:')) {
        // If first content is card, show card content without icon
        if (firstContentImages.length === 0 && processedText === '') {
          const cardContent = part.replace('📋 Card:', '').trim();
          if (cardContent) {
            processedText = cardContent; // Show card content directly without icon
          } else {
            processedText = '(빈 카드)';
          }
        }
        // Skip other cards since we only show first content
        continue;
      } else {
        // Regular text content
        if (firstContentImages.length === 0 && processedText === '') {
          processedText = part;
        }
        // Skip other text if we already have first content
        continue;
      }
    }
    
    // If we have first content as image, don't show text
    if (firstContentImages.length > 0) {
      processedText = '';
    }
    
    // Clean up text content
    if (processedText) {
      processedText = processedText
        .replace(/[#*_`~]/g, '') // Remove markdown symbols
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
      
      // Truncate to reasonable length
      if (processedText.length > 100) {
        processedText = processedText.substring(0, 100) + '...';
      }
    }
    
    // If no content found, show placeholder
    if (!processedText && firstContentImages.length === 0) {
      processedText = '(내용 없음)';
    }
    
    return { 
      text: processedText, 
      images: firstContentImages
    };
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.noteContainer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.noteContent,
            viewMode === viewModes.CONTENT_PREVIEW && styles.noteContentPreview
          ]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Note: ${note.title}, created ${note.timeAgo}`}
        >
          {/* Debug check for public/private logic */}
          {console.log('🎨 SwipeableNoteItem render - note.title:', normalizedNote.title, 'viewMode:', viewMode, 'isPublic:', normalizedNote.isPublic)}
          
          {/* Render based on view mode */}
          {viewMode === viewModes.CONTENT_PREVIEW && normalizedNote.isPublic ? (
            // Content Preview Mode for Public Notes - Use same structure as Title Only
            <View style={styles.publicContent}>
              <View style={styles.publicTopSection}>
                <View style={styles.noteHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      {(() => {
                        // Debug note data for troubleshooting
                        console.log('🏠 Home note debug (Content Preview):', {
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
                
                {/* Content Preview Text and Images */}
                {(() => {
                  const contentPreview = generateContentPreview(normalizedNote);
                  return (
                    <View style={styles.contentPreviewContent}>
                      {contentPreview.text && (
                        <Text style={styles.contentPreviewText} numberOfLines={2}>
                          {contentPreview.text}
                        </Text>
                      )}
                      {contentPreview.images.length > 0 && (
                        <View style={styles.thumbnailContainer}>
                          {contentPreview.images.map((imageUrl, index) => (
                            <Image
                              key={index}
                              source={{ uri: imageUrl }}
                              style={styles.thumbnailImage}
                              resizeMode="cover"
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>
              
              {/* Social icons positioned absolutely to not affect centering */}
              <View style={styles.socialIconsAbsolute}>
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
          ) : viewMode === viewModes.CONTENT_PREVIEW ? (
            // Content Preview Mode for Private Notes
            <View style={styles.contentPreviewContainer}>
              <Text style={styles.contentPreviewTitle} numberOfLines={1}>
                {normalizedNote.title}
              </Text>
              
{(() => {
                const contentPreview = generateContentPreview(normalizedNote);
                return (
                  <View style={styles.contentPreviewContent}>
                    {contentPreview.text && (
                      <Text style={styles.contentPreviewText} numberOfLines={2}>
                        {contentPreview.text}
                      </Text>
                    )}
                    {contentPreview.images.length > 0 && (
                      <View style={styles.thumbnailContainer}>
                        {contentPreview.images.map((imageUrl, index) => (
                          <Image
                            key={index}
                            source={{ uri: imageUrl }}
                            style={styles.thumbnailImage}
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}
              
              {/* Footer positioned absolutely to not affect centering */}
              <Text style={styles.contentPreviewTime}>
                {normalizedNote.timeAgo}
              </Text>
            </View>
          ) : normalizedNote.isPublic ? (
            // Public note format (same as explore page) - Title Only
            <View style={styles.publicContent}>
              <View style={styles.publicTopSection}>
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
              </View>
              
              {/* Social icons positioned absolutely to not affect centering */}
              <View style={styles.socialIconsAbsolute}>
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
    padding: 16, // Consistent 16px padding on all sides
    minHeight: 72,
    justifyContent: 'center', // Center content vertically
    position: 'relative', // For absolute positioning of username
  },
  content: {
    flex: 1,
    justifyContent: 'center', // Center title vertically in Title Only mode
    alignItems: 'flex-start', // Keep text left-aligned
    paddingVertical: 0, // Remove any extra vertical padding for perfect centering
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 18, // Increased by 2px for better hierarchy
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textBlack,
    textAlign: 'left',
    width: '100%', // Full width for proper text alignment
    lineHeight: 24, // Ensure consistent line height for centering
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
    position: 'absolute', // Position absolutely to not affect title centering
    bottom: 4, // Position at bottom of card
    left: 0,
    right: 0,
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
    justifyContent: 'center', // Center all content vertically in the card
    paddingVertical: 0, // Remove extra padding, rely on parent noteContent padding
  },
  
  publicTopSection: {
    // Groups header and title together for proper spacing
    flex: 1, // Take up available space to center content
    justifyContent: 'center', // Center content vertically in Content Preview mode
    paddingBottom: 16, // Add padding to prevent overlap with social icons
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Reduced spacing for tighter layout
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
    fontSize: 18, // Increased by 2px for better hierarchy
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textBlack,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 8, // Reduced spacing for tighter layout
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0, // Remove auto margin for content preview centering
    paddingTop: 0, // Remove extra padding
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
  
  // Content Preview Styles
  noteContentPreview: {
    backgroundColor: Colors.noteCardBackground,
    borderRadius: 12,
    padding: 16, // Consistent 16px padding on all sides
    marginBottom: Layout.spacing.sm,
    minHeight: 100,
    justifyContent: 'center', // Center content vertically
  },
  
  contentPreviewContainer: {
    flex: 1,
    justifyContent: 'center', // Center the title+preview group vertically
    alignItems: 'flex-start', // Keep text left-aligned
    paddingBottom: 16, // Add padding to prevent overlap with time info
  },
  
  contentPreviewTitle: {
    fontSize: 18, // Increased by 2px for better hierarchy, consistent with other titles
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primaryText,
    marginBottom: 6, // Reduced for tighter, more balanced layout
  },
  
  contentPreviewText: {
    fontSize: 16, // Increased from small to 16px for better readability
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    lineHeight: 22, // Increased line height for better readability
    marginBottom: 8, // Remove margin since footer is now absolute positioned
  },
  
  contentPreviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  contentPreviewTime: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    position: 'absolute', // Position absolutely to not affect title+content centering
    bottom: 16, // Position 16px from bottom of card
    left: 0,
    right: 0,
  },
  
  socialIconsAbsolute: {
    position: 'absolute', // Position absolutely to not affect content centering
    bottom: 0, // Position 16px from bottom of card
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Thumbnail styles for content preview
  contentPreviewContent: {
    flex: 1,
  },
  
  thumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  
  thumbnailImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.noteCard,
  },
  
  // Card preview styles
  cardPreviewContainer: {
    marginTop: 8,
    gap: 6,
  },
  
  cardPreviewBox: {
    backgroundColor: Colors.noteCard,
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.border || '#E5E5E5',
    minHeight: 30,
    maxWidth: 120, // Limit width for compact preview
  },
  
  cardPreviewText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    lineHeight: 14,
  },
});

export default SwipeableNoteItem;