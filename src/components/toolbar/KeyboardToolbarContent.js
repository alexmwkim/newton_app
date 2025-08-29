import React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSimpleToolbar } from '../../contexts/SimpleToolbarContext';
import { useFormatting } from './ToolbarFormatting';
import { ToolbarButton } from './ToolbarButton';

// ✅ react-native-keyboard-controller KeyboardToolbar 내용
export const KeyboardToolbarContent = () => {
  const { 
    activeScreenHandlers, 
    focusedIndex, 
    hideKeyboard
  } = useSimpleToolbar();
  
  const { 
    activeFormats, 
    toggleBold, 
    toggleItalic, 
    toggleHeading1, 
    toggleHeading2, 
    toggleHeading3 
  } = useFormatting();
  
  console.log('🎹 KeyboardToolbarContent render - activeScreenHandlers:', !!activeScreenHandlers, 'focusedIndex:', focusedIndex);
  console.log('🎹 KeyboardToolbarContent activeFormats:', activeFormats);
  
  if (!activeScreenHandlers) {
    return (
      <View style={{
        backgroundColor: '#FF6B6B',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{color: '#FFFFFF', fontSize: 16, fontWeight: 'bold'}}>
          ❌ NO ACTIVE SCREEN HANDLERS
        </Text>
      </View>
    );
  }
  
  return (
    <View 
      style={{
        backgroundColor: '#4ECDC4', // 테스트용 눈에 띄는 색상
        borderTopWidth: 3,
        borderTopColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        height: 60, // 더 큰 높이로 눈에 띄게
      }}
    >
      {/* 디버그 정보 */}
      <View style={{flex: 1, alignItems: 'center'}}>
        <Text style={{color: '#FFFFFF', fontSize: 18, fontWeight: 'bold'}}>
          🎹 KEYBOARD CONTROLLER TOOLBAR! 🎹
        </Text>
        <Text style={{color: '#FFFFFF', fontSize: 12}}>
          focusedIndex: {focusedIndex} | handlers: {activeScreenHandlers ? 'YES' : 'NO'}
        </Text>
      </View>
      
      {/* Done 버튼 */}
      <TouchableOpacity
        onPress={() => {
          console.log('🎹 KeyboardController Done button pressed');
          hideKeyboard();
        }}
        style={{
          backgroundColor: '#FF4757',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
          marginLeft: 12,
        }}
      >
        <Text style={{ 
          color: '#FFFFFF', 
          fontWeight: 'bold', 
          fontSize: 16,
        }}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

export default KeyboardToolbarContent;