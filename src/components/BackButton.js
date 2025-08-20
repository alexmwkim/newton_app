import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';

const BackButton = ({ onPress, style, iconSize = 24, iconColor = Colors.primaryText, ...props }) => {
  return (
    <TouchableOpacity
      style={[styles.backButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      <Icon name="arrow-left" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    marginLeft: 12, // 표준 정렬 (화면 가장자리에서 20px)
    justifyContent: 'center',
    alignItems: 'center',
    // 표준 뒤로가기 버튼 스타일
  },
});

export default BackButton;