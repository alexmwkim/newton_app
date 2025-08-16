import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../constants/Colors';
import { createNoteStyles } from '../styles/CreateNoteStyles';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useBlockLayout } from '../hooks/useBlockLayout';

const NoteCardBlock = React.memo(({
  block,
  index,
  blocks,
  setBlocks,
  draggingBlockId,
  setDraggingBlockId,
  hoveredBlockId,
  setHoveredBlockId,
  cardLayouts,
  setCardLayouts,
  handleTextChange,
  handleDeleteBlock,
  handleKeyPress,
  setFocusedIndex,
  keyboardVisible,
  keyboardHeight,
  scrollToFocusedInput,
  isAuthor = true,
  dismissMenus = () => {},
  preventNextAutoScroll = () => {},
  toolbarId = 'newton-toolbar'
}) => {
  const styles = createNoteStyles;
  
  // 🔧 디버그 모드 (개발 시에만 true로 설정)
  const DEBUG_DRAG = false;
  
  // 블록 레이아웃 관리
  const { blockRef, handleLayout, handleContentSizeChange } = useBlockLayout({
    blockId: block.id,
    setCardLayouts,
    DEBUG_LAYOUT: DEBUG_DRAG
  });

  // 드래그 앤 드롭 기능
  const { panResponder, isDragging, isHovered } = useDragAndDrop({
    blockId: block.id,
    blockType: 'card',
    blocks,
    setBlocks,
    cardLayouts,
    setCardLayouts,
    draggingBlockId,
    setDraggingBlockId,
    hoveredBlockId,
    setHoveredBlockId,
    DEBUG_DRAG
  });

  // Get layout style for card positioning
  const layoutMode = block.layoutMode || 'full';
  const getCardLayoutStyle = useCallback((layoutMode) => {
    switch (layoutMode) {
      case 'grid-left':
        return { width: '48%', alignSelf: 'flex-start' };
      case 'grid-right':
        return { width: '48%', alignSelf: 'flex-end' };
      case 'full':
      default:
        return { width: '100%', alignSelf: 'stretch' };
    }
  }, []);
  
  const layoutStyle = getCardLayoutStyle(layoutMode);

  // 텍스트 변경 핸들러 최적화
  const optimizedHandleTextChange = useCallback((text) => {
    handleTextChange(block.id, text);
  }, [handleTextChange, block.id]);

  // 포커스 핸들러 최적화
  const handleTextInputFocus = useCallback(() => {
    DEBUG_DRAG && console.log(`🔧 Card TextInput focused - block: ${block.id}, index: ${index}`);
    dismissMenus();
    setFocusedIndex(index);
  }, [dismissMenus, setFocusedIndex, index, block.id, DEBUG_DRAG]);

  // 키 프레스 핸들러 최적화
  const handleTextInputKeyPress = useCallback(({ nativeEvent }) => {
    handleKeyPress(block, index, nativeEvent.key);
  }, [handleKeyPress, block, index]);

  // 삭제 핸들러 최적화
  const handleDeleteButtonPress = useCallback(() => {
    handleDeleteBlock(index);
  }, [handleDeleteBlock, index]);

  // PressIn 핸들러 최적화
  const handleTextInputPressIn = useCallback(() => {
    DEBUG_DRAG && console.log('🎯 TextInput pressed in card:', block.id);
    dismissMenus();
  }, [dismissMenus, block.id, DEBUG_DRAG]);

  return (
    <View
      ref={blockRef}
      {...panResponder.panHandlers}
      onLayout={handleLayout}
      onTouchStart={(e) => {
        DEBUG_DRAG && console.log(`🎯 Card TOUCH START: ${block.id}`);
      }}
      style={[
        styles.cardBlock,
        layoutStyle,
        isDragging && styles.cardDragging,
        isHovered && styles.cardHovered,
      ]}
    >
      <View style={styles.cardHeader}>
        <TextInput
          ref={block.ref}
          style={styles.cardTitleInput}
          placeholder="Write something"
          multiline
          value={block.content}
          onChangeText={optimizedHandleTextChange}
          onPressIn={handleTextInputPressIn}
          onFocus={handleTextInputFocus}
          onKeyPress={handleTextInputKeyPress}
          onContentSizeChange={handleContentSizeChange}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          scrollEnabled={false}
          editable={isAuthor && !isDragging}
          inputAccessoryViewID={toolbarId}
          placeholderTextColor={Colors.secondaryText}
        />
        {isAuthor && (
          <TouchableOpacity onPress={handleDeleteButtonPress}>
            <Icon name="x" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Layout mode indicator */}
      {layoutMode !== 'full' && (
        <View style={styles.layoutModeIndicator}>
          <Text style={styles.layoutModeText}>
            {layoutMode === 'grid-left' ? '← Grid' : 'Grid →'}
          </Text>
        </View>
      )}
    </View>
  );
});

// displayName 설정으로 디버깅 개선
NoteCardBlock.displayName = 'NoteCardBlock';

export default NoteCardBlock;