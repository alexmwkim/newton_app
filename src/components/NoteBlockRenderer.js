import React, { useRef } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { createNoteStyles } from '../styles/CreateNoteStyles';
import { useFormatting } from './toolbar/ToolbarFormatting';
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
  toolbarId = 'newton-toolbar'
}) => {
  const styles = createNoteStyles;
  const blockRef = useRef(null);
  const { getDynamicTextStyle, setCurrentFocusedIndex, resetFormatsIfTextEmpty } = useFormatting();
  
  // Rendering block



  // Simplified: Remove complex drag-and-drop systems that interfere with cursor positioning

  if (block.type === 'text') {
    return (
      <View key={block.id} ref={blockRef}>
        <TextInput
          key={`text-${block.id}`} // Stable key prevents recreation
          ref={block.ref}
          style={[
            styles.textInput,
            getDynamicTextStyle(index, block),
            {
              // Industry-standard cursor positioning fix
              textAlignVertical: 'top',
              // Dynamic height adjustment for different text styles
              minHeight: getDynamicTextStyle(index, block).fontSize 
                ? Math.max(32, getDynamicTextStyle(index, block).fontSize + 8) 
                : 32,
            }
          ]}
          multiline={false} // Single-line blocks (industry standard)
          placeholder=" "
          value={block.content}
          onChangeText={(text) => {
            handleTextChange(block.id, text);
            // 텍스트가 비어있으면 포맷 초기화
            resetFormatsIfTextEmpty(index, text);
          }}
          onPressIn={() => {
            // Text block pressed
            dismissMenus();
          }}
          onFocus={() => {
            dismissMenus();
            setFocusedIndex(index);
            setCurrentFocusedIndex(index, blocks); // Pass blocks for format loading
            // Text block focused
            
            // Industry standard: no auto-scroll for existing focus
            if (keyboardVisible && keyboardHeight > 0) {
              // Keyboard already visible - no auto-scroll needed
            }
          }}
          onSubmitEditing={() => {
            // Enter pressed - creating new block
            handleKeyPress(block, index, 'Enter');
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key !== 'Enter') {
              handleKeyPress(block, index, nativeEvent.key);
            }
          }}
          returnKeyType="next"
          blurOnSubmit={false}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
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
  } else if (block.type === 'grid-card') {
    return (
      <View key={block.id} ref={blockRef} style={styles.gridCardBlock}>
        <View style={styles.gridCardHeader}>
          <TextInput
            ref={block.ref}
            style={styles.gridCardTitleInput}
            placeholder="Small note"
            multiline
            defaultValue={block.content}
            onChangeText={(text) => handleTextChange(block.id, text)}
            onPressIn={() => {
              console.log('🎯 Grid card block pressed, index:', index);
              dismissMenus();
            }}
            onFocus={() => {
              dismissMenus();
              setFocusedIndex(index);
            }}
            onKeyPress={({ nativeEvent }) => {
              handleKeyPress(block, index, nativeEvent.key);
            }}
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            scrollEnabled={false}
            editable={isAuthor}
            placeholderTextColor={Colors.secondaryText}
            // ✅ 원래 InputAccessoryView 툴바 연결
            // inputAccessoryViewID 제거 (플로팅 툴바 사용)
            {...(Platform.OS === 'android' && useGlobalKeyboard ? { showSoftInputOnFocus: false } : {})}
          />
          {isAuthor && (
            <TouchableOpacity onPress={() => handleDeleteBlock(index)}>
              <Icon name="x" size={16} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>
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