import React, { useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNotifications } from '../hooks/useNotifications';
import Avatar from './Avatar';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

// Simple time formatting function
const formatTimeAgo = (dateString) => {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  } catch {
    return 'just now';
  }
};

const NotificationItem = React.memo(({ 
  notification, 
  onPress, 
  onDelete,
  style 
}) => {
  const { markAsRead, deleteNotification } = useNotifications();
  
  // Swipe animation refs
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'star':
        return 'star';
      case 'fork':
        return 'git-branch';
      case 'follow':
        return 'user-plus';
      case 'comment':
        return 'message-circle';
      case 'mention':
        return 'at-sign';
      case 'system':
        return 'info';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'star':
        return '#FFD700'; // gold
      case 'fork':
        return '#4A90E2'; // blue
      case 'follow':
        return '#7ED321'; // green
      case 'comment':
        return '#F5A623'; // orange
      case 'mention':
        return '#BD10E0'; // purple
      case 'system':
        return '#50E3C2'; // teal
      default:
        return Colors.secondaryText;
    }
  };

  // Pan responder for swipe gesture
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

  const handlePress = useCallback(async () => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Execute parent component's onPress callback
    if (onPress) {
      onPress(notification);
    }
  }, [notification.id, notification.is_read, markAsRead, onPress]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(notification.id);
              if (onDelete) {
                onDelete(notification.id);
              }
            } catch (error) {
              console.error('Error deleting notification:', error);
            }
          },
        },
      ]
    );
  }, [notification.id, deleteNotification, onDelete]);

  // Parse notification data
  const notificationData = notification.data ? 
    (typeof notification.data === 'string' ? 
      JSON.parse(notification.data) : 
      notification.data) : 
    {};

  // Sender information
  const sender = notification.sender;
  
  // Get sender name with multiple fallback options
  const getSenderName = () => {
    // First try: sender object username
    if (sender?.username) {
      return sender.username;
    }
    
    // Second try: data object sender_username (most reliable)
    if (notificationData.sender_username) {
      return notificationData.sender_username;
    }
    
    // Third try: specific type usernames
    if (notificationData.follower_username) {
      return notificationData.follower_username;
    }
    if (notificationData.starrer_username) {
      return notificationData.starrer_username;
    }
    
    // Fourth try: use sender_id to create a readable name
    if (notification.sender_id) {
      return `User-${notification.sender_id.substring(0, 8)}`;
    }
    
    // Fifth try: use sender_id from data
    if (notificationData.sender_id) {
      return `User-${notificationData.sender_id.substring(0, 8)}`;
    }
    
    // Last resort
    return 'Unknown User';
  };
  
  const senderName = getSenderName();
  
  // Debug logging for follow notifications specifically
  if (notification.type === 'follow') {
    console.log('🐛 FOLLOW NOTIFICATION DEBUG:', {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      recipient_id: notification.recipient_id,
      sender_id: notification.sender_id,
      sender: sender,
      senderUsername: sender?.username,
      senderName: senderName,
      notificationData: notificationData,
      finalDisplayMessage: `${senderName} started following you`
    });
  }
  
  // Debug logging for troubleshooting
  if (senderName === 'Unknown User') {
    console.log('🐛 NotificationItem debug - Unknown User:', {
      notificationId: notification.id,
      sender: sender,
      senderUsername: sender?.username,
      notificationData: notificationData,
      senderId: notification.sender_id,
      type: notification.type
    });
  }

  return (
    <View style={[styles.swipeableContainer, style]}>
      <Animated.View
        style={[
          styles.container,
          !notification.is_read && styles.unreadContainer,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.touchableContent}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={styles.content}>
        {/* Sender avatar - always show if sender exists */}
        {sender?.user_id ? (
          <Avatar 
            imageUrl={sender.avatar_url}
            username={senderName}
            size="large"
            style={styles.avatar}
          />
        ) : (
          <View style={[
            styles.iconContainer,
            { backgroundColor: getNotificationColor(notification.type) + '20' }
          ]}>
            <Icon
              name={getNotificationIcon(notification.type)}
              size={20}
              color={getNotificationColor(notification.type)}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            !notification.is_read && styles.unreadTitle
          ]}>
            {notification.title}
          </Text>
          <Text style={[
            styles.message,
            !notification.is_read && styles.unreadMessage
          ]}>
            {senderName} {notification.type === 'follow' ? 'started following you' : notification.message.replace('Someone', senderName)}
          </Text>
          <View style={styles.metaContainer}>
            <Text style={styles.timeText}>
              {formatTimeAgo(notification.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.rightContainer}>
          {!notification.is_read && <View style={styles.unreadDot} />}
          {notification.type === 'star' && (
            <Icon name="chevron-right" size={16} color={Colors.lightGray} />
          )}
        </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Delete button */}
      <Animated.View style={[styles.deleteButton, { opacity: deleteOpacity }]}>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButtonTouchable}>
          <Icon name="trash-2" size={20} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  touchableContent: {
    flex: 1,
  },
  unreadContainer: {
    backgroundColor: '#F8F9FA', // Unread notification background
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  avatar: {
    marginRight: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textBlack,
    marginBottom: 2,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: '600',
    color: Colors.textBlack,
  },
  message: {
    fontSize: 14,
    color: Colors.secondaryText,
    lineHeight: 19,
    marginBottom: 6,
  },
  unreadMessage: {
    color: Colors.textBlack,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  rightContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF', // iOS blue
    marginBottom: 4,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationItem;