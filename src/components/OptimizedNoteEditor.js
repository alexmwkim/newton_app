import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  useDragAndDrop, 
  useBlockLayout, 
  useKeyboardAndFocus 
} from '../hooks';
import { 
  NoteCardBlockOptimized,
  NoteImageBlockOptimized,
  NoteBlockRendererOptimized
} from './optimized';
import { 
  createBlock, 
  updateBlockContent, 
  removeBlockAtIndex,
  trackRerenders,
  trackComponentLifecycle 
} from '../utils';
import { createNoteStyles } from '../styles/CreateNoteStyles';
import { GLOBAL_TOOLBAR_ID } from '../constants/Toolbar';

/**
 * 최적화된 노트 에디터 통합 컴포넌트
 * 모든 최적화 기능을 통합하여 보여주는 데모 컴포넌트
 */
const OptimizedNoteEditor = React.memo(({ 
  initialBlocks = [],
  isAuthor = true,
  onBlocksChange = () => {},
  DEBUG_MODE = false 
}) => {
  // 성능 추적 (개발 모드)
  const trackRerender = useMemo(() => trackRerenders('OptimizedNoteEditor'), []);
  trackRerender();
  
  // 기본 상태 관리
  const [blocks, setBlocks] = useState(() => 
    initialBlocks.length > 0 ? initialBlocks : [createBlock('text')]
  );
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [draggingBlockId, setDraggingBlockId] = useState(null);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [cardLayouts, setCardLayouts] = useState({});
  
  const scrollViewRef = useRef(null);
  const styles = createNoteStyles;

  // 키보드 및 포커스 관리
  const {
    keyboardVisible,
    keyboardHeight,
    handleTextInputFocus,
    dismissKeyboard,
    preventNextAutoScroll,
    focusNextBlock,
    focusPreviousBlock,
    handleBlockDeleteWithFocus
  } = useKeyboardAndFocus({
    blocks,
    setBlocks,
    focusedIndex,
    setFocusedIndex,
    scrollToFocusedInput: (index) => {
      // ScrollView 기반 스크롤 로직
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: index * 100, // 대략적인 블록 높이
          animated: true
        });
      }
    },
    DEBUG_FOCUS: DEBUG_MODE
  });

  // 블록 변경 사항을 부모에 전달
  const notifyBlocksChange = useCallback((newBlocks) => {
    onBlocksChange(newBlocks);
  }, [onBlocksChange]);

  // 최적화된 텍스트 변경 핸들러
  const handleTextChange = useCallback((blockId, newContent) => {
    setBlocks(currentBlocks => {
      const updated = currentBlocks.map(block => 
        block.id === blockId 
          ? { ...block, content: newContent }
          : block
      );
      notifyBlocksChange(updated);
      return updated;
    });
  }, [notifyBlocksChange]);

  // 최적화된 블록 삭제 핸들러
  const handleDeleteBlock = useCallback((index) => {
    setBlocks(currentBlocks => {
      const updated = removeBlockAtIndex(currentBlocks, index);
      
      // 빈 배열인 경우 기본 텍스트 블록 추가
      const finalBlocks = updated.length === 0 ? [createBlock('text')] : updated;
      
      notifyBlocksChange(finalBlocks);
      return finalBlocks;
    });
  }, [notifyBlocksChange]);

  // 키 프레스 핸들러 (Enter, Backspace 등)
  const handleKeyPress = useCallback((block, index, key) => {
    if (key === 'Enter') {
      // 새 블록 생성
      const newBlock = createBlock('text');
      setBlocks(currentBlocks => {
        const updated = [...currentBlocks];
        updated.splice(index + 1, 0, newBlock);
        notifyBlocksChange(updated);
        return updated;
      });
      
      // 새 블록으로 포커스 이동
      setTimeout(() => {
        focusNextBlock(index);
      }, 50);
      
    } else if (key === 'Backspace' && !block.content) {
      // 빈 블록에서 백스페이스 시 블록 삭제
      if (blocks.length > 1) {
        handleBlockDeleteWithFocus(index, handleDeleteBlock);
      }
    }
  }, [blocks.length, focusNextBlock, handleBlockDeleteWithFocus, handleDeleteBlock, notifyBlocksChange]);

  // 메뉴 닫기 핸들러
  const dismissMenus = useCallback(() => {
    // 외부 메뉴나 팝오버가 있다면 닫기
    // 현재는 키보드만 처리
    if (DEBUG_MODE) {
      console.log('📱 Dismissing menus');
    }
  }, [DEBUG_MODE]);

  // 최적화된 setBlocks 함수 (ref 연결 유지)
  const optimizedSetBlocks = useCallback((newBlocks) => {
    if (typeof newBlocks === 'function') {
      setBlocks(currentBlocks => {
        const result = newBlocks(currentBlocks);
        // ref 연결 유지
        const updatedWithRefs = result.map(block => ({
          ...block,
          ref: block.ref || React.createRef()
        }));
        notifyBlocksChange(updatedWithRefs);
        return updatedWithRefs;
      });
    } else {
      // ref 연결 유지
      const updatedWithRefs = newBlocks.map(block => ({
        ...block,
        ref: block.ref || React.createRef()
      }));
      setBlocks(updatedWithRefs);
      notifyBlocksChange(updatedWithRefs);
    }
  }, [notifyBlocksChange]);

  // 컴포넌트 생명주기 추적
  const cleanup = useMemo(() => trackComponentLifecycle('OptimizedNoteEditor'), []);
  React.useEffect(() => cleanup, [cleanup]);

  // 렌더링할 블록들을 메모이제이션
  const renderedBlocks = useMemo(() => {
    return blocks.map((block, index) => (
      <NoteBlockRendererOptimized
        key={block.id}
        block={block}
        index={index}
        blocks={blocks}
        setBlocks={optimizedSetBlocks}
        handleTextChange={handleTextChange}
        setFocusedIndex={setFocusedIndex}
        keyboardVisible={keyboardVisible}
        keyboardHeight={keyboardHeight}
        scrollToFocusedInput={() => handleTextInputFocus(index, block.id)}
        handleKeyPress={handleKeyPress}
        handleDeleteBlock={handleDeleteBlock}
        draggingBlockId={draggingBlockId}
        hoveredBlockId={hoveredBlockId}
        setDraggingBlockId={setDraggingBlockId}
        setHoveredBlockId={setHoveredBlockId}
        cardLayouts={cardLayouts}
        setCardLayouts={setCardLayouts}
        isAuthor={isAuthor}
        dismissMenus={dismissMenus}
        preventNextAutoScroll={preventNextAutoScroll}
        toolbarId={GLOBAL_TOOLBAR_ID}
      />
    ));
  }, [
    blocks,
    optimizedSetBlocks,
    handleTextChange,
    setFocusedIndex,
    keyboardVisible,
    keyboardHeight,
    handleTextInputFocus,
    handleKeyPress,
    handleDeleteBlock,
    draggingBlockId,
    hoveredBlockId,
    setDraggingBlockId,
    setHoveredBlockId,
    cardLayouts,
    setCardLayouts,
    isAuthor,
    dismissMenus,
    preventNextAutoScroll
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.blocksContainer}>
          {renderedBlocks}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

// displayName 설정
OptimizedNoteEditor.displayName = 'OptimizedNoteEditor';

export default OptimizedNoteEditor;