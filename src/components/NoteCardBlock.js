import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  PanResponder,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../constants/Colors';
import { createNoteStyles } from '../styles/CreateNoteStyles';

const TOOLBAR_ID = 'newton-toolbar';

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
  preventNextAutoScroll = () => {}
}) => {
  const cardRef = useRef(null);
  const styles = createNoteStyles;

  
  // 강제로 측정 시도
  React.useLayoutEffect(() => {
    console.log(`🔧 useLayoutEffect triggered for ${block.id}`);
    
    const forceLayout = () => {
      if (cardRef.current) {
        console.log(`🔧 Force measuring ${block.id}`);
        cardRef.current.measure((x, y, width, height, pageX, pageY) => {
          console.log(`🔧 Force measure result for ${block.id}:`, { x, y, width, height, pageX, pageY });
          if (height > 0 && pageY >= 0) { // pageY >= 0으로 변경 (0도 허용)
            setCardLayouts(prev => ({
              ...prev,
              [block.id]: { x: pageX, y: pageY, width, height }
            }));
            console.log(`✅ Force layout registered for ${block.id} - pageY: ${pageY}`);
          } else {
            console.log(`❌ Force measure failed for ${block.id}: height=${height}, pageY=${pageY}`);
          }
        });
      }
    };
    
    // 여러 시점에서 측정
    forceLayout();
    setTimeout(forceLayout, 100);
    setTimeout(forceLayout, 300);
    setTimeout(forceLayout, 500);
  }, []);

  // 📏 컴포넌트 마운트 및 레이아웃 측정
  useEffect(() => {
    console.log(`🔧 NoteCardBlock mounted for ${block.id}`);
    
    // 여러 번 측정 시도
    const measureAttempts = [100, 300, 500, 1000];
    const timeouts = [];
    
    const measureLayout = () => {
      if (cardRef.current) {
        console.log(`🔧 Attempting to measure ${block.id}`);
        cardRef.current.measure((x, y, width, height, pageX, pageY) => {
          console.log(`🔧 measure result for ${block.id}:`, { x, y, width, height, pageX, pageY });
          if (height > 0 && pageY >= 0) { // pageY >= 0으로 변경
            setCardLayouts(prev => ({
              ...prev,
              [block.id]: { x: pageX, y: pageY, width, height }
            }));
            console.log(`✅ Layout registered for ${block.id} via measure - pageY: ${pageY}`);
          } else {
            console.log(`❌ Invalid dimensions for ${block.id}: height=${height}, pageY=${pageY}`);
          }
        });
      } else {
        console.log(`❌ cardRef.current is null for ${block.id}`);
      }
    };
    
    // 즉시 측정 시도
    measureLayout();
    
    // 여러 시점에서 측정 시도
    measureAttempts.forEach(delay => {
      const timeoutId = setTimeout(measureLayout, delay);
      timeouts.push(timeoutId);
    });
    
    // Clean up
    return () => {
      console.log(`🧹 NoteCardBlock unmounting for ${block.id}`);
      timeouts.forEach(clearTimeout);
      setCardLayouts(prev => {
        const updated = { ...prev };
        delete updated[block.id];
        return updated;
      });
    };
  }, [block.id, setCardLayouts]);

  // 🖐️ 드래그 핸들러
  const currentHoverTarget = useRef(null); // Store current hover target
  const dropPosition = useRef('after'); // Store drop position
  
  // panResponder를 useMemo로 cardLayouts 변경 시마다 재생성
  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const hasLayouts = Object.keys(cardLayouts).length > 0;
        const currentBlockHasLayout = cardLayouts[block.id] !== undefined;
        return hasLayouts && currentBlockHasLayout;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const movement = Math.sqrt(dx * dx + dy * dy);
        const hasLayouts = Object.keys(cardLayouts).length > 0;
        const currentBlockHasLayout = cardLayouts[block.id] !== undefined;
        return hasLayouts && currentBlockHasLayout && movement > 5;
      },
      onPanResponderGrant: () => {
        setDraggingBlockId(block.id);
        console.log(`👆 Drag start: ${block.id}`);
      },
      onPanResponderMove: (e, gestureState) => {
        const dragY = e.nativeEvent.pageY;
        
        if (Object.keys(cardLayouts).length === 0) {
          console.warn('⚠️ cardLayouts not ready for drag operation');
          return;
        }
        
        console.log(`🎯 Drag move - dragY: ${dragY}, available layouts:`, Object.keys(cardLayouts));
        console.log(`🎯 All cardLayouts:`, cardLayouts);
        
        // 먼저 원본 dragY로 테스트 (조정 없음)
        console.log(`🎯 Testing with raw dragY: ${dragY}`);
        
        // 드랍 존을 더 자세히 계산 (카드 위, 카드 사이, 카드 아래)
        let foundTarget = null;
        let currentDropPosition = 'after'; // 'before', 'after', 'replace'
        
        // 모든 카드에 대해 세밀한 드랍 존 체크
        const sortedCards = Object.entries(cardLayouts)
          .filter(([id]) => id !== block.id)
          .sort(([,a], [,b]) => a.y - b.y);
        
        console.log(`🔍 Detailed zone check for dragY=${dragY}`);
        console.log(`🔍 Sorted cards (by y):`, sortedCards.map(([id, layout]) => `${id}: y=${layout.y}, h=${layout.height}`));
        
        for (let i = 0; i < sortedCards.length; i++) {
          const [id, layout] = sortedCards[i];
          
          // 각 카드를 3개 영역으로 나눔 - 더 큰 드롭존으로 수정
          const topZone = layout.y - 50;        // 카드 위 (before) - 범위 확대
          const middleZone = layout.y + layout.height/2;  // 카드 중간 (replace)
          const bottomZone = layout.y + layout.height + 50; // 카드 아래 (after) - 범위 확대
          
          console.log(`🎯 Check ${id}: topZone=${Math.round(topZone)} <= ${Math.round(dragY)} <= ${Math.round(bottomZone)} ?`);
          
          if (dragY >= topZone && dragY <= bottomZone) {
            foundTarget = id;
            
            if (dragY < middleZone - 20) {
              currentDropPosition = 'before';
              console.log(`🎯 ✅ Drop BEFORE ${id} (dragY=${Math.round(dragY)} < middleZone-20=${Math.round(middleZone-20)})`);
            } else if (dragY > middleZone + 20) {
              currentDropPosition = 'after';
              console.log(`🎯 ✅ Drop AFTER ${id} (dragY=${Math.round(dragY)} > middleZone+20=${Math.round(middleZone+20)})`);
            } else {
              currentDropPosition = 'replace';
              console.log(`🎯 ✅ Drop REPLACE ${id} (middle zone)`);
            }
            break;
          } else {
            console.log(`🎯 ❌ ${id} - dragY ${Math.round(dragY)} not in range [${Math.round(topZone)}, ${Math.round(bottomZone)}]`);
          }
        }
        
        // 실제 카드 위치를 기반으로 한 fallback 로직 (항상 실행)
        if (!foundTarget || true) { // 디버깅을 위해 항상 실행
          const sortedCardEntries = Object.entries(cardLayouts)
            .filter(([id]) => id !== block.id)
            .sort(([,a], [,b]) => a.y - b.y);
          
          console.log(`🔄 ALWAYS running fallback logic - sorted cards:`, sortedCardEntries.map(([id, layout]) => `${id}: y=${Math.round(layout.y)}`));
          
          if (sortedCardEntries.length === 0) {
            foundTarget = 'FIRST';
            currentDropPosition = 'before';
            console.log(`🎯 No other cards, drop at FIRST`);
          } else {
            const firstCard = sortedCardEntries[0];
            const lastCard = sortedCardEntries[sortedCardEntries.length - 1];
            
            console.log(`🔄 Range check: dragY=${Math.round(dragY)}, firstCard.y=${Math.round(firstCard[1].y)}, lastCard.maxY=${Math.round(lastCard[1].y + lastCard[1].height)}`);
            
            if (dragY < firstCard[1].y - 20) {
              // Above first card
              foundTarget = firstCard[0];
              currentDropPosition = 'before';
              console.log(`🎯 ⬆️ Drop BEFORE first card ${firstCard[0]}`);
            } else if (dragY > lastCard[1].y + lastCard[1].height + 20) {
              // Below last card
              foundTarget = lastCard[0];
              currentDropPosition = 'after';
              console.log(`🎯 ⬇️ Drop AFTER last card ${lastCard[0]}`);
            } else {
              // Find the card this dragY is closest to
              let bestMatch = null;
              let bestDistance = Infinity;
              let bestPosition = 'after';
              
              for (let i = 0; i < sortedCardEntries.length; i++) {
                const [id, layout] = sortedCardEntries[i];
                const cardTop = layout.y;
                const cardBottom = layout.y + layout.height;
                const cardCenter = layout.y + layout.height / 2;
                
                // Calculate distance to this card's zones
                const distanceToTop = Math.abs(dragY - cardTop);
                const distanceToCenter = Math.abs(dragY - cardCenter);  
                const distanceToBottom = Math.abs(dragY - cardBottom);
                
                console.log(`🔍 ${id}: top=${Math.round(cardTop)}, center=${Math.round(cardCenter)}, bottom=${Math.round(cardBottom)}`);
                console.log(`🔍 ${id}: distToTop=${Math.round(distanceToTop)}, distToCenter=${Math.round(distanceToCenter)}, distToBottom=${Math.round(distanceToBottom)}`);
                
                // Check if this is the best match
                if (distanceToTop < bestDistance) {
                  bestMatch = id;
                  bestDistance = distanceToTop;
                  bestPosition = 'before';
                  console.log(`🎯 NEW BEST: ${id} BEFORE (distance: ${Math.round(distanceToTop)})`);
                }
                if (distanceToCenter < bestDistance) {
                  bestMatch = id;
                  bestDistance = distanceToCenter;
                  bestPosition = 'replace';
                  console.log(`🎯 NEW BEST: ${id} REPLACE (distance: ${Math.round(distanceToCenter)})`);
                }
                if (distanceToBottom < bestDistance) {
                  bestMatch = id;
                  bestDistance = distanceToBottom;
                  bestPosition = 'after';
                  console.log(`🎯 NEW BEST: ${id} AFTER (distance: ${Math.round(distanceToBottom)})`);
                }
              }
              
              foundTarget = bestMatch || firstCard[0];
              currentDropPosition = bestPosition;
              console.log(`🎯 🎯 Best match: ${foundTarget} with position ${currentDropPosition} (distance: ${Math.round(bestDistance)})`);
            }
          }
        }

        console.log(`🎯 Found target: ${foundTarget}, position: ${currentDropPosition}`);
        
        // Store current target and position in refs for reliable access in release
        currentHoverTarget.current = foundTarget;
        dropPosition.current = currentDropPosition;

        if (hoveredBlockId !== foundTarget) {
          setHoveredBlockId(foundTarget);
          if (foundTarget) {
            console.log(`🧲 Hovered over ${foundTarget}`);
          }
        }
      },
      onPanResponderRelease: () => {
        // Use ref values for reliable hover target and drop position
        const currentDraggingId = draggingBlockId;
        const currentHoveredId = currentHoverTarget.current;
        const currentDropPosition = dropPosition.current;
        
        console.log(`\n🎯 === DRAG RELEASE for ${block.id} ===`);
        console.log(`🎯 draggingBlockId: ${currentDraggingId}`);
        console.log(`🎯 hoveredId: ${currentHoveredId}`);
        console.log(`🎯 dropPosition: ${currentDropPosition}`);
        console.log(`🎯 Condition check: ${!!(currentDraggingId && currentHoveredId)}`);
        
        if (currentDraggingId && currentHoveredId) {
          console.log(`🔧 === REORDER CALCULATION START ===`);
          console.log(`🔧 dragging=${currentDraggingId}, target=${currentHoveredId}, position=${currentDropPosition}`);
          console.log(`🔧 Current blocks order:`, blocks.map((b, i) => `${i}:${b.id}(${b.type})`));
          
          const fromIndex = blocks.findIndex(b => b.id === currentDraggingId);
          const originalTargetIndex = blocks.findIndex(b => b.id === currentHoveredId);
          
          console.log(`🔧 fromIndex: ${fromIndex}, originalTargetIndex: ${originalTargetIndex}`);
          
          if (fromIndex !== -1) {
            // 🎯 새로운 접근: 원본 배열에서 직접 최종 위치 계산
            let finalInsertIndex = 0;
            
            if (currentHoveredId === 'FIRST') {
              finalInsertIndex = 0;
              console.log(`✅ Moving to FIRST position: index 0`);
            } else if (currentHoveredId === 'LAST') {
              finalInsertIndex = blocks.length - 1; // 마지막 위치
              console.log(`✅ Moving to LAST position: index ${finalInsertIndex}`);
            } else if (originalTargetIndex !== -1) {
              // 원본 배열에서의 위치를 기준으로 최종 위치 계산
              if (currentDropPosition === 'before') {
                finalInsertIndex = originalTargetIndex;
                if (fromIndex < originalTargetIndex) {
                  finalInsertIndex--; // 앞에서 뒤로 이동 시 인덱스 조정
                }
                console.log(`✅ Moving BEFORE ${currentHoveredId}: finalIndex ${finalInsertIndex}`);
              } else if (currentDropPosition === 'after') {
                finalInsertIndex = originalTargetIndex + 1;
                if (fromIndex < originalTargetIndex) {
                  finalInsertIndex--; // 앞에서 뒤로 이동 시 인덱스 조정
                }
                console.log(`✅ Moving AFTER ${currentHoveredId}: finalIndex ${finalInsertIndex}`);
              } else { // replace
                finalInsertIndex = originalTargetIndex;
                if (fromIndex < originalTargetIndex) {
                  finalInsertIndex--; // 앞에서 뒤로 이동 시 인덱스 조정
                }
                console.log(`✅ Moving to REPLACE ${currentHoveredId}: finalIndex ${finalInsertIndex}`);
              }
            }
            
            // 배열 범위 검증
            finalInsertIndex = Math.max(0, Math.min(finalInsertIndex, blocks.length - 1));
            console.log(`🔧 Final validated insertIndex: ${finalInsertIndex}`);
            
            // 실제 배열 재정렬
            const updated = [...blocks];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(finalInsertIndex, 0, moved);
            
            console.log(`🔧 Final blocks order:`, updated.map((b, i) => `${i}:${b.id}(${b.type})`));
            console.log(`🔧 === REORDER CALCULATION END ===`);
            
            console.log(`🚀 CALLING setBlocks with new order...`);
            setBlocks(updated);
            console.log(`✅ Reordered ${currentDraggingId} from index ${fromIndex} to ${finalInsertIndex}`);
          } else {
            console.error(`❌ Could not find dragging block ${currentDraggingId} in blocks array`);
          }
        } else {
          console.log(`❌ DRAG RELEASE SKIPPED:`);
          console.log(`❌ currentDraggingId: ${currentDraggingId} (${typeof currentDraggingId})`);  
          console.log(`❌ currentHoveredId: ${currentHoveredId} (${typeof currentHoveredId})`);
          console.log(`❌ Both must be truthy for reorder to execute`);
        }

        console.log(`🧹 Cleaning up drag state...`);
        setDraggingBlockId(null);
        setHoveredBlockId(null);
        currentHoverTarget.current = null; // Reset refs
        dropPosition.current = 'after';
        console.log(`🧹 Drag cleanup complete`);
      },
      onPanResponderTerminate: () => {
        console.log(`🚫 Drag terminated for ${block.id}`);
        setDraggingBlockId(null);
        setHoveredBlockId(null);
        currentHoverTarget.current = null; // Reset refs
        dropPosition.current = 'after';
      },
      onPanResponderTerminationRequest: () => false, // Don't allow termination during drag
    })
  , [cardLayouts, block.id, draggingBlockId, hoveredBlockId, setDraggingBlockId, setHoveredBlockId]);

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
          console.log(`📐 measureInWindow for ${block.id}:`, { pageX, pageY, pageWidth, pageHeight });
          setCardLayouts(prev => ({
            ...prev,
            [block.id]: { x: pageX, y: pageY, width: pageWidth, height: pageHeight }
          }));
          console.log(`✅ Layout registered for ${block.id} via onLayout+measureInWindow - pageY: ${pageY}`);
        });
      } else {
        // fallback to local coordinates
        setCardLayouts(prev => ({
          ...prev,
          [block.id]: { x, y, width, height }
        }));
        console.log(`✅ Layout registered for ${block.id} via onLayout (local coords)`);
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
          onChangeText={(text) => handleTextChange(block.id, text)}
          onPressIn={() => {
            console.log('🎯 TextInput pressed in card:', block.id);
            dismissMenus();
          }}
          onFocus={() => {
            console.log('🎯 TextInput focused in card:', block.id, 'index:', index);
            dismissMenus();
            setFocusedIndex(index);
            // Let KeyboardAvoidingView handle the positioning
          }}
          onKeyPress={({ nativeEvent }) => {
            handleKeyPress(block, index, nativeEvent.key);
          }}
          onContentSizeChange={({ nativeEvent }) => {
            console.log('📏 TextInput content size changed:', nativeEvent.contentSize);
            // No action needed - KeyboardAvoidingView handles positioning
          }}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          scrollEnabled={false}
          editable={isAuthor && !isDragging}
          inputAccessoryViewID="newton-toolbar"
          placeholderTextColor={Colors.secondaryText}
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