import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, Platform } from 'react-native';
import { KeyboardToolbar, KeyboardProvider } from 'react-native-keyboard-controller';
import Icon from 'react-native-vector-icons/Feather';
import { useSimpleToolbar } from '../../contexts/SimpleToolbarContext';
import { useFormatting } from './ToolbarFormatting';
import { ToolbarButton } from './ToolbarButton';

// ✅ react-native-keyboard-controller를 사용한 키보드 툴바
export const KeyboardControllerToolbar = () => {
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
  
  console.log('🎹 KeyboardControllerToolbar render - activeScreenHandlers:', !!activeScreenHandlers, 'focusedIndex:', focusedIndex);
  
  if (!activeScreenHandlers) {
    return null;
  }
  
  return (
    <KeyboardToolbar>
      <View 
        style={{
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 6,
          height: 48,
        }}
      >
        {/* 스크롤 가능한 툴바 버튼들 */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 0,
            minHeight: 36,
          }}
          style={{ 
            flex: 1,
            maxHeight: 36,
          }}
        >
          {/* 플러스 버튼 */}
          <ToolbarButton 
            type="icon"
            iconName="plus"
            iconSize={16}
            onPress={() => {
              console.log('🎹 Plus button pressed - show menu');
            }}
            style={{ marginRight: 12 }}
          />

          {/* 텍스트 포맷팅 버튼들 */}
          <ToolbarButton 
            title="B" 
            isActive={activeFormats.bold}
            onPress={() => {
              console.log('🎹 BOLD BUTTON CLICKED');
              toggleBold();
            }}
            style={{ marginRight: 8 }}
          />
          
          <ToolbarButton 
            title="I" 
            isActive={activeFormats.italic}
            onPress={() => {
              console.log('🎹 ITALIC BUTTON CLICKED');
              toggleItalic();
            }}
            style={{ marginRight: 8 }}
          />
          
          <ToolbarButton 
            title="H1" 
            isActive={activeFormats.heading1}
            onPress={() => {
              console.log('🎹 H1 BUTTON CLICKED');
              toggleHeading1();
            }}
            style={{ marginRight: 8 }}
          />
          
          <ToolbarButton 
            title="H2" 
            isActive={activeFormats.heading2}
            onPress={() => {
              console.log('🎹 H2 BUTTON CLICKED');
              toggleHeading2();
            }}
            style={{ marginRight: 8 }}
          />

          <ToolbarButton 
            title="H3" 
            isActive={activeFormats.heading3}
            onPress={() => {
              console.log('🎹 H3 BUTTON CLICKED');
              toggleHeading3();
            }}
            style={{ marginRight: 8 }}
          />

          {/* 콘텐츠 추가 버튼들 */}
          <ToolbarButton 
            type="icon"
            iconName="square"
            onPress={() => {
              console.log('🎹 Add CARD button pressed');
              if (activeScreenHandlers?.handleAddCard) {
                activeScreenHandlers.handleAddCard(focusedIndex >= 0 ? focusedIndex : 0);
              }
            }}
            style={{ marginRight: 8 }}
          />
          
          <ToolbarButton 
            type="icon"
            iconName="grid"
            onPress={() => {
              console.log('🎹 Add GRID button pressed');
              if (activeScreenHandlers?.handleAddGrid) {
                activeScreenHandlers.handleAddGrid(focusedIndex >= 0 ? focusedIndex : 0);
              }
            }}
            style={{ marginRight: 8 }}
          />
          
          <ToolbarButton 
            type="icon"
            iconName="image"
            onPress={() => {
              console.log('🎹 IMAGE BUTTON CLICKED');
              if (activeScreenHandlers?.handleAddImage) {
                activeScreenHandlers.handleAddImage(focusedIndex >= 0 ? focusedIndex : 0).catch(error => {
                  console.log('❌ handleAddImage error:', error);
                });
              }
            }}
            style={{ marginRight: 8 }}
          />
        </ScrollView>
        
        <TouchableOpacity
          onPress={() => {
            console.log('🎹 KeyboardController Done button pressed');
            hideKeyboard();
          }}
          style={{
            backgroundColor: '#EB754B',
            paddingHorizontal: 14,
            paddingVertical: 0, 
            borderRadius: 6,
            minWidth: 65,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row', 
            marginLeft: 8,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ 
            color: '#FFFFFF', 
            fontWeight: 'bold', 
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 16,
          }}>Done</Text>
        </TouchableOpacity>
      </View>
    </KeyboardToolbar>
  );
};

// ✅ KeyboardProvider로 앱을 감싸는 wrapper
export const KeyboardProviderWrapper = ({ children }) => {
  return (
    <KeyboardProvider>
      {children}
      <KeyboardControllerToolbar />
    </KeyboardProvider>
  );
};