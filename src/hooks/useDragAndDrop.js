import { useRef, useCallback, useMemo } from 'react';
import { PanResponder } from 'react-native';

/**
 * 통합된 드래그 앤 드롭 커스텀 훅
 * NoteCardBlock과 NoteImageBlock의 중복 코드를 통합하여 성능 최적화
 */
export const useDragAndDrop = ({
  blockId,
  blockType,
  blocks,
  setBlocks,
  cardLayouts,
  setCardLayouts,
  draggingBlockId,
  setDraggingBlockId,
  hoveredBlockId,
  setHoveredBlockId,
  DEBUG_DRAG = false
}) => {
  // Refs for stable access during drag operations
  const cardLayoutsRef = useRef(cardLayouts);
  const blocksRef = useRef(blocks);
  const setBlocksRef = useRef(setBlocks);
  const setDraggingBlockIdRef = useRef(setDraggingBlockId);
  const setHoveredBlockIdRef = useRef(setHoveredBlockId);
  
  const currentHoverTarget = useRef(null);
  const dropPosition = useRef('after');
  const isDraggingRef = useRef(false);

  // 최적화된 ref 업데이트 - useMemo로 의존성 최소화
  const updateRefs = useCallback(() => {
    cardLayoutsRef.current = cardLayouts;
    blocksRef.current = blocks;
    setBlocksRef.current = setBlocks;
    setDraggingBlockIdRef.current = setDraggingBlockId;
    setHoveredBlockIdRef.current = setHoveredBlockId;
  }, [cardLayouts, blocks, setBlocks, setDraggingBlockId, setHoveredBlockId]);

  // 최종 삽입 인덱스 계산 헬퍼 함수
  const calculateFinalInsertIndex = useCallback((fromIndex, targetIndex, dropPos) => {
    let finalIndex = targetIndex;
    
    if (dropPos === 'before') {
      finalIndex = targetIndex;
    } else if (dropPos === 'after') {
      finalIndex = targetIndex + 1;
    } else { // replace
      finalIndex = targetIndex;
    }
    
    // 앞에서 뒤로 이동할 때 인덱스 조정
    if (fromIndex < finalIndex) {
      finalIndex--;
    }
    
    return Math.max(0, Math.min(finalIndex, blocksRef.current.length - 1));
  }, []);

  // 드롭 타겟 및 위치 계산 함수
  const calculateDropTarget = useCallback((dragY) => {
    const currentCardLayouts = cardLayoutsRef.current;
    
    if (Object.keys(currentCardLayouts).length === 0) {
      return { targetId: null, position: 'after' };
    }

    const sortedBlockEntries = Object.entries(currentCardLayouts)
      .filter(([id]) => id !== blockId)
      .sort(([,a], [,b]) => a.y - b.y);

    if (sortedBlockEntries.length === 0) {
      return { targetId: 'FIRST', position: 'before' };
    }

    const firstBlock = sortedBlockEntries[0];
    const lastBlock = sortedBlockEntries[sortedBlockEntries.length - 1];

    // 첫 번째 블록 위
    if (dragY < firstBlock[1].y - 20) {
      return { targetId: firstBlock[0], position: 'before' };
    }
    
    // 마지막 블록 아래
    if (dragY > lastBlock[1].y + lastBlock[1].height + 20) {
      return { targetId: lastBlock[0], position: 'after' };
    }

    // 가장 가까운 블록 찾기
    let bestMatch = null;
    let bestDistance = Infinity;
    let bestPosition = 'after';

    for (const [id, layout] of sortedBlockEntries) {
      const blockTop = layout.y;
      const blockBottom = layout.y + layout.height;
      const blockCenter = layout.y + layout.height / 2;

      const distanceToTop = Math.abs(dragY - blockTop);
      const distanceToCenter = Math.abs(dragY - blockCenter);
      const distanceToBottom = Math.abs(dragY - blockBottom);

      // 텍스트 블록인지 확인 (replace 불가)
      const targetBlock = blocksRef.current.find(b => b.id === id);
      const isTextBlock = targetBlock?.type === 'text';

      if (distanceToTop < bestDistance) {
        bestMatch = id;
        bestDistance = distanceToTop;
        bestPosition = 'before';
      }

      // 텍스트 블록이 아닌 경우에만 replace 허용
      if (!isTextBlock && distanceToCenter < bestDistance) {
        bestMatch = id;
        bestDistance = distanceToCenter;
        bestPosition = 'replace';
      }

      if (distanceToBottom < bestDistance) {
        bestMatch = id;
        bestDistance = distanceToBottom;
        bestPosition = 'after';
      }
    }

    return { 
      targetId: bestMatch || firstBlock[0], 
      position: bestPosition 
    };
  }, [blockId]);

  // 블록 재정렬 실행 함수
  const executeReorder = useCallback((currentDraggingId, currentHoveredId, currentDropPosition) => {
    if (!currentDraggingId || !currentHoveredId || blocksRef.current.length === 0) {
      DEBUG_DRAG && console.log(`❌ Reorder skipped: dragging=${currentDraggingId}, target=${currentHoveredId}`);
      return;
    }

    const fromIndex = blocksRef.current.findIndex(b => b.id === currentDraggingId);
    const originalTargetIndex = blocksRef.current.findIndex(b => b.id === currentHoveredId);

    if (fromIndex === -1) {
      console.warn(`⚠️ Drag cancelled - block ${currentDraggingId} no longer exists`);
      return;
    }

    if (fromIndex !== -1 && originalTargetIndex !== -1) {
      let finalInsertIndex = 0;

      if (currentHoveredId === 'FIRST') {
        finalInsertIndex = 0;
      } else if (currentHoveredId === 'LAST') {
        finalInsertIndex = blocksRef.current.length - 1;
      } else if (originalTargetIndex !== -1) {
        finalInsertIndex = calculateFinalInsertIndex(fromIndex, originalTargetIndex, currentDropPosition);
      }

      // 실제 배열 재정렬
      const updated = [...blocksRef.current];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(finalInsertIndex, 0, moved);

      DEBUG_DRAG && console.log(`✅ Reordered ${currentDraggingId} from index ${fromIndex} to ${finalInsertIndex}`);
      setBlocksRef.current(updated);
    }
  }, [calculateFinalInsertIndex, DEBUG_DRAG]);

  // PanResponder 생성 - 의존성 최소화
  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const movement = Math.sqrt(dx * dx + dy * dy);
        const hasLayoutData = cardLayoutsRef.current[blockId] !== undefined;
        
        const shouldActivate = hasLayoutData && movement > 5;
        DEBUG_DRAG && console.log(`🎯 Move check for ${blockId}: movement=${movement.toFixed(1)}, hasLayout=${hasLayoutData}`);
        return shouldActivate;
      },

      onPanResponderGrant: () => {
        if (isDraggingRef.current) {
          DEBUG_DRAG && console.log(`🚫 DRAG ALREADY ACTIVE for ${blockId}`);
          return;
        }

        DEBUG_DRAG && console.log(`🚀 DRAG START: ${blockId}`);
        isDraggingRef.current = true;
        setDraggingBlockIdRef.current(blockId);
      },

      onPanResponderMove: (e, gestureState) => {
        updateRefs(); // 최신 상태 동기화
        
        const dragY = e.nativeEvent.pageY;
        const { targetId, position } = calculateDropTarget(dragY);

        currentHoverTarget.current = targetId;
        dropPosition.current = position;

        if (hoveredBlockId !== targetId) {
          setHoveredBlockIdRef.current(targetId);
        }
      },

      onPanResponderRelease: () => {
        const currentDraggingId = blockId;
        const currentHoveredId = currentHoverTarget.current;
        const currentDropPosition = dropPosition.current;

        DEBUG_DRAG && console.log(`🏁 DRAG END: ${currentDraggingId} -> ${currentHoveredId} (${currentDropPosition})`);

        executeReorder(currentDraggingId, currentHoveredId, currentDropPosition);
        
        // 상태 정리
        setDraggingBlockIdRef.current?.(null);
        setHoveredBlockIdRef.current?.(null);
        currentHoverTarget.current = null;
        dropPosition.current = 'after';
        isDraggingRef.current = false;
      },

      onPanResponderTerminate: () => {
        DEBUG_DRAG && console.log(`🚫 Drag terminated for ${blockId}`);
        
        // 상태 정리
        setDraggingBlockIdRef.current?.(null);
        setHoveredBlockIdRef.current?.(null);
        currentHoverTarget.current = null;
        dropPosition.current = 'after';
        isDraggingRef.current = false;
      },

      onPanResponderTerminationRequest: () => false,
    }), [
      blockId,
      blockType,
      calculateDropTarget,
      executeReorder,
      updateRefs,
      hoveredBlockId,
      DEBUG_DRAG
    ]
  );

  return {
    panResponder,
    isDragging: draggingBlockId === blockId,
    isHovered: hoveredBlockId === blockId,
    updateRefs
  };
};