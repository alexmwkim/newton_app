import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Image,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { createNoteStyles } from '../styles/CreateNoteStyles';

const NoteImageBlock = ({
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
  const imageRef = useRef(null);
  const styles = createNoteStyles;
  
  // 🔧 디버그 모드 (개발 시에만 true로 설정)
  const DEBUG_DRAG = false;

  // 드래그 핸들러 - NoteCardBlock과 동일한 로직
  const currentHoverTarget = useRef(null);
  const dropPosition = useRef('after');
  
  // Layout 측정
  useEffect(() => {
    const measureLayout = () => {
      if (imageRef.current) {
        imageRef.current.measure((x, y, width, height, pageX, pageY) => {
          if (height > 0 && pageY >= 0) {
            setCardLayouts(prev => ({
              ...prev,
              [block.id]: { x: pageX, y: pageY, width, height }
            }));
            DEBUG_DRAG && console.log(`✅ Image layout registered for ${block.id} - pageY: ${pageY}`);
          }
        });
      }
    };
    
    measureLayout();
    setTimeout(measureLayout, 100);
    setTimeout(measureLayout, 300);
    
    return () => {
      setCardLayouts(prev => {
        const updated = { ...prev };
        delete updated[block.id];
        return updated;
      });
    };
  }, [block.id, setCardLayouts]);

  // PanResponder - NoteCardBlock과 동일
  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        console.log(`🎯 Image PanResponder START CHECK called for: ${block.id}`);
        return true; // 항상 드래그 시작 허용
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const movement = Math.sqrt(dx * dx + dy * dy);
        console.log(`🎯 Image PanResponder MOVE CHECK for ${block.id}: movement=${movement}`);
        return movement > 5; // 레이아웃 조건 제거, 움직임만 확인
      },
      onPanResponderGrant: () => {
        console.log(`👆 Image drag start: ${block.id}`);
        console.log(`👆 Current layouts available:`, Object.keys(cardLayouts));
        
        // 레이아웃이 없으면 강제로 측정 시도
        if (Object.keys(cardLayouts).length === 0) {
          console.log(`👆 No layouts available, forcing measurement...`);
          if (imageRef.current) {
            imageRef.current.measure((x, y, width, height, pageX, pageY) => {
              console.log(`👆 Emergency layout measurement for ${block.id}:`, { pageX, pageY, width, height });
              if (height > 0) {
                setCardLayouts(prev => ({
                  ...prev,
                  [block.id]: { x: pageX, y: pageY, width, height }
                }));
              }
            });
          }
        }
        
        setDraggingBlockId(block.id);
      },
      onPanResponderMove: (e, gestureState) => {
        const dragY = e.nativeEvent.pageY;
        
        if (Object.keys(cardLayouts).length === 0) {
          console.warn('⚠️ cardLayouts not ready for image drag operation');
          return;
        }
        
        // 드롭 존 계산 - NoteCardBlock과 동일한 로직
        let foundTarget = null;
        let currentDropPosition = 'after';
        
        // 실제 카드 위치를 기반으로 한 fallback 로직
        const sortedCardEntries = Object.entries(cardLayouts)
          .filter(([id]) => id !== block.id)
          .sort(([,a], [,b]) => a.y - b.y);
        
        if (sortedCardEntries.length === 0) {
          foundTarget = 'FIRST';
          currentDropPosition = 'before';
        } else {
          const firstCard = sortedCardEntries[0];
          const lastCard = sortedCardEntries[sortedCardEntries.length - 1];
          
          if (dragY < firstCard[1].y - 20) {
            foundTarget = firstCard[0];
            currentDropPosition = 'before';
          } else if (dragY > lastCard[1].y + lastCard[1].height + 20) {
            foundTarget = lastCard[0];
            currentDropPosition = 'after';
          } else {
            // Find the closest card
            let bestMatch = null;
            let bestDistance = Infinity;
            let bestPosition = 'after';
            
            for (let i = 0; i < sortedCardEntries.length; i++) {
              const [id, layout] = sortedCardEntries[i];
              const cardTop = layout.y;
              const cardBottom = layout.y + layout.height;
              const cardCenter = layout.y + layout.height / 2;
              
              const distanceToTop = Math.abs(dragY - cardTop);
              const distanceToCenter = Math.abs(dragY - cardCenter);  
              const distanceToBottom = Math.abs(dragY - cardBottom);
              
              if (distanceToTop < bestDistance) {
                bestMatch = id;
                bestDistance = distanceToTop;
                bestPosition = 'before';
              }
              if (distanceToCenter < bestDistance) {
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
            
            foundTarget = bestMatch || firstCard[0];
            currentDropPosition = bestPosition;
          }
        }

        currentHoverTarget.current = foundTarget;
        dropPosition.current = currentDropPosition;

        if (hoveredBlockId !== foundTarget) {
          setHoveredBlockId(foundTarget);
        }
      },
      onPanResponderRelease: () => {
        const currentDraggingId = draggingBlockId;
        const currentHoveredId = currentHoverTarget.current;
        const currentDropPosition = dropPosition.current;
        
        console.log(`🎯 Image drag ended for ${block.id}, hoveredId: ${currentHoveredId}, position: ${currentDropPosition}`);
        
        if (currentDraggingId && currentHoveredId) {
          const fromIndex = blocks.findIndex(b => b.id === currentDraggingId);
          const originalTargetIndex = blocks.findIndex(b => b.id === currentHoveredId);
          
          if (fromIndex !== -1) {
            let finalInsertIndex = 0;
            
            if (currentHoveredId === 'FIRST') {
              finalInsertIndex = 0;
            } else if (currentHoveredId === 'LAST') {
              finalInsertIndex = blocks.length - 1;
            } else if (originalTargetIndex !== -1) {
              if (currentDropPosition === 'before') {
                finalInsertIndex = originalTargetIndex;
                if (fromIndex < originalTargetIndex) {
                  finalInsertIndex--;
                }
              } else if (currentDropPosition === 'after') {
                finalInsertIndex = originalTargetIndex + 1;
                if (fromIndex < originalTargetIndex) {
                  finalInsertIndex--;
                }
              } else { // replace
                finalInsertIndex = originalTargetIndex;
                if (fromIndex < originalTargetIndex) {
                  finalInsertIndex--;
                }
              }
            }
            
            finalInsertIndex = Math.max(0, Math.min(finalInsertIndex, blocks.length - 1));
            
            const updated = [...blocks];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(finalInsertIndex, 0, moved);
            
            setBlocks(updated);
            console.log(`✅ Reordered image ${currentDraggingId} from index ${fromIndex} to ${finalInsertIndex}`);
          }
        }

        setDraggingBlockId(null);
        setHoveredBlockId(null);
        currentHoverTarget.current = null;
        dropPosition.current = 'after';
      },
      onPanResponderTerminate: () => {
        DEBUG_DRAG && console.log(`🚫 Image drag terminated for ${block.id}`);
        setDraggingBlockId(null);
        setHoveredBlockId(null);
        currentHoverTarget.current = null;
        dropPosition.current = 'after';
      },
      onPanResponderTerminationRequest: () => false,
    })
  , [cardLayouts, block.id, draggingBlockId, hoveredBlockId, setDraggingBlockId, setHoveredBlockId]);

  const isDragging = draggingBlockId === block.id;
  const isHovered = hoveredBlockId === block.id;

  const handleLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    
    if (height > 0) {
      if (imageRef.current) {
        imageRef.current.measureInWindow((pageX, pageY, pageWidth, pageHeight) => {
          setCardLayouts(prev => ({
            ...prev,
            [block.id]: { x: pageX, y: pageY, width: pageWidth, height: pageHeight }
          }));
        });
      }
    }
  };

  return (
    <View
      ref={imageRef}
      {...panResponder.panHandlers}
      onLayout={handleLayout}
      style={[
        styles.imageBlock,
        isDragging && styles.cardDragging, // 카드와 같은 드래그 스타일 사용
        isHovered && styles.cardHovered,   // 카드와 같은 호버 스타일 사용
      ]}
    >
      <Image source={{ uri: block.content }} style={styles.image} />
      {isAuthor && (
        <TouchableOpacity 
          style={styles.deleteImageBtn} 
          onPress={() => handleDeleteBlock(index)}
        >
          <Icon name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NoteImageBlock;