/**
 * ModalSwitchItem - 스위치가 있는 메뉴 아이템
 */

import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';

const ModalSwitchItem = ({ 
  title, 
  value, 
  onValueChange, 
  disabled = false 
}) => (
  <View style={[styles.menuItem, disabled && styles.menuItemDisabled]}>
    <View style={styles.menuItemLeft}>
      <Text style={[
        styles.menuItemText,
        disabled && styles.menuItemTextDisabled
      ]}>
        {title}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ 
        false: Colors.border, 
        true: disabled ? Colors.border : Colors.floatingButton 
      }}
      thumbColor={
        disabled 
          ? Colors.secondaryText 
          : value ? Colors.white : Colors.secondaryText
      }
      ios_backgroundColor={Colors.border}
      style={styles.switch}
    />
  </View>
);

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
  },
  
  menuItemDisabled: {
    opacity: 0.5,
  },
  
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  menuItemText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    flex: 1,
  },
  
  menuItemTextDisabled: {
    color: Colors.secondaryText,
  },
  
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});

export default ModalSwitchItem;