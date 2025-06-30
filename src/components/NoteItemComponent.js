import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

const NoteItemComponent = ({ 
  title = "Note title", 
  timeAgo = "5 hrs ago", 
  onPress 
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Note: ${title}, created ${timeAgo}`}
    >
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.timeAgo}>
          {timeAgo}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    minHeight: 72,
    justifyContent: 'center',
    marginVertical: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textBlack,
    marginBottom: 4,
  },
  timeAgo: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textGray,
  },
});

export default NoteItemComponent;