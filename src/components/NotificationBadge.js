import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSocialStore } from '../store/SocialStore';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

const NotificationBadge = ({ onPress, style }) => {
  const { unreadNotificationCount } = useSocialStore();

  if (unreadNotificationCount === 0) {
    return (
      <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
        <Feather name="bell" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
      <Feather name="bell" size={24} color={Colors.accent} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Typography.regular,
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default NotificationBadge;