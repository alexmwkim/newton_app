/**
 * 🎨 통합 툴바 컴포넌트 - 모든 화면에서 재사용 가능
 * 
 * 특징:
 * 1. 화면별 자동 구성
 * 2. 반응형 레이아웃
 * 3. 테마 시스템 지원
 * 4. A11y 지원 준비
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useToolbarSystem, TextFormatStrategies, ToolbarConfig } from '../ToolbarSystem';
import Colors from '../../../constants/Colors';

// =============================================================================
// 🎨 THEME SYSTEM
// =============================================================================

const ToolbarTheme = {
  default: {
    container: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E5E5',
      paddingHorizontal: 16,
      paddingVertical: 8,
      height: 44,
    },
    button: {
      padding: 6,
      borderRadius: 4,
      backgroundColor: '#F0F0F0',
      minWidth: 32,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonActive: {
      backgroundColor: Colors.floatingButton || '#EB754B',
    },
    text: {
      fontSize: 14,
      color: '#333',
    },
    textActive: {
      color: '#FFF',
    },
    separator: {
      width: 1,
      height: 24,
      backgroundColor: '#E0E0E0',
      marginHorizontal: 4,
    }
  }
};

// =============================================================================
// 🔘 TOOLBAR BUTTON COMPONENTS
// =============================================================================

/**
 * 텍스트 포맷팅 버튼
 */
const TextFormatButton = ({ formatType, isActive, onPress, theme }) => {
  const strategy = TextFormatStrategies[formatType];
  if (!strategy) return null;

  const { icon, style } = strategy.display;

  return (
    <TouchableOpacity
      onPress={() => onPress(formatType)}
      style={[
        theme.button,
        isActive && theme.buttonActive
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Apply ${formatType} format`}
    >
      <Text style={[
        theme.text,
        style,
        isActive && theme.textActive
      ]}>
        {icon}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * 블록 삽입 버튼
 */
const BlockInsertButton = ({ blockType, onPress, theme }) => {
  const icons = {
    card: 'square',
    image: 'image',
    list: 'list',
    checklist: 'check-square'
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(blockType)}
      style={theme.button}
      accessibilityRole="button"
      accessibilityLabel={`Insert ${blockType} block`}
    >
      <Icon 
        name={icons[blockType] || 'plus'} 
        size={18} 
        color={theme.text.color}
      />
    </TouchableOpacity>
  );
};

/**
 * 구분선
 */
const Separator = ({ theme }) => (
  <View style={theme.separator} />
);

// =============================================================================
// 🎛️ MAIN TOOLBAR COMPONENT
// =============================================================================

/**
 * 통합 툴바 컴포넌트
 */
export const UnifiedToolbar = ({ 
  position = 'floating', // 'floating' | 'fixed' | 'inline'
  theme = 'default',
  screenId = null,
  customConfig = null,
  onDone = null
}) => {
  const {
    activeScreen,
    focusedBlockIndex,
    isAuthor,
    keyboardVisible,
    keyboardHeight,
    executeTextFormat,
    executeBlockInsert
  } = useToolbarSystem();

  const currentTheme = ToolbarTheme[theme];
  
  // 화면별 구성 가져오기
  const config = useMemo(() => {
    if (customConfig) return customConfig;
    
    const screenConfig = ToolbarConfig.screenConfigs[screenId || activeScreen];
    return screenConfig || {
      textFormats: ToolbarConfig.textFormats,
      blockInserts: ToolbarConfig.blockInserts
    };
  }, [customConfig, screenId, activeScreen]);

  // 플로팅 툴바는 키보드가 있을 때만 표시
  if (position === 'floating' && (!keyboardVisible || !isAuthor)) {
    return null;
  }

  // 컨테이너 스타일 계산
  const containerStyle = useMemo(() => {
    const base = currentTheme.container;
    
    if (position === 'floating') {
      return {
        ...base,
        position: 'absolute',
        bottom: keyboardHeight,
        left: 0,
        right: 0,
        zIndex: 1000,
      };
    }
    
    return base;
  }, [currentTheme, position, keyboardHeight]);

  // 현재 블록 상태 분석 (포맷 활성 상태 확인용)
  const activeFormats = useMemo(() => {
    // TODO: 실제 블록 내용을 분석해서 활성 포맷 반환
    return new Set();
  }, [focusedBlockIndex]);

  return (
    <View style={containerStyle}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 8 
        }}
      >
        {/* 텍스트 포맷팅 버튼들 */}
        {config.textFormats?.map((formatType) => (
          <TextFormatButton
            key={formatType}
            formatType={formatType}
            isActive={activeFormats.has(formatType)}
            onPress={executeTextFormat}
            theme={currentTheme}
          />
        ))}
        
        {/* 구분선 */}
        {config.textFormats?.length > 0 && config.blockInserts?.length > 0 && (
          <Separator theme={currentTheme} />
        )}
        
        {/* 블록 삽입 버튼들 */}
        {config.blockInserts?.map((blockType) => (
          <BlockInsertButton
            key={blockType}
            blockType={blockType}
            onPress={executeBlockInsert}
            theme={currentTheme}
          />
        ))}
        
        {/* Done 버튼 (플로팅 툴바에서만) */}
        {position === 'floating' && onDone && (
          <>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={onDone}
              style={{
                ...currentTheme.button,
                backgroundColor: Colors.floatingButton || '#EB754B',
                minWidth: 60,
                paddingHorizontal: 12,
              }}
              accessibilityRole="button"
              accessibilityLabel="Done editing"
            >
              <Text style={[
                currentTheme.text,
                { color: '#FFF', fontWeight: 'bold' }
              ]}>
                Done
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

// =============================================================================
// 🎯 PRESET CONFIGURATIONS
// =============================================================================

/**
 * 노트 상세 화면용 툴바
 */
export const NoteDetailToolbar = (props) => (
  <UnifiedToolbar
    {...props}
    screenId="note-detail"
    position="floating"
    onDone={() => {
      console.log('🔧 Note detail toolbar: Done pressed');
      // 키보드 숨기기 로직
    }}
  />
);

/**
 * 노트 생성 화면용 툴바
 */
export const NoteCreateToolbar = (props) => (
  <UnifiedToolbar
    {...props}
    screenId="note-create"
    position="floating"
  />
);

export default UnifiedToolbar;