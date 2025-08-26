import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  PanResponder,
  Animated,
  TouchableOpacity,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../constants/Colors';
import { createNoteStyles } from '../styles/CreateNoteStyles';
import { useSimpleToolbar } from '../contexts/SimpleToolbarContext';

const NoteCardBlock = ({
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
  toolbarId = 'newton-toolbar',
  useGlobalKeyboard = false
}) => {
  const cardRef = useRef(null);
  const styles = createNoteStyles;
  const { handleInputFocus } = useSimpleToolbar();
  
  // 🔧 디버그 모드 (개발 시에만 true로 설정)
  const DEBUG_DRAG = false;

  
  // 📏 통합된 레이아웃 측정 함수
  const measureCardLayout = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.measureInWindow((pageX, pageY, width, height) => {
        if (height > 0 && pageY >= 0) {
          setCardLayouts(prev => ({
            ...prev,
            [block.id]: { x: pageX, y: pageY, width, height }
          }));
          DEBUG_DRAG && console.log(`✅ Layout measured for ${block.id}:`, { pageX, pageY, width, height });
        }
      });
    }
  }, [block.id, setCardLayouts]);

  // 📏 컴포넌트 마운트 시 레이아웃 측정
  useEffect(() => {
    // 초기 측정 (onLayout 이후 보완용)
    const timeoutId = setTimeout(measureCardLayout, 100);
    
    return () => {
      clearTimeout(timeoutId);
      setCardLayouts(prev => {
        const updated = { ...prev };
        delete updated[block.id];
        return updated;
      });
    };
  }, [block.id, measureCardLayout]);

  // 🖐️ 드래그 핸들러
  const currentHoverTarget = useRef(null); // Store current hover target
  const dropPosition = useRef('after'); // Store drop position

  // 📊 인덱스 계산 헬퍼 함수
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
  const cardLayoutsRef = useRef(cardLayouts); // Ref to avoid dependency issues
  const blocksRef = useRef(blocks);
  const setBlocksRef = useRef(setBlocks);
  const setDraggingBlockIdRef = useRef(setDraggingBlockId);
  const setHoveredBlockIdRef = useRef(setHoveredBlockId);
  const isDraggingRef = useRef(false); // Flag to prevent multiple drag starts
  
  // Update refs when props change
  useEffect(() => {
    cardLayoutsRef.current = cardLayouts;
    blocksRef.current = blocks;
    setBlocksRef.current = setBlocks;
    setDraggingBlockIdRef.current = setDraggingBlockId;
    setHoveredBlockIdRef.current = setHoveredBlockId;
  }, [cardLayouts, blocks, setBlocks, setDraggingBlockId, setHoveredBlockId]);
  
  // panResponder를 useMemo로 deps 최소화
  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // 초기 터치 감지만 하고, 실제 드래그는 onMoveShouldSetPanResponder에서 결정
        return true;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const movement = Math.sqrt(dx * dx + dy * dy);
        const hasLayoutData = cardLayoutsRef.current[block.id] !== undefined;
        
        const shouldActivateDrag = hasLayoutData && movement > 5;
        DEBUG_DRAG && console.log(`🎯 Move check for ${block.id}: movement=${movement.toFixed(1)}, hasLayout=${hasLayoutData}, activate=${shouldActivateDrag}`);
        return shouldActivateDrag;
      },
      onPanResponderGrant: () => {
        if (isDraggingRef.current) {
          console.log(`🚫 DRAG ALREADY ACTIVE for ${block.id}, forcing complete reset`);
          // 완전한 드래그 상태 리셋
          isDraggingRef.current = false;
          setDraggingBlockId(null);
          setHoveredBlockId(null);
          return;
        }
        DEBUG_DRAG && console.log(`🚀 DRAG START: ${block.id}`);
        DEBUG_DRAG && console.log(`🚀 Current layouts available:`, Object.keys(cardLayoutsRef.current));
        
        // 레이아웃이 없으면 강제로 측정 시도
        if (Object.keys(cardLayoutsRef.current).length === 0) {
          console.log(`🚀 No layouts available, forcing measurement...`);
          if (cardRef.current) {
            cardRef.current.measure((x, y, width, height, pageX, pageY) => {
              console.log(`🚀 Emergency layout measurement for ${block.id}:`, { pageX, pageY, width, height });
              if (height > 0) {
                cardLayoutsRef.current = {
                  ...cardLayoutsRef.current,
                  [block.id]: { x: pageX, y: pageY, width, height }
                };
              }
            });
          }
        }
        
        isDraggingRef.current = true;
        setDraggingBlockIdRef.current(block.id);
      },
      onPanResponderMove: (e, gestureState) => {
        const dragY = e.nativeEvent.pageY;
        const currentCardLayouts = cardLayoutsRef.current;
        
        if (Object.keys(currentCardLayouts).length === 0) {
          return;
        }
        
        // 드랍 존을 더 자세히 계산 (카드 위, 카드 사이, 카드 아래)
        let foundTarget = null;
        let currentDropPosition = 'after'; // 'before', 'after', 'replace'
        
        // 모든 블록에 대해 세밀한 드랍 존 체크 (카드, 텍스트, 이미지 모두 포함)
        const sortedBlocks = Object.entries(currentCardLayouts)
          .filter(([id]) => id !== block.id)
          .sort(([,a], [,b]) => a.y - b.y);
        
        // console.log(`🔍 Detailed zone check for dragY=${dragY}`);
        // console.log(`🔍 Sorted cards (by y):`, sortedCards.map(([id, layout]) => `${id}: y=${layout.y}, h=${layout.height}`));
        
        for (let i = 0; i < sortedBlocks.length; i++) {
          const [id, layout] = sortedBlocks[i];
          
          // 각 카드를 3개 영역으로 나눔 - 더 큰 드롭존으로 수정
          const topZone = layout.y - 50;        // 카드 위 (before) - 범위 확대
          const middleZone = layout.y + layout.height/2;  // 카드 중간 (replace)
          const bottomZone = layout.y + layout.height + 50; // 카드 아래 (after) - 범위 확대
          
          // console.log(`🎯 Check ${id}: topZone=${Math.round(topZone)} <= ${Math.round(dragY)} <= ${Math.round(bottomZone)} ?`);
          
          if (dragY >= topZone && dragY <= bottomZone) {
            foundTarget = id;
            
            if (dragY < middleZone - 20) {
              currentDropPosition = 'before';
              // console.log(`🎯 ✅ Drop BEFORE ${id} (dragY=${Math.round(dragY)} < middleZone-20=${Math.round(middleZone-20)})`);
            } else if (dragY > middleZone + 20) {
              currentDropPosition = 'after';
              // console.log(`🎯 ✅ Drop AFTER ${id} (dragY=${Math.round(dragY)} > middleZone+20=${Math.round(middleZone+20)})`);
            } else {
              currentDropPosition = 'replace';
              // console.log(`🎯 ✅ Drop REPLACE ${id} (middle zone)`);
            }
            break;
          } else {
            // console.log(`🎯 ❌ ${id} - dragY ${Math.round(dragY)} not in range [${Math.round(topZone)}, ${Math.round(bottomZone)}]`);
          }
        }
        
        // 실제 카드 위치를 기반으로 한 fallback 로직 (항상 실행)
        if (!foundTarget || true) { // 디버깅을 위해 항상 실행
          const sortedBlockEntries = Object.entries(currentCardLayouts)
            .filter(([id]) => id !== block.id)
            .sort(([,a], [,b]) => a.y - b.y);
          
          // console.log(`🔄 ALWAYS running fallback logic - sorted blocks:`, sortedBlockEntries.map(([id, layout]) => `${id}: y=${Math.round(layout.y)}`));
          
          if (sortedBlockEntries.length === 0) {
            foundTarget = 'FIRST';
            currentDropPosition = 'before';
            // console.log(`🎯 No other cards, drop at FIRST`);
          } else {
            const firstBlock = sortedBlockEntries[0];
            const lastBlock = sortedBlockEntries[sortedBlockEntries.length - 1];
            
            // console.log(`🔄 Range check: dragY=${Math.round(dragY)}, firstCard.y=${Math.round(firstCard[1].y)}, lastCard.maxY=${Math.round(lastCard[1].y + lastCard[1].height)}`);
            
            if (dragY < firstBlock[1].y - 20) {
              // Above first block
              foundTarget = firstBlock[0];
              currentDropPosition = 'before';
              // console.log(`🎯 ⬆️ Drop BEFORE first block ${firstBlock[0]}`);
            } else if (dragY > lastBlock[1].y + lastBlock[1].height + 20) {
              // Below last block
              foundTarget = lastBlock[0];
              currentDropPosition = 'after';
              // console.log(`🎯 ⬇️ Drop AFTER last block ${lastBlock[0]}`);
            } else {
              // Find the block this dragY is closest to
              let bestMatch = null;
              let bestDistance = Infinity;
              let bestPosition = 'after';
              
              for (let i = 0; i < sortedBlockEntries.length; i++) {
                const [id, layout] = sortedBlockEntries[i];
                const blockTop = layout.y;
                const blockBottom = layout.y + layout.height;
                const blockCenter = layout.y + layout.height / 2;
                
                // Calculate distance to this block's zones
                const distanceToTop = Math.abs(dragY - blockTop);
                const distanceToCenter = Math.abs(dragY - blockCenter);  
                const distanceToBottom = Math.abs(dragY - blockBottom);
                
                // Check if this block is a text block (no replace for text blocks)
                const targetBlock = blocksRef.current.find(b => b.id === id);
                const isTextBlock = targetBlock?.type === 'text';
                
                // console.log(`🔍 ${id}: top=${Math.round(blockTop)}, center=${Math.round(blockCenter)}, bottom=${Math.round(blockBottom)}, isText=${isTextBlock}`);
                // console.log(`🔍 ${id}: distToTop=${Math.round(distanceToTop)}, distToCenter=${Math.round(distanceToCenter)}, distToBottom=${Math.round(distanceToBottom)}`);
                
                // Check if this is the best match
                if (distanceToTop < bestDistance) {
                  bestMatch = id;
                  bestDistance = distanceToTop;
                  bestPosition = 'before';
                  // console.log(`🎯 NEW BEST: ${id} BEFORE (distance: ${Math.round(distanceToTop)})`);
                }
                // Only allow center/replace for non-text blocks
                if (!isTextBlock && distanceToCenter < bestDistance) {
                  bestMatch = id;
                  bestDistance = distanceToCenter;
                  bestPosition = 'replace';
                  // console.log(`🎯 NEW BEST: ${id} REPLACE (distance: ${Math.round(distanceToCenter)})`);
                }
                if (distanceToBottom < bestDistance) {
                  bestMatch = id;
                  bestDistance = distanceToBottom;
                  bestPosition = 'after';
                  // console.log(`🎯 NEW BEST: ${id} AFTER (distance: ${Math.round(distanceToBottom)})`);
                }
              }
              
              foundTarget = bestMatch || firstBlock[0];
              currentDropPosition = bestPosition;
              // console.log(`🎯 🎯 Best match: ${foundTarget} with position ${currentDropPosition} (distance: ${Math.round(bestDistance)})`);
            }
          }
        }

        // console.log(`🎯 Found target: ${foundTarget}, position: ${currentDropPosition}`);
        
        // Store current target and position in refs for reliable access in release
        currentHoverTarget.current = foundTarget;
        dropPosition.current = currentDropPosition;

        if (hoveredBlockId !== foundTarget) {
          setHoveredBlockIdRef.current(foundTarget);
          if (foundTarget) {
            // console.log(`🧲 Hovered over ${foundTarget}`);
          }
        }
      },
      onPanResponderRelease: () => {
        // Use ref values for reliable hover target and drop position
        const currentDraggingId = block.id; // Use current block ID directly
        const currentHoveredId = currentHoverTarget.current;
        const currentDropPosition = dropPosition.current;
        
        DEBUG_DRAG && console.log(`🏁 DRAG END: dragging=${currentDraggingId}, target=${currentHoveredId}, position=${currentDropPosition}`);
        
        // console.log(`\n🎯 === DRAG RELEASE for ${block.id} ===`);
        // console.log(`🎯 draggingBlockId: ${currentDraggingId}`);
        // console.log(`🎯 hoveredId: ${currentHoveredId}`);
        // console.log(`🎯 dropPosition: ${currentDropPosition}`);
        // console.log(`🎯 Condition check: ${!!(currentDraggingId && currentHoveredId)}`);
        
        if (currentDraggingId && currentHoveredId && blocksRef.current.length > 0) {
          // console.log(`🔧 === REORDER CALCULATION START ===`);
          // console.log(`🔧 dragging=${currentDraggingId}, target=${currentHoveredId}, position=${currentDropPosition}`);
          // console.log(`🔧 Current blocks order:`, blocks.map((b, i) => `${i}:${b.id}(${b.type})`));
          
          const fromIndex = blocksRef.current.findIndex(b => b.id === currentDraggingId);
          const originalTargetIndex = blocksRef.current.findIndex(b => b.id === currentHoveredId);
          
          // 현재 드래그하는 블록이 여전히 존재하는지 확인
          if (fromIndex === -1) {
            console.warn(`⚠️ Drag cancelled - block ${currentDraggingId} no longer exists`);
            setDraggingBlockId(null);
            setHoveredBlockId(null);
            return;
          }
          
          // console.log(`🔧 fromIndex: ${fromIndex}, originalTargetIndex: ${originalTargetIndex}`);
          
          if (fromIndex !== -1 && originalTargetIndex !== -1) {
            // 🎯 헬퍼 함수를 사용한 최종 인덱스 계산
            let finalInsertIndex = 0;
            
            if (currentHoveredId === 'FIRST') {
              finalInsertIndex = 0;
            } else if (currentHoveredId === 'LAST') {
              finalInsertIndex = blocksRef.current.length - 1;
            } else if (originalTargetIndex !== -1) {
              finalInsertIndex = calculateFinalInsertIndex(fromIndex, originalTargetIndex, currentDropPosition);
            }
            // console.log(`🔧 Final validated insertIndex: ${finalInsertIndex}`);
            
            // 실제 배열 재정렬
            const updated = [...blocksRef.current];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(finalInsertIndex, 0, moved);
            
            // console.log(`🔧 Final blocks order:`, updated.map((b, i) => `${i}:${b.id}(${b.type})`));
            // console.log(`🔧 === REORDER CALCULATION END ===`);
            
            console.log(`🚀 CALLING setBlocks with new order...`);
            setBlocksRef.current(updated);
            // console.log(`✅ Reordered ${currentDraggingId} from index ${fromIndex} to ${finalInsertIndex}`);
          } else {
            // 드래그 중에 블록이 사라지거나 변경된 경우 안전하게 처리
            if (fromIndex === -1) {
              console.warn(`⚠️ Dragging block ${currentDraggingId} not found in blocks array - may have been deleted or modified`);
            }
            if (originalTargetIndex === -1 && currentHoveredId !== 'FIRST' && currentHoveredId !== 'LAST') {
              console.warn(`⚠️ Target block ${currentHoveredId} not found in blocks array`);
            }
            // 드래그 상태만 정리하고 계속 진행
          }
        } else {
          // console.log(`❌ DRAG RELEASE SKIPPED:`);
          // console.log(`❌ currentDraggingId: ${currentDraggingId} (${typeof currentDraggingId})`);  
          // console.log(`❌ currentHoveredId: ${currentHoveredId} (${typeof currentHoveredId})`);
          // console.log(`❌ Both must be truthy for reorder to execute`);
        }

        // console.log(`🧹 Cleaning up drag state...`);
        setDraggingBlockId(null);
        setHoveredBlockId(null);
        currentHoverTarget.current = null; // Reset refs
        dropPosition.current = 'after';
        isDraggingRef.current = false; // Reset drag flag
        // console.log(`🧹 Drag cleanup complete`);
      },
      onPanResponderTerminate: () => {
        // console.log(`🚫 Drag terminated for ${block.id}`);
        setDraggingBlockId(null);
        setHoveredBlockId(null);
        currentHoverTarget.current = null; // Reset refs
        dropPosition.current = 'after';
        isDraggingRef.current = false; // Reset drag flag
      },
      onPanResponderTerminationRequest: () => false, // Don't allow termination during drag
    })
  , [block.id]);

  const isDragging = draggingBlockId === block.id;
  const isHovered = hoveredBlockId === block.id;
  
  // Get layout style for card positioning
  const layoutMode = block.layoutMode || 'full';
  const getCardLayoutStyle = (layoutMode) => {
    switch (layoutMode) {
      case 'grid-left':
        return { width: '48%', alignSelf: 'flex-start' };
      case 'grid-right':
        return { width: '48%', alignSelf: 'flex-end' };
      case 'full':
      default:
        return { width: '100%', alignSelf: 'stretch' };
    }
  };
  const layoutStyle = getCardLayoutStyle(layoutMode);


  // Handle layout measurement via onLayout callback (backup method)
  const handleLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    console.log(`📐 onLayout called for ${block.id} → x: ${x}, y: ${y}, width: ${width}, height: ${height}`);
    
    if (height > 0) {
      // onLayout은 로컬 좌표를 제공하므로 measureInWindow로 글로벌 좌표 얻기
      if (cardRef.current) {
        cardRef.current.measureInWindow((pageX, pageY, pageWidth, pageHeight) => {
          // console.log(`📐 measureInWindow for ${block.id}:`, { pageX, pageY, pageWidth, pageHeight });
          setCardLayouts(prev => ({
            ...prev,
            [block.id]: { x: pageX, y: pageY, width: pageWidth, height: pageHeight }
          }));
          // console.log(`✅ Layout registered for ${block.id} via onLayout+measureInWindow - pageY: ${pageY}`);
        });
      } else {
        // fallback to local coordinates
        setCardLayouts(prev => ({
          ...prev,
          [block.id]: { x, y, width, height }
        }));
        // console.log(`✅ Layout registered for ${block.id} via onLayout (local coords)`);
      }
    } else {
      console.log(`❌ onLayout failed for ${block.id}: height=${height}`);
    }
  };

  return (
    <View
      ref={cardRef}
      {...panResponder.panHandlers}
      onLayout={handleLayout}
      onTouchStart={(e) => {
        console.log(`🎯 Card TOUCH START: ${block.id}`);
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
          defaultValue={block.content}
          onChangeText={(text) => handleTextChange(block.id, text)}
          onPressIn={() => {
            // console.log('🎯 TextInput pressed in card:', block.id);
            dismissMenus();
          }}
          onFocus={() => {
            dismissMenus();
            setFocusedIndex(index);
            // 카드 포커스 시 자동 스크롤 (키보드가 이미 올라와 있을 때)
            if (keyboardVisible && keyboardHeight > 0) {
              setTimeout(() => {
                scrollToFocusedInput(keyboardHeight);
              }, 10); // 매우 빠른 스크롤
            }
          }}
          onKeyPress={({ nativeEvent }) => {
            handleKeyPress(block, index, nativeEvent.key);
          }}
          onContentSizeChange={({ nativeEvent }) => {
            // console.log('📏 TextInput content size changed:', nativeEvent.contentSize);
            // No action needed - KeyboardAvoidingView handles positioning
          }}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          scrollEnabled={false}
          editable={isAuthor && !isDragging}
          placeholderTextColor={Colors.secondaryText}
          {...(Platform.OS === 'android' && useGlobalKeyboard ? { showSoftInputOnFocus: false } : {})}
        />
        {isAuthor && (
          <TouchableOpacity onPress={() => handleDeleteBlock(index)}>
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
};

export default NoteCardBlock;