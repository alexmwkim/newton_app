import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import { NewtonLogo } from './NewtonLogo';
import NotificationBell from './NotificationBell';

const HeaderComponent = ({ onBackPress, onNotificationsPress, onMenuPress, onLogoPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onLogoPress}
        accessibilityLabel="Newton Logo - Refresh"
        style={styles.logoButton}
      >
        <NewtonLogo 
          width={48} 
          height={48} 
          color={Colors.primaryText}
        />
      </TouchableOpacity>
      
      <View style={styles.rightIcons}>
        <NotificationBell 
          onPress={onNotificationsPress}
          size={24}
          color={Colors.textBlack}
          showBadge={true}
          animateOnNewNotification={true}
        />
        
        <TouchableOpacity 
          onPress={onMenuPress}
          accessibilityLabel="More options"
          style={styles.iconButton}
        >
          <Icon name="more-horizontal" size={24} color={Colors.textBlack} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  logoButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    minHeight: 24,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});

export default HeaderComponent;