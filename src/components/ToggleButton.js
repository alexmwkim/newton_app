import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const ToggleButton = ({ options, selectedOption, onToggle }) => {
  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.button,
            index === 0 && styles.leftButton,
            index === options.length - 1 && styles.rightButton,
            selectedOption === option.value && styles.activeButton,
          ]}
          onPress={() => onToggle(option.value)}
        >
          <View style={styles.buttonContent}>
            <Icon 
              name={option.icon} 
              size={16} 
              color={selectedOption === option.value ? Colors.primaryText : Colors.secondaryText} 
            />
            <Text
              style={[
                styles.buttonText,
                selectedOption === option.value && styles.activeButtonText,
              ]}
            >
              {option.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.noteCard,
    borderRadius: Layout.borderRadius,
    padding: 2,
    marginVertical: Layout.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  leftButton: {
    borderTopLeftRadius: Layout.borderRadius,
    borderBottomLeftRadius: Layout.borderRadius,
  },
  rightButton: {
    borderTopRightRadius: Layout.borderRadius,
    borderBottomRightRadius: Layout.borderRadius,
  },
  activeButton: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius - 2,
  },
  buttonText: {
    fontSize: Typography.fontSize.body,
    color: Colors.secondaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  activeButtonText: {
    color: Colors.primaryText,
    fontWeight: Typography.fontWeight.semibold,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

export default ToggleButton;