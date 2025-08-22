import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';

const SingleToggle = ({ 
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
        size={16} 
        color={Colors.textWhite} 
      />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textBlack,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  text: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textWhite,
  },
});

export default SingleToggle;