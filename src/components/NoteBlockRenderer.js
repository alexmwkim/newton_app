import React, { useRef } from 'react';
import { View, TextInput, Platform, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../constants/Colors';
import { createNoteStyles } from '../styles/CreateNoteStyles';
import { useFormatting } from './toolbar/ToolbarFormatting';
import { useSimpleToolbar } from '../contexts/SimpleToolbarContext';
import NoteCardBlock from './NoteCardBlock';
import NoteImageBlock from './NoteImageBlock';

const NoteBlockRenderer = React.memo(({
  block,
  index,
  blocks = [],
  setBlocks = () => {},
  handleTextChange,
  setFocusedIndex,
  keyboardVisible,
  keyboardHeight,
  scrollToFocusedInput,
  handleKeyPress,
  handleDeleteBlock,
  isAuthor = true,
  dismissMenus = () => {},
  useGlobalKeyboard = false,
  // Simplified props - removed complex drag/drop systems
  cardLayouts = {},
  setCardLayouts = () => {},
  hoveredBlockId = null,
  setHoveredBlockId = () => {},
  draggingBlockId = null,
  setDraggingBlockId = () => {},
  toolbarId = 'newton-toolbar',
  setIsRefocusFromDropdown = () => {} // 드롭다운 플래그 초기화 함수
}) => {
  const styles = createNoteStyles;
  const blockRef = useRef(null);
  // ✅ Re-import useFormatting for toolbar synchronization only
  const { setActiveFormats, activeFormats } = useFormatting();
  
  // ✅ Import useSimpleToolbar to get current focusedIndex
  const { focusedIndex: globalFocusedIndex } = useSimpleToolbar();
  
  // ✅ Simple format styling function with live activeFormats support
  const getSimpleTextStyle = (block, blockIndex) => {
    // 포커스된 블록은 activeFormats 우선 사용 (실시간 반영)
    const isFocused = blockIndex === globalFocusedIndex; // Global focusedIndex 사용
    const formats = isFocused ? activeFormats : block.savedFormats;
    
    // 🎨 getSimpleTextStyle formatting applied
    
    if (!formats) {
      return {}; // No formatting
    }
    
    let style = {};
    
    // Apply heading styles first (they override others)
    if (formats.heading1) {
      style = { fontSize: 28, fontWeight: 'bold', lineHeight: 34 };
    } else if (formats.heading2) {
      style = { fontSize: 24, fontWeight: 'bold', lineHeight: 30 };
    } else if (formats.heading3) {
      style = { fontSize: 20, fontWeight: 'bold', lineHeight: 26 };
    } else {
      // Apply text formatting
      if (formats.bold && formats.italic) {
        style = { fontWeight: 'bold', fontStyle: 'italic' };
      } else if (formats.bold) {
        style = { fontWeight: 'bold' };
      } else if (formats.italic) {
        style = { fontStyle: 'italic' };
      }
    }
    
    return style;
  };
  
  // Rendering block



  // Simplified: Remove complex drag-and-drop systems that interfere with cursor positioning

  if (block.type === 'text') {
    return (
      <View key={block.id} ref={blockRef} style={{marginVertical: 0, paddingVertical: 0}}>
        <TextInput
          key={`text-${block.id}`} // 🔧 FIX: 안정적인 key로 포커스 유지
          ref={block.ref}
          style={[
            styles.textInput,
            getSimpleTextStyle(block, index), // Apply simple format styling with focus support
            {
              // Industry-standard cursor positioning fix
              textAlignVertical: 'top',
              // 🔧 FIX: 일관된 간격을 위해 고정된 minHeight 사용
              minHeight: 28, // lineHeight와 일치
            }
          ]}
          multiline={true} // 🔧 FIX: 화면 너비에서 자동 줄바꿈 허용
          placeholder=" "
          value={block.content}
          onChangeText={(text) => {
            // 🔧 FIX: multiline에서 Enter 키로 인한 줄바꿈 제거 - 블록 시스템 보호
            const cleanText = text.replace(/\n/g, '');
            handleTextChange(block.id, cleanText);
            // Simple text handling without complex formatting
          }}
          onPressIn={() => {
            dismissMenus();
            setIsRefocusFromDropdown(false);
          }}
          onFocus={() => {
            dismissMenus();
            setFocusedIndex(index);
            
            // 🔧 툴바에 현재 블록의 저장된 포맷 동기화
            if (block.savedFormats) {
              setActiveFormats(block.savedFormats);
            } else {
              setActiveFormats({
                bold: false,
                italic: false,
                heading1: false,
                heading2: false,
                heading3: false
              });
            }
            
            // 🔧 사용자 직접 포커스 시 드롭다운 플래그 초기화
            setIsRefocusFromDropdown(false);
          }}
          onKeyPress={({ nativeEvent }) => {
            // 🔧 FIX: multiline에서 Enter 키 처리 통합
            handleKeyPress(block, index, nativeEvent.key);
          }}
          returnKeyType="next"
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none" // 🔧 FIX: 자동 대문자 변환 비활성화로 키보드 움직임 방지
          scrollEnabled={false}
          editable={isAuthor}
          // Platform-specific optimizations
          {...(Platform.OS === 'android' ? {
            textAlignVertical: 'top',
            includeFontPadding: false
          } : {})}
          {...(useGlobalKeyboard && Platform.OS === 'android' ? {
            showSoftInputOnFocus: false
          } : {})}
          // ✅ 원래 InputAccessoryView 툴바 연결
          // inputAccessoryViewID 제거 (플로팅 툴바 사용)
        />
      </View>
    );
  } else if (block.type === 'card') {
    
    return (
      <NoteCardBlock
        key={block.id}
        block={block}
        index={index}
        blocks={blocks}
        setBlocks={setBlocks || (() => {})} // Provide fallback
        draggingBlockId={draggingBlockId}
        setDraggingBlockId={setDraggingBlockId}
        hoveredBlockId={hoveredBlockId}
        setHoveredBlockId={setHoveredBlockId}
        cardLayouts={cardLayouts}
        setCardLayouts={setCardLayouts}
        handleTextChange={handleTextChange}
        handleDeleteBlock={handleDeleteBlock}
        handleKeyPress={handleKeyPress}
        setFocusedIndex={setFocusedIndex}
        keyboardVisible={keyboardVisible}
        keyboardHeight={keyboardHeight}
        scrollToFocusedInput={scrollToFocusedInput}
        isAuthor={isAuthor}
        dismissMenus={dismissMenus}
        toolbarId={toolbarId}
        useGlobalKeyboard={useGlobalKeyboard}
      />
    );
  } else if (block.type === 'image') {
    
    return (
      <NoteImageBlock
        key={block.id}
        block={block}
        index={index}
        blocks={blocks}
        setBlocks={setBlocks || (() => {})}
        draggingBlockId={draggingBlockId}
        setDraggingBlockId={setDraggingBlockId}
        hoveredBlockId={hoveredBlockId}
        setHoveredBlockId={setHoveredBlockId}
        cardLayouts={cardLayouts}
        setCardLayouts={setCardLayouts}
        handleDeleteBlock={handleDeleteBlock}
        isAuthor={isAuthor}
        dismissMenus={dismissMenus}
      />
    );
  }
  
  return null;
});

export { NoteBlockRenderer };