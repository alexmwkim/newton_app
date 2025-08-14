import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Image, PanResponder, Dimensions, Text, Keyboard, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import { createNoteStyles } from '../styles/CreateNoteStyles';
import NoteCardBlock from './NoteCardBlock';
import NoteImageBlock from './NoteImageBlock';

export const NoteBlockRenderer = ({
  block,
  index,
  blocks = [], // Add blocks array for reorder logic
  setBlocks = () => {}, // Add setBlocks for reordering
  handleTextChange,
  setFocusedIndex,
  keyboardVisible,
  keyboardHeight,
  scrollToFocusedInput,
  handleKeyPress,
  handleDeleteBlock,
  // Legacy drag-to-resize props (deprecated)
  cardLayoutModes = {},
  setCardLayoutModes = () => {},
  dragGuideline = { visible: false },
  setDragGuideline = () => {},
  // New drag and drop props
  draggingBlockId = null,
  dragPosition = { x: 0, y: 0 },
  hoverTargetBlockId = null,
  dragMode = 'none',
  setDraggingBlockId = () => {},
  setDragPosition = () => {},
  setHoverTargetBlockId = () => {},
  setDragMode = () => {},
  updateBlockLayoutMode = () => {},
  reorderBlocks = () => {},
  groupBlocks = () => {},
  ungroupBlock = () => {},
  // Block position tracking
  blockPositions = {}, // Map of blockId -> {x, y, width, height}
  setBlockPositions = () => {},
  // Simple card layout tracking
  cardLayouts = {},
  setCardLayouts = () => {},
  hoveredBlockId = null,
  setHoveredBlockId = () => {},
  isAuthor = true,
  dismissMenus = () => {},
  preventNextAutoScroll = () => {},
  toolbarId = 'newton-toolbar'
}) => {
  const styles = createNoteStyles;
  const blockRef = useRef(null);
  
  if (block.type === 'card') {
    console.log('🎯 CARD block detected in NoteBlockRenderer:', block.id);
  }



  // Legacy drag-to-resize functionality (keeping for backward compatibility)
  const createCardPanResponder = (blockId, index) => {
    let startX = 0;
    let isDragging = false;
    
    return PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        console.log('🎯 Touch start on drag handle for:', blockId);
        console.log('🎯 Start event details:', {
          pageX: evt.nativeEvent.pageX,
          pageY: evt.nativeEvent.pageY,
          locationX: evt.nativeEvent.locationX,
          locationY: evt.nativeEvent.locationY
        });
        startX = evt.nativeEvent.pageX;
        return true; // Take control immediately for testing
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy, numberActiveTouches } = gestureState;
        const currentX = evt.nativeEvent.pageX;
        const actualDx = currentX - startX;
        
        // Lower threshold for testing - only require 5px movement
        const shouldRespond = numberActiveTouches === 1 && Math.abs(actualDx) > 5;
        console.log('🎯 Move check:', { 
          dx, 
          actualDx, 
          dy, 
          startX, 
          currentX, 
          shouldRespond,
          numberActiveTouches,
          absActualDx: Math.abs(actualDx),
          absDy: Math.abs(dy)
        });
        return shouldRespond;
      },
      onPanResponderGrant: (evt, gestureState) => {
        console.log('🎯 Card drag GRANTED for:', blockId);
        isDragging = true;
        startX = evt.nativeEvent.pageX;
        setDragGuideline({ visible: true, position: 'center' });
      },
      onPanResponderMove: (evt, gestureState) => {
        console.log('🎯 PanResponderMove called, isDragging:', isDragging);
        
        const currentX = evt.nativeEvent.pageX;
        const actualDx = currentX - startX;
        const threshold = 30; // Lower threshold for testing
        
        console.log('🎯 Card drag MOVE:', {
          actualDx,
          gestureStateDx: gestureState.dx,
          currentX,
          startX,
          threshold,
          isDragging
        });
        
        let newMode = 'full';
        let guidelinePosition = 'center';
        
        if (actualDx < -threshold) {
          newMode = 'grid-left';
          guidelinePosition = 'left';
        } else if (actualDx > threshold) {
          newMode = 'grid-right';
          guidelinePosition = 'right';
        }
        
        console.log('🎯 Layout calculation:', {
          actualDx,
          threshold,
          newMode,
          guidelinePosition
        });
        
        setDragGuideline({ visible: true, position: guidelinePosition });
        
        console.log('🔥 Setting new layoutMode:', newMode, 'for block:', blockId);
        
        // Update both legacy and new systems
        setCardLayoutModes(prev => {
          const updated = {
            ...prev,
            [blockId]: newMode
          };
          console.log('📝 Updated cardLayoutModes:', updated);
          return updated;
        });
        
        // Also update the new block-based system
        updateBlockLayoutMode(blockId, newMode);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isDragging) return;
        
        const currentX = evt.nativeEvent.pageX;
        const actualDx = currentX - startX;
        const threshold = 30; // Same as move threshold
        
        console.log('🎯 Card drag ENDED for:', blockId, 'actualDx:', actualDx, 'gestureState.dx:', gestureState.dx);
        setDragGuideline({ visible: false, position: 'center' });
        
        let finalMode = 'full';
        if (actualDx < -threshold) {
          finalMode = 'grid-left';
        } else if (actualDx > threshold) {
          finalMode = 'grid-right';
        }
        
        console.log('🎯 Final mode set to:', finalMode);
        
        console.log('🔥 Final layoutMode:', finalMode, 'for block:', blockId);
        
        // Update both legacy and new systems
        setCardLayoutModes(prev => {
          const updated = {
            ...prev,
            [blockId]: finalMode
          };
          console.log('📝 Final cardLayoutModes:', updated);
          return updated;
        });
        
        // Also update the new block-based system
        updateBlockLayoutMode(blockId, finalMode);
        
        isDragging = false;
      },
      onPanResponderTerminate: () => {
        console.log('🎯 Card drag TERMINATED - external interruption');
        setDragGuideline({ visible: false, position: 'center' });
        isDragging = false;
      },
      onPanResponderTerminationRequest: (evt, gestureState) => {
        console.log('🎯 Termination requested, current isDragging:', isDragging);
        return !isDragging; // Allow termination only if not actively dragging
      }
    });
  };

  // Get layout mode for a card (legacy compatibility)
  const getCardLayoutMode = (blockId) => {
    return cardLayoutModes[blockId] || 'full';
  };

  // Get layout-specific styles for cards
  const getCardLayoutStyle = (layoutMode) => {
    switch (layoutMode) {
      case 'grid-left':
        return {
          width: '48%',
          alignSelf: 'flex-start'
        };
      case 'grid-right':
        return {
          width: '48%',
          alignSelf: 'flex-end'
        };
      case 'full':
      default:
        return {
          width: '100%',
          alignSelf: 'stretch'
        };
    }
  };

  if (block.type === 'text') {
    
    // 텍스트 블록 레이아웃 측정 (드롭 존으로 사용)
    const handleTextLayout = (event) => {
      const { height, width } = event.nativeEvent.layout;
      
      if (height > 0 && blockRef.current) {
        blockRef.current.measureInWindow((pageX, pageY, pageWidth, pageHeight) => {
          console.log('📏 Text block layout measured:', block.id, { pageX, pageY, pageWidth, pageHeight });
          setCardLayouts(prev => ({
            ...prev,
            [block.id]: { x: pageX, y: pageY, width: pageWidth, height: pageHeight }
          }));
        });
      }
    };
    
    return (
      <View
        key={block.id}
        ref={blockRef}
        onLayout={handleTextLayout}
      >
        <TextInput
          ref={block.ref}
          style={styles.textInput}
          multiline
          placeholder=" "
          value={block.content}
          onChangeText={(text) => handleTextChange(block.id, text)}
          onPressIn={() => {
            console.log('🎯 Text block pressed, index:', index);
            dismissMenus();
          }}
          onFocus={() => {
            console.log('🔧 Text block focused - index:', index, 'type:', block.type, 'toolbarId:', toolbarId);
            dismissMenus();
            setFocusedIndex(index);
            
            // Let KeyboardAvoidingView handle the positioning
          }}
          onKeyPress={({ nativeEvent }) => {
            handleKeyPress(block, index, nativeEvent.key);
          }}
          onContentSizeChange={({ nativeEvent }) => {
            console.log('📏 Text block content size changed:', nativeEvent.contentSize);
            // Re-measure layout when content size changes
            setTimeout(() => {
              if (blockRef.current) {
                blockRef.current.measureInWindow((pageX, pageY, pageWidth, pageHeight) => {
                  setCardLayouts(prev => ({
                    ...prev,
                    [block.id]: { x: pageX, y: pageY, width: pageWidth, height: pageHeight }
                  }));
                });
              }
            }, 50);
          }}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          textAlignVertical="top"
          scrollEnabled={false}
          editable={isAuthor}
          inputAccessoryViewID={toolbarId}
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
        preventNextAutoScroll={preventNextAutoScroll}
        toolbarId={toolbarId}
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
            value={block.content}
            onChangeText={(text) => handleTextChange(block.id, text)}
            onPressIn={() => {
              console.log('🎯 Grid card block pressed, index:', index);
              dismissMenus();
            }}
            onFocus={() => {
              console.log('🎯 Grid card block focused, index:', index, 'type:', block.type);
              dismissMenus();
              setFocusedIndex(index);
              // Let KeyboardAvoidingView handle positioning
            }}
            onKeyPress={({ nativeEvent }) => {
              handleKeyPress(block, index, nativeEvent.key);
            }}
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            scrollEnabled={false}
            editable={isAuthor}
            inputAccessoryViewID={toolbarId}
            placeholderTextColor={Colors.secondaryText}
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
};