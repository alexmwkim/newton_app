/**
 * ModalMenuItem - 클릭 가능한 메뉴 아이템
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';

const ModalMenuItem = ({ 
  icon,
  title, 
  onPress, 
  isSelected = false,
  disabled = false 
}) => (
  <TouchableOpacity
    style={[styles.menuItem, disabled && styles.menuItemDisabled]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
  >
    <View style={styles.menuItemLeft}>
      {icon && (
        <Ionicons 
          name={icon} 
          size={18} 
          color={disabled ? Colors.secondaryText : Colors.primaryText} 
        />
      )}
      <Text style={[
        styles.menuItemText,
        disabled && styles.menuItemTextDisabled
      ]}>
        {title}
      </Text>
    </View>
    
    {isSelected && (
      <Ionicons name="checkmark" size={18} color={Colors.floatingButton} />
    )}
  </TouchableOpacity>
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
    marginLeft: 12,
    flex: 1,
  },
  
  menuItemTextDisabled: {
    color: Colors.secondaryText,
  },
});

export default ModalMenuItem;