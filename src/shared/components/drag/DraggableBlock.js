/**
 * DraggableBlock - 드래그 가능한 블록의 공통 기능
 * 재사용 가능한 드래그 앤 드롭 로직
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { PanResponder } from 'react-native';

// 드래그 앤 드롭 로직을 위한 커스텀 훅
export const useDragAndDrop = ({
  blockId,
  blocks,
  setBlocks,
  draggingBlockId,
  setDraggingBlockId,
  hoveredBlockId,
  setHoveredBlockId,
  cardLayouts,
  setCardLayouts,
  blockRef
}) => {
  const currentHoverTarget = useRef(null);
  const dropPosition = useRef('after');

  // Layout 측정
  useEffect(() => {
    const measureLayout = () => {
      if (blockRef.current) {
        blockRef.current.measure((x, y, width, height, pageX, pageY) => {
          if (height > 0 && pageY >= 0) {
            setCardLayouts(prev => ({
              ...prev,
              [blockId]: { x: pageX, y: pageY, width, height }
            }));
          }
        });
      }
    };
    
    measureLayout();
    const timeouts = [
      setTimeout(measureLayout, 100),
      setTimeout(measureLayout, 300)
    ];
    
    return () => {
      timeouts.forEach(clearTimeout);
      setCardLayouts(prev => {
        const updated = { ...prev };
        delete updated[blockId];
        return updated;
      });
    };
  }, [blockId, setCardLayouts]);

  // 드롭 존 계산 로직
  const calculateDropTarget = (dragY) => {
    if (Object.keys(cardLayouts).length === 0) return null;
    
    const sortedCardEntries = Object.entries(cardLayouts)
      .filter(([id]) => id !== blockId)
      .sort(([,a], [,b]) => a.y - b.y);
    
    if (sortedCardEntries.length === 0) {
      return { target: 'FIRST', position: 'before' };
    }
    
    const firstCard = sortedCardEntries[0];
    const lastCard = sortedCardEntries[sortedCardEntries.length - 1];
    
    if (dragY < firstCard[1].y - 20) {
      return { target: firstCard[0], position: 'before' };
    }
    
    if (dragY > lastCard[1].y + lastCard[1].height + 20) {
      return { target: lastCard[0], position: 'after' };
    }
    
    // Find closest card
    let bestMatch = null;
    let bestDistance = Infinity;
    let bestPosition = 'after';
    
    for (const [id, layout] of sortedCardEntries) {
      const cardTop = layout.y;
      const cardBottom = layout.y + layout.height;
      const cardCenter = layout.y + layout.height / 2;
      
      const distances = [
        { distance: Math.abs(dragY - cardTop), position: 'before' },
        { distance: Math.abs(dragY - cardCenter), position: 'replace' },
        { distance: Math.abs(dragY - cardBottom), position: 'after' }
      ];
      
      for (const { distance, position } of distances) {
        if (distance < bestDistance) {
          bestMatch = id;
          bestDistance = distance;
          bestPosition = position;
        }
      }
    }
    
    return { 
      target: bestMatch || firstCard[0], 
      position: bestPosition 
    };
  };

  // 블록 재배열 로직
  const reorderBlocks = (draggedId, targetId, position) => {
    const fromIndex = blocks.findIndex(b => b.id === draggedId);
    const targetIndex = blocks.findIndex(b => b.id === targetId);
    
    if (fromIndex === -1) return;
    
    let finalIndex = 0;
    
    if (targetId === 'FIRST') {
      finalIndex = 0;
    } else if (targetId === 'LAST') {
      finalIndex = blocks.length - 1;
    } else if (targetIndex !== -1) {
      if (position === 'before') {
        finalIndex = targetIndex;
        if (fromIndex < targetIndex) finalIndex--;
      } else if (position === 'after') {
        finalIndex = targetIndex + 1;
        if (fromIndex < targetIndex) finalIndex--;
      } else { // replace
        finalIndex = targetIndex;
        if (fromIndex < targetIndex) finalIndex--;
      }
    }
    
    finalIndex = Math.max(0, Math.min(finalIndex, blocks.length - 1));
    
    const updated = [...blocks];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(finalIndex, 0, moved);
    
    setBlocks(updated);
  };

  // PanResponder
  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const hasLayouts = Object.keys(cardLayouts).length > 0;
        const currentBlockHasLayout = cardLayouts[blockId] !== undefined;
        return hasLayouts && currentBlockHasLayout;
      },
      
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const movement = Math.sqrt(dx * dx + dy * dy);
        const hasLayouts = Object.keys(cardLayouts).length > 0;
        const currentBlockHasLayout = cardLayouts[blockId] !== undefined;
        return hasLayouts && currentBlockHasLayout && movement > 5;
      },
      
      onPanResponderGrant: () => {
        setDraggingBlockId(blockId);
      },
      
      onPanResponderMove: (e) => {
        const dragY = e.nativeEvent.pageY;
        const result = calculateDropTarget(dragY);
        
        if (result) {
          currentHoverTarget.current = result.target;
          dropPosition.current = result.position;
          
          if (hoveredBlockId !== result.target) {
            setHoveredBlockId(result.target);
          }
        }
      },
      
      onPanResponderRelease: () => {
        const targetId = currentHoverTarget.current;
        const position = dropPosition.current;
        
        if (draggingBlockId && targetId) {
          reorderBlocks(draggingBlockId, targetId, position);
        }
        
        // Reset state
        setDraggingBlockId(null);
        setHoveredBlockId(null);
        currentHoverTarget.current = null;
        dropPosition.current = 'after';
      },
      
      onPanResponderTerminate: () => {
        setDraggingBlockId(null);
        setHoveredBlockId(null);
        currentHoverTarget.current = null;
        dropPosition.current = 'after';
      },
      
      onPanResponderTerminationRequest: () => false,
    })
  , [cardLayouts, blockId, draggingBlockId, hoveredBlockId, blocks]);

  const isDragging = draggingBlockId === blockId;
  const isHovered = hoveredBlockId === blockId;

  const handleLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    
    if (height > 0 && blockRef.current) {
      blockRef.current.measureInWindow((pageX, pageY, pageWidth, pageHeight) => {
        setCardLayouts(prev => ({
          ...prev,
          [blockId]: { x: pageX, y: pageY, width: pageWidth, height: pageHeight }
        }));
      });
    }
  };

  return {
    panResponder,
    isDragging,
    isHovered,
    handleLayout
  };
};