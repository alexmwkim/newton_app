/**
 * 전역 툴바 컴포넌트 
 * 기존 UI 스타일을 정확히 유지하면서 업계 표준 구현
 */

import React from 'react';
import { View, TouchableOpacity, Text, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useToolbar } from '../contexts/ToolbarContext';
import { Spacing } from '../constants/StyleControl';

const GlobalToolbar = () => {
  const { 
    focusedScreenType, 
    focusedIndex, 
    isAuthor, 
    currentHandlers 
  } = useToolbar();

  // 툴바가 표시되어야 하는 조건
  const shouldShow = focusedScreenType && focusedIndex >= -1;
  
  console.log('🔧 GlobalToolbar render check:', {
    focusedScreenType,
    focusedIndex,
    isAuthor,
    shouldShow,
    handlersAvailable: Object.keys(currentHandlers).filter(k => currentHandlers[k])
  });
  
  if (!shouldShow) {
    console.log('🚫 GlobalToolbar hidden - conditions not met');
    return null;
  }
  
  console.log('✅ GlobalToolbar rendering...');

  const {
    handleAddCard,
    handleAddGrid,
    handleAddImage,
    handleDone
  } = currentHandlers;

  return (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E5E5',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      height: 44,
      width: '100%',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => {
            console.log('🔧 Global toolbar: Adding card at index:', focusedIndex);
            handleAddCard?.(focusedIndex >= 0 ? focusedIndex : 0);
          }}
          style={{
            padding: 8,
            borderRadius: 6,
            backgroundColor: isAuthor ? '#F0F0F0' : '#E0E0E0',
            minWidth: 36,
            minHeight: 36,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isAuthor ? 1 : 0.5,
          }}
          disabled={!isAuthor}
        >
          <Icon name="square" size={18} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            console.log('🔧 Global toolbar: Adding grid at index:', focusedIndex);
            handleAddGrid?.(focusedIndex >= 0 ? focusedIndex : 0);
          }}
          style={{
            padding: 8,
            borderRadius: 6,
            backgroundColor: isAuthor ? '#F0F0F0' : '#E0E0E0',
            minWidth: 36,
            minHeight: 36,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isAuthor ? 1 : 0.5,
          }}
          disabled={!isAuthor}
        >
          <Icon name="grid" size={18} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            console.log('🔧 Global toolbar: Adding image at index:', focusedIndex);
            handleAddImage?.(focusedIndex >= 0 ? focusedIndex : 0);
          }}
          style={{
            padding: 8,
            borderRadius: 6,
            backgroundColor: isAuthor ? '#F0F0F0' : '#E0E0E0',
            minWidth: 36,
            minHeight: 36,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isAuthor ? 1 : 0.5,
          }}
          disabled={!isAuthor}
        >
          <Icon name="image" size={18} color="#333" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        onPress={() => {
          console.log('🔧 Global toolbar: Done pressed');
          handleDone?.();
          Keyboard.dismiss();
        }}
        style={{
          padding: 8,
          borderRadius: 6,
          backgroundColor: 'rgba(235, 117, 75, 1)',
          minWidth: 60,
          minHeight: 36,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GlobalToolbar;