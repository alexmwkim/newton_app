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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    // 단순한 아이콘 스타일 - 배경이나 테두리 없음
    // 터치 영역만 확보
  },
});

export default BackButton;