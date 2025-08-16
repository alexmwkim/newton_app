/**
 * NotificationBell Component
 * Display unread notification count with animation effects
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  Animated, 
  StyleSheet 
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNotifications } from '../hooks/useNotifications';
import Colors from '../constants/Colors';

const NotificationBell = React.memo(({ 
  onPress, 
  size = 24, 
  color = Colors.textBlack,
  showBadge = true,
  animateOnNewNotification = true 
}) => {
  const { unreadCount, hasUnread } = useNotifications();
  
  // Animation values
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const badgeScaleAnimation = useRef(new Animated.Value(1)).current;
  
  // Track previous unreadCount
  const prevUnreadCount = useRef(unreadCount);

  // Execute animation when new notification arrives
  useEffect(() => {
    if (animateOnNewNotification && unreadCount > prevUnreadCount.current) {
      // Bell shake animation
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Badge pulse animation
      Animated.sequence([
        Animated.timing(badgeScaleAnimation, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(badgeScaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    prevUnreadCount.current = unreadCount;
  }, [unreadCount, animateOnNewNotification, shakeAnimation, badgeScaleAnimation]);

  // Touch animation
  const handlePressIn = () => {
    Animated.spring(scaleAnimation, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Badge text formatting
  const getBadgeText = (count) => {
    if (count === 0) return '';
    if (count > 99) return '99+';
    return count.toString();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={`${unreadCount} notifications`}
      accessibilityRole="button"
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { translateX: shakeAnimation },
              { scale: scaleAnimation }
            ],
          },
        ]}
      >
        <Icon 
          name="bell" 
          size={size} 
          color={hasUnread ? Colors.primary : color} 
        />
        
        {showBadge && hasUnread && (
          <Animated.View
            style={[
              styles.badge,
              {
                transform: [{ scale: badgeScaleAnimation }],
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {getBadgeText(unreadCount)}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30', // iOS style red
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;