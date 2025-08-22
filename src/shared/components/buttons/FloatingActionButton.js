import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Typography from '../../../constants/Typography';

const FloatingActionButton = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityLabel="Create new note"
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Icon name="plus" size={20} color={Colors.textWhite} />
        <Text style={styles.text}>Create new</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    backgroundColor: Colors.primaryOrange,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 18,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textWhite,
  },
});

export default FloatingActionButton;