import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

// Simple time formatting function
const formatTimeAgo = (dateString) => {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}주 전`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}개월 전`;
  } catch {
    return '방금 전';
  }
};

const NotificationItem = ({ 
  notification, 
  onPress, 
  onMarkAsRead,
  style 
}) => {
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
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'star':
        return Colors.warning;
      case 'fork':
        return Colors.info;
      case 'follow':
        return Colors.success;
      case 'comment':
        return Colors.accent;
      default:
        return Colors.textSecondary;
    }
  };


  const handlePress = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onPress) {
      onPress(notification);
    }
  };

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={handlePress}>
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(notification.type) + '20' }
        ]}>
          <Feather
            name={getNotificationIcon(notification.type)}
            size={18}
            color={getNotificationColor(notification.type)}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[
            styles.message,
            !notification.read && styles.unreadMessage
          ]}>
            {notification.message}
          </Text>
          <Text style={styles.timeText}>
            {formatTimeAgo(notification.createdAt)}
          </Text>
        </View>

        {!notification.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontFamily: Typography.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  unreadMessage: {
    color: Colors.text,
    fontFamily: Typography.medium,
  },
  timeText: {
    fontSize: 12,
    fontFamily: Typography.regular,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginLeft: 8,
  },
});

export default NotificationItem;