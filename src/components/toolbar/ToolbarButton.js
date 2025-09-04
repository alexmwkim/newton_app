import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// 재사용 가능한 툴바 버튼 컴포넌트
export const ToolbarButton = ({ 
  type = 'text', // 'text', 'icon'
  title, 
  iconName, 
  iconSize = 18, 
  isActive = false, 
  onPress, 
  style,
  activeColor = '#EB754B',
  inactiveColor = '#F0F0F0',
  activeTextColor = '#FFF',
  inactiveTextColor = '#333'
}) => {
  const buttonStyle = {
    padding: 8, // 6 → 8 증가 (더 넓은 터치 영역)
    borderRadius: 4,
    backgroundColor: isActive ? activeColor : inactiveColor,
    minWidth: 36, // 32 → 36 증가 (더 넓은 버튼)
    minHeight: 36, // 32 → 36 증가
    justifyContent: 'center',
    alignItems: 'center',
    ...style
  };

  const textColor = isActive ? activeTextColor : inactiveTextColor;

  return (
    <TouchableOpacity 
      onPress={() => {
        console.log('🔘 ToolbarButton pressed:', { type, title, iconName });
        if (onPress) {
          onPress();
        }
      }}
      style={buttonStyle}
      activeOpacity={0.7}
      // 키보드 dismiss 방지를 위한 중요한 설정들
      delayPressIn={0}
      delayPressOut={0}
    >
      {type === 'icon' ? (
        <Icon name={iconName} size={iconSize} color={textColor} />
      ) : (
        <Text style={{ 
          fontWeight: title === 'B' ? 'bold' : '600',
          fontSize: ['H1', 'H2', 'H3'].includes(title) ? 12 : 14,
          fontStyle: title === 'I' ? 'italic' : 'normal',
          color: textColor 
        }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};