import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
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
          <Text
            style={[
              styles.buttonText,
              selectedOption === option.value && styles.activeButtonText,
            ]}
          >
            {option.icon} {option.label}
          </Text>
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
});

export default ToggleButton;