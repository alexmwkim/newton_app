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
    padding: 8,
    borderRadius: 4,
    backgroundColor: isActive ? activeColor : inactiveColor,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...style
  };

  const textColor = isActive ? activeTextColor : inactiveTextColor;

  return (
    <TouchableOpacity 
      onPress={() => {
        if (onPress) {
          onPress();
        } else {
          console.log('🚨 NO onPress function provided!');
        }
      }}
      style={buttonStyle}
      activeOpacity={0.7}
      // 🔧 FIX: 터치 이벤트 최대 민감도 설정
      delayPressIn={0}
      delayPressOut={0}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 터치 영역 확장
      pressRetentionOffset={{ top: 10, bottom: 10, left: 10, right: 10 }}
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