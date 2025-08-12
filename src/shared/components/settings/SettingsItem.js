/**
 * SettingsItem - 개별 설정 아이템 컴포넌트
 */

import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';
import Layout from '../../../constants/Layout';

const SettingsItem = ({
  title,
  subtitle,
  icon,
  onPress,
  rightElement,
  showChevron = false,
  switchValue,
  onSwitchChange,
  style,
  isLast = false
}) => {
  const handlePress = () => {
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.item,
        !isLast && styles.itemBorder,
        style
      ]} 
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.leftSection}>
        {icon && (
          <Icon 
            name={icon} 
            size={20} 
            color={Colors.primaryText} 
            style={styles.icon}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.rightSection}>
        {rightElement && rightElement}
        
        {switchValue !== undefined && (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ 
              false: Colors.border, 
              true: Colors.floatingButton 
            }}
            thumbColor={switchValue ? Colors.white : Colors.secondaryText}
            ios_backgroundColor={Colors.border}
          />
        )}
        
        {showChevron && (
          <Icon 
            name="chevron-right" 
            size={20} 
            color={Colors.secondaryText} 
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    minHeight: 56,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: Layout.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  subtitle: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
});

export default SettingsItem;