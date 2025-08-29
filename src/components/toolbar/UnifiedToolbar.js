import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useSimpleToolbar } from '../../contexts/SimpleToolbarContext';
import { useFormatting } from './ToolbarFormatting';
import { ToolbarButton } from './ToolbarButton';

// ✅ InputAccessoryView에서 사용할 툴바 컨텐츠 (위치 고정 없음)
export const UnifiedToolbarContent = () => {
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
  
  console.log('✅ UnifiedToolbarContent render - activeScreenHandlers:', !!activeScreenHandlers, 'focusedIndex:', focusedIndex);
  console.log('✅ UnifiedToolbarContent activeFormats:', activeFormats);
  
  // InputAccessoryView에서는 항상 표시 (키보드와 동기화됨)
  if (!activeScreenHandlers) {
    console.log('❌ UnifiedToolbarContent: No activeScreenHandlers, returning null');
    return null;
  }
  
  console.log('✅ UnifiedToolbarContent: Rendering toolbar content...');
  
  return (
    <View 
      style={{
        // ✅ 플로팅 툴바용 스타일 (높이 제한 없음)
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 0, // 외부 컨테이너에서 패딩 처리
        paddingVertical: 0,
        flex: 1,
      }}
    >
      {/* 스크롤 가능한 툴바 버튼들 */}
      <ScrollView 
        horizontal={true}
        vertical={false}                     // ✅ 세로 스크롤 완전 비활성화
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}  // ✅ 세로 스크롤 인디케이터 비활성화
        scrollEnabled={true}                 // ✅ 가로 스크롤만 활성화
        bounces={false}                      // ✅ 바운스 효과 비활성화 (상하 움직임 방지)
        alwaysBounceVertical={false}         // ✅ 세로 바운스 완전 비활성화
        alwaysBounceHorizontal={true}        // ✅ 가로 바운스만 허용
        keyboardShouldPersistTaps="handled"  // ⭐ 키보드 유지의 핵심!
        keyboardDismissMode="none"           // ⭐ 키보드 dismiss 완전 방지
        contentContainerStyle={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 0,
          height: 36,                        // ✅ 고정 높이로 상하 움직임 방지
        }}
        style={{ 
          flex: 1,
          height: 36,                        // ✅ ScrollView 자체도 고정 높이
        }}
      >
        {/* 플러스 버튼 - 가장 먼저 */}
        <ToolbarButton 
          type="icon"
          iconName="plus"
          iconSize={16}
          onPress={() => {
            console.log('🔧 Plus button pressed - show menu');
            // TODO: 플러스 메뉴 구현
          }}
          style={{ marginRight: 12 }}
        />

        {/* 블록 레벨 포맷팅 표시를 제거 - 사용자 혼란 방지 */}
        
        {/* 텍스트 포맷팅 버튼들 */}
        <ToolbarButton 
          title="B" 
          isActive={activeFormats.bold}
          onPress={() => {
            console.log('🚨🚨🚨 BOLD BUTTON CLICKED 🚨🚨🚨');
            toggleBold();
          }}
          style={{ marginRight: 8 }}
        />
        
        <ToolbarButton 
          title="I" 
          isActive={activeFormats.italic}
          onPress={() => {
            console.log('🚨🚨🚨 ITALIC BUTTON CLICKED 🚨🚨🚨');
            toggleItalic();
          }}
          style={{ marginRight: 8 }}
        />
        
        <ToolbarButton 
          title="H1" 
          isActive={activeFormats.heading1}
          onPress={() => {
            console.log('🚨🚨🚨 H1 BUTTON CLICKED 🚨🚨🚨');
            console.log('🔧 Current activeFormats:', activeFormats);
            console.log('🔧 Current focusedIndex:', focusedIndex);
            console.log('🔧 Calling toggleHeading1...');
            toggleHeading1();
            console.log('🔧 toggleHeading1 called');
          }}
          style={{ marginRight: 8 }}
        />
        
        <ToolbarButton 
          title="H2" 
          isActive={activeFormats.heading2}
          onPress={() => {
            console.log('🚨🚨🚨 H2 BUTTON CLICKED 🚨🚨🚨');
            toggleHeading2();
          }}
          style={{ marginRight: 8 }}
        />
        
        <ToolbarButton 
          title="H3" 
          isActive={activeFormats.heading3}
          onPress={() => {
            console.log('🚨🚨🚨 H3 BUTTON CLICKED 🚨🚨🚨');
            console.log('🔧 Unified toolbar: H3 format');
            toggleHeading3();
          }}
          style={{ marginRight: 12 }}
        />
        
        {/* 구분선 */}
        <View style={{ width: 1, height: 24, backgroundColor: '#E0E0E0', marginRight: 12 }} />
        
        {/* 블록 추가 버튼들 */}
        <ToolbarButton 
          type="icon"
          iconName="square"
          onPress={() => {
            console.log('🔧 Unified toolbar: Add CARD button pressed');
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
            console.log('🔧 Unified toolbar: Add GRID button pressed');
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
            console.log('🚨 IMAGE BUTTON CLICKED 🚨');
            if (activeScreenHandlers?.handleAddImage) {
              console.log('📱 Calling handleAddImage...');
              activeScreenHandlers.handleAddImage(focusedIndex >= 0 ? focusedIndex : 0).catch(error => {
                console.log('❌ handleAddImage error:', error);
              });
            } else {
              console.log('❌ handleAddImage not available');
            }
          }}
          style={{ marginRight: 8 }}
        />
      </ScrollView>
      
      <TouchableOpacity
        onPress={() => {
          console.log('✅ InputAccessoryView Done button pressed');
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
  );
};

// ✅ 키보드 위 플로팅 툴바 (InputAccessoryView 대신 사용)
export const UnifiedToolbar = () => {
  const { 
    activeScreenHandlers, 
    keyboardVisible, 
    keyboardHeight, // Animated 값
    keyboardHeightValue, // 실제 높이 값
    toolbarTranslateY // 툴바 transform 애니메이션 값
  } = useSimpleToolbar();
  
  const insets = useSafeAreaInsets();
  
  console.log('🔧 UnifiedToolbar render:');
  console.log('  - keyboardVisible:', keyboardVisible);
  console.log('  - keyboardHeightValue:', keyboardHeightValue);
  console.log('  - safeAreaInsets.bottom:', insets.bottom);
  console.log('  - activeScreenHandlers:', !!activeScreenHandlers);
  
  // 핸들러가 없으면 숨김 (키보드 상태와 관계없이 항상 렌더링)
  if (!activeScreenHandlers) {
    return null;
  }
  
  // 키보드가 없을 때는 화면 아래(보이지 않는 곳)에 위치시킴
  const bottomPosition = keyboardHeightValue > 0 
    ? keyboardHeightValue - insets.bottom  // 키보드 위에 위치
    : -48; // 키보드 없을 때는 화면 아래로 완전히 숨김
  
  return (
    <Animated.View 
      style={{
        position: 'absolute',
        bottom: bottomPosition, // 계산된 위치
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        height: 48,
        zIndex: 1000,
        // ✅ transform으로 아래에서 올라오는 애니메이션 구현
        transform: [{ translateY: toolbarTranslateY }],
      }}
    >
      <UnifiedToolbarContent />
    </Animated.View>
  );
};