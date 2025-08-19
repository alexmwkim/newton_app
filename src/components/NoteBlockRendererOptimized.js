import React, { useCallback, useRef } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import { GLOBAL_TOOLBAR_ID } from '../constants/Toolbar';
import { createNoteStyles } from '../styles/CreateNoteStyles';
import NoteCardBlockOptimized from './NoteCardBlockOptimized';
import NoteImageBlockOptimized from './NoteImageBlockOptimized';
import { useBlockLayout } from '../hooks/useBlockLayout';

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
  // Drag and drop props
  draggingBlockId = null,
  hoveredBlockId = null,
  setDraggingBlockId = () => {},
  setHoveredBlockId = () => {},
  cardLayouts = {},
  setCardLayouts = () => {},
  isAuthor = true,
  dismissMenus = () => {},
  preventNextAutoScroll = () => {}
}) => {
  const styles = createNoteStyles;

  // 텍스트 블록 최적화된 핸들러들
  const optimizedHandleTextChange = useCallback((text) => {
    handleTextChange(block.id, text);
  }, [handleTextChange, block.id]);

  const handleTextInputFocus = useCallback(() => {
    console.log('🔧 Text block focused - index:', index, 'type:', block.type, 'toolbarId:', GLOBAL_TOOLBAR_ID);
    dismissMenus();
    setFocusedIndex(index);
  }, [dismissMenus, setFocusedIndex, index, block.type]);

  const handleTextInputKeyPress = useCallback(({ nativeEvent }) => {
    handleKeyPress(block, index, nativeEvent.key);
  }, [handleKeyPress, block, index]);

  const handleTextInputPressIn = useCallback(() => {
    console.log('🎯 Text block pressed, index:', index);
    dismissMenus();
  }, [dismissMenus, index]);

  const handleDeleteButtonPress = useCallback(() => {
    handleDeleteBlock(index);
  }, [handleDeleteBlock, index]);

  // 그리드 카드 최적화된 핸들러들
  const handleGridCardFocus = useCallback(() => {
    console.log('🎯 Grid card block focused, index:', index, 'type:', block.type);
    dismissMenus();
    setFocusedIndex(index);
  }, [dismissMenus, setFocusedIndex, index, block.type]);

  const handleGridCardPressIn = useCallback(() => {
    console.log('🎯 Grid card block pressed, index:', index);
    dismissMenus();
  }, [dismissMenus, index]);

  // 레이아웃 관리 (텍스트 블록용)
  const { blockRef, handleLayout, handleContentSizeChange } = useBlockLayout({
    blockId: block.id,
    setCardLayouts,
    DEBUG_LAYOUT: false
  });

  if (block.type === 'text') {
    return (
      <View
        key={block.id}
        ref={blockRef}
        onLayout={handleLayout}
      >
        <TextInput
          ref={block.ref}
          style={styles.textInput}
          multiline
          placeholder=" "
          value={block.content}
          onChangeText={optimizedHandleTextChange}
          onPressIn={handleTextInputPressIn}
          onFocus={handleTextInputFocus}
          onKeyPress={handleTextInputKeyPress}
          onContentSizeChange={handleContentSizeChange}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          textAlignVertical="top"
          scrollEnabled={false}
          editable={isAuthor}
          inputAccessoryViewID={GLOBAL_TOOLBAR_ID}
        />
      </View>
    );
  } 
  
  if (block.type === 'card') {
    return (
      <NoteCardBlockOptimized
        key={block.id}
        block={block}
        index={index}
        blocks={blocks}
        setBlocks={setBlocks}
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
        preventNextAutoScroll={preventNextAutoScroll}
        toolbarId={GLOBAL_TOOLBAR_ID}
      />
    );
  } 
  
  if (block.type === 'grid-card') {
    return (
      <View key={block.id} ref={blockRef} style={styles.gridCardBlock}>
        <View style={styles.gridCardHeader}>
          <TextInput
            ref={block.ref}
            style={styles.gridCardTitleInput}
            placeholder="Small note"
            multiline
            value={block.content}
            onChangeText={optimizedHandleTextChange}
            onPressIn={handleGridCardPressIn}
            onFocus={handleGridCardFocus}
            onKeyPress={handleTextInputKeyPress}
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            scrollEnabled={false}
            editable={isAuthor}
            inputAccessoryViewID={GLOBAL_TOOLBAR_ID}
            placeholderTextColor={Colors.secondaryText}
          />
          {isAuthor && (
            <TouchableOpacity onPress={handleDeleteButtonPress}>
              <Icon name="x" size={16} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  } 
  
  if (block.type === 'image') {
    return (
      <NoteImageBlockOptimized
        key={block.id}
        block={block}
        index={index}
        blocks={blocks}
        setBlocks={setBlocks}
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

// displayName 설정으로 디버깅 개선
NoteBlockRenderer.displayName = 'NoteBlockRenderer';

export { NoteBlockRenderer as NoteBlockRendererOptimized };