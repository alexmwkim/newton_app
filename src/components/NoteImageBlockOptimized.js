import React, { useCallback } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { createNoteStyles } from '../styles/CreateNoteStyles';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useBlockLayout } from '../hooks/useBlockLayout';

const NoteImageBlock = React.memo(({
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
  handleDeleteBlock,
  isAuthor = true,
  dismissMenus = () => {}
}) => {
  const styles = createNoteStyles;
  
  // 🔧 디버그 모드 (개발 시에만 true로 설정)
  const DEBUG_DRAG = false;

  // 블록 레이아웃 관리
  const { blockRef, handleLayout } = useBlockLayout({
    blockId: block.id,
    setCardLayouts,
    DEBUG_LAYOUT: DEBUG_DRAG
  });

  // 드래그 앤 드롭 기능
  const { panResponder, isDragging, isHovered } = useDragAndDrop({
    blockId: block.id,
    blockType: 'image',
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

  // 삭제 핸들러 최적화
  const handleDeleteButtonPress = useCallback(() => {
    handleDeleteBlock(index);
  }, [handleDeleteBlock, index]);

  return (
    <View
      ref={blockRef}
      {...panResponder.panHandlers}
      onLayout={handleLayout}
      style={[
        styles.imageBlock,
        isDragging && styles.cardDragging,
        isHovered && styles.cardHovered,
      ]}
    >
      <Image 
        source={{ uri: block.content }} 
        style={styles.image}
        resizeMode="cover"
      />
      {isAuthor && (
        <TouchableOpacity 
          style={styles.deleteImageBtn} 
          onPress={handleDeleteButtonPress}
        >
          <Icon name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
});

// displayName 설정으로 디버깅 개선
NoteImageBlock.displayName = 'NoteImageBlock';

export default NoteImageBlock;