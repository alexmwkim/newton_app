import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

const SingleToggleComponent = ({ 
  isPublic = false, 
  onToggle 
}) => {
  const iconName = isPublic ? 'globe' : 'lock';
  const label = isPublic ? 'Public' : 'Private';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onToggle?.(!isPublic)}
      accessibilityRole="button"
      accessibilityState={{ selected: isPublic }}
    >
      <Icon 
        name={iconName} 
        size={12} 
        color={Colors.textBlack} 
      />
      <Text style={styles.text}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.noteCard,
    width: 95,
    gap: 4,
  },
  text: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textBlack,
  },
});

export default SingleToggleComponent;