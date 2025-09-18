import React from 'react';
import { View, TouchableOpacity, Text, ScrollView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useSimpleToolbar } from '../../contexts/SimpleToolbarContext';
import { useFormatting } from './ToolbarFormatting';
import { ToolbarButton } from './ToolbarButton';
import { DROPDOWN_TYPES } from '../../constants/DropdownConfig';

// ✅ InputAccessoryView에서 사용할 툴바 컨텐츠 (위치 고정 없음)
export const UnifiedToolbarContent = React.memo(() => {
  const { 
    activeScreenHandlers, 
    focusedIndex, 
    hideKeyboard,
    activeDropdown,
    toggleDropdown
  } = useSimpleToolbar();
  
  const { 
    activeFormats, 
    toggleBold, 
    toggleItalic, 
    toggleHeading1, 
    toggleHeading2, 
    toggleHeading3 
  } = useFormatting();
  
  // InputAccessoryView에서는 항상 표시 (키보드와 동기화됨)
  if (!activeScreenHandlers) {
    console.log('🚨🚨🚨 TOOLBAR NOT RENDERED: activeScreenHandlers is falsy!');
    return null;
  }
  
  return (
    <View 
      style={{
        // ✅ 플로팅 툴바용 스타일 (높이 제한 없음)
        backgroundColor: '#FFFFFF', // ✅ 완전 불투명 흰색 배경
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 0, // 외부 컨테이너에서 패딩 처리
        paddingVertical: 0,
        flex: 1,
        opacity: 1, // ✅ 완전히 불투명하게 설정
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
        pointerEvents="auto"                 // ✅ 터치 이벤트 통과 허용
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
          isActive={activeDropdown === DROPDOWN_TYPES.PURPOSE}
          onPress={() => {
            console.log('🎯 Plus button clicked! Current dropdown:', activeDropdown);
            toggleDropdown(DROPDOWN_TYPES.PURPOSE);
            console.log('🎯 Toggle called for PURPOSE');
          }}
          style={{ marginRight: 12 }}
        />

        {/* 블록 레벨 포맷팅 표시를 제거 - 사용자 혼란 방지 */}
        
        {/* 텍스트 포맷팅 버튼들 */}
        <ToolbarButton 
          title="B" 
          isActive={activeFormats.bold}
          onPress={toggleBold}
          style={{ marginRight: 8 }}
        />
        
        <ToolbarButton 
          title="I" 
          isActive={activeFormats.italic}
          onPress={toggleItalic}
          style={{ marginRight: 8 }}
        />
        
        <ToolbarButton 
          title="H1" 
          isActive={activeFormats.heading1}
          onPress={toggleHeading1}
          style={{ marginRight: 8 }}
        />
        
        <ToolbarButton 
          title="H2" 
          isActive={activeFormats.heading2}
          onPress={toggleHeading2}
          style={{ marginRight: 8 }}
        />
        
        <ToolbarButton 
          title="H3" 
          isActive={activeFormats.heading3}
          onPress={toggleHeading3}
          style={{ marginRight: 12 }}
        />
        
        {/* 구분선 */}
        <View style={{ width: 1, height: 24, backgroundColor: '#E0E0E0', marginRight: 12 }} />
        
        {/* 블록 추가 버튼들 */}
        <ToolbarButton 
          type="icon"
          iconName="square"
          onPress={() => {
            if (activeScreenHandlers?.handleAddCard) {
              activeScreenHandlers.handleAddCard(focusedIndex >= 0 ? focusedIndex : 0);
            }
          }}
          style={{ marginRight: 8 }}
        />
        
        
        <ToolbarButton 
          type="icon"
          iconName="image"
          onPress={() => {
            if (activeScreenHandlers?.handleAddImage) {
              activeScreenHandlers.handleAddImage(focusedIndex >= 0 ? focusedIndex : 0).catch(error => {
                console.error('handleAddImage error:', error);
              });
            }
          }}
          style={{ marginRight: 8 }}
        />
      </ScrollView>
      
      <TouchableOpacity
        onPress={() => {
          console.log('🔧 Done button pressed - calling hideKeyboard');
          hideKeyboard();
        }}
        style={{
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#D0D0D0',
          paddingHorizontal: 7, // 1px 줄여서 테두리 공간 확보
          paddingVertical: 0, 
          borderRadius: 6,
          minWidth: 34, // 2px 줄여서 전체 크기 동일하게
          height: 34, // 2px 줄여서 전체 크기 동일하게
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row', 
          marginLeft: 8,
          marginTop: 1, // 중앙 정렬 보정
        }}
        activeOpacity={0.8}
      >
        <Icon 
          name="chevrons-down" 
          size={16} 
          color="#666666" 
        />
      </TouchableOpacity>
    </View>
  );
});

// ✅ 키보드 위 플로팅 툴바 (InputAccessoryView 대신 사용)
export const UnifiedToolbar = React.memo(() => {
  const { 
    activeScreenHandlers, 
    keyboardVisible, 
    keyboardHeight, // Animated 값
    keyboardHeightValue, // 실제 높이 값
    toolbarTranslateY, // 툴바 transform 애니메이션 값
    activeDropdown, // 드롭다운 상태도 함께 가져오기
    dropdownHeight, // 드롭다운 높이
    userHasInteracted // ✅ 사용자 인터랙션 상태
  } = useSimpleToolbar();
  
  console.log('🔧 UnifiedToolbar render:', {
    activeScreenHandlers: !!activeScreenHandlers,
    keyboardVisible,
    keyboardHeightValue,
    activeDropdown,
    userHasInteracted
  });
  
  const insets = useSafeAreaInsets();
  
  // 🔧 Notion 방식으로 단순화됨 - 이전 복잡한 로직 제거
  
  // 핸들러가 없으면 숨김
  if (!activeScreenHandlers) {
    return null;
  }
  
  
  // ✅ 안전한 조건: 키보드가 실제로 있거나 드롭다운 활성화시에만
  const hasInputArea = (userHasInteracted && keyboardHeightValue > 0) || activeDropdown !== DROPDOWN_TYPES.NONE;
  const inputAreaHeight = keyboardHeightValue > 0 ? keyboardHeightValue : 300; // 항상 최소 300px 보장  
  const shouldShowToolbar = hasInputArea;
  
  return (
    <>
      {/* ✅ Notion 방식: 입력 영역 배경 (키보드 자리 or 드롭다운 자리) */}
      {shouldShowToolbar && (
        <Animated.View 
          style={{
            position: 'absolute',
            bottom: 0, // 화면 맨 아래부터
            left: 0,
            right: 0,
            height: inputAreaHeight, // 입력 영역 높이 (키보드 or 300px)
            backgroundColor: '#FFFFFF', // ✅ 완전히 불투명한 흰색 배경
            zIndex: 999, // 툴바보다 약간 낮게
          }}
        />
      )}
      
      {/* ✅ 툴바 - 키보드 또는 드롭다운 활성화시에만 표시 */}
      {shouldShowToolbar && (
        <Animated.View 
          style={{
            position: 'absolute',
            bottom: inputAreaHeight, // Notion 방식: 항상 입력 영역 위
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF', // ✅ 완전히 불투명한 흰색 배경
            borderTopWidth: 1,
            borderTopColor: '#E5E5E5',
            paddingHorizontal: 12,
            paddingVertical: 6,
            height: 48,
            zIndex: 1000,
            // ✅ 그림자 추가로 뒤 콘텐츠와 확실히 구분
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8, // Android 그림자
            // ✅ transform으로 아래에서 올라오는 애니메이션 구현
            transform: [{ translateY: toolbarTranslateY }],
          }}
        >
          <UnifiedToolbarContent />
        </Animated.View>
      )}
    </>
  );
});