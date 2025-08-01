import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateId } from '../utils/noteUtils';

export const useNoteInsertHandlers = (
  blocks, 
  setBlocks, 
  setFocusedIndex, 
  keyboardVisible, 
  keyboardHeight, 
  scrollToFocusedInput,
  cardLayoutModes,
  setCardLayoutModes
) => {
  
  const insertBlockSet = useCallback((index, blockSet, focusIndex) => {
    const updated = [...blocks];
    // Replace current block instead of inserting after it
    updated.splice(index, 1, ...blockSet);
    setBlocks(updated);
    
    console.log('🔧 Block set inserted');
    
    setTimeout(() => {
      const targetRef = updated[focusIndex]?.ref;
      if (targetRef?.current?.focus) {
        targetRef.current.focus();
        setFocusedIndex(focusIndex);
        // Auto-scroll to the focused element
        if (keyboardVisible) {
          setTimeout(() => scrollToFocusedInput(keyboardHeight), 100);
        }
      }
    }, 100);
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput]);

  const handleAddCard = useCallback((index) => {
    const card = {
      id: generateId(),
      type: 'card',
      content: '',
      ref: React.createRef(),
    };
    const trailingText = {
      id: generateId(),
      type: 'text',
      content: '',
      ref: React.createRef(),
    };
    // Focus on the card (first element in the set)
    insertBlockSet(index, [card, trailingText], index);
  }, [insertBlockSet]);

  const handleAddImage = useCallback(async (index) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      const image = {
        id: generateId(),
        type: 'image',
        content: uri,
      };
      const trailingText = {
        id: generateId(),
        type: 'text',
        content: '',
        ref: React.createRef(),
      };
      // Focus on the trailing text after image (second element in the set)
      insertBlockSet(index, [image, trailingText], index + 1);
    }
  }, [insertBlockSet]);

  // Handle backspace navigation between blocks
  const handleKeyPress = useCallback((block, index, key) => {
    if (key === 'Backspace') {
      // If current block is empty and user presses backspace
      if (block.content === '' && index > 0) {
        const previous = blocks[index - 1];
        
        // If previous block is text, merge/focus to it
        if (previous.type === 'text') {
          const updated = [...blocks];
          // Remove current empty block
          updated.splice(index, 1);
          setBlocks(updated);
          
          // Focus on previous block at the end
          setTimeout(() => {
            previous.ref?.current?.focus();
            const textLength = previous.content.length;
            previous.ref?.current?.setSelection(textLength, textLength);
          }, 50);
        }
      }
    }
  }, [blocks, setBlocks]);

  const handleDeleteBlock = useCallback((index) => {
    Alert.alert('삭제 확인', '이 블록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive', onPress: () => {
          const updated = [...blocks];
          const deletedBlock = updated[index];
          updated.splice(index, 1);
          setBlocks(updated);
          
          // Clean up card layout mode state
          if (deletedBlock.type === 'card') {
            setCardLayoutModes(prev => {
              const newModes = { ...prev };
              delete newModes[deletedBlock.id];
              return newModes;
            });
          }
        }
      }
    ]);
  }, [blocks, setBlocks, setCardLayoutModes]);

  const handleTextChange = useCallback((id, text) => {
    console.log('✏️ Text changed in block:', id, 'New text length:', text.length);
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: text } : b));
  }, [setBlocks]);

  return {
    handleAddCard,
    handleAddImage,
    handleKeyPress,
    handleDeleteBlock,
    handleTextChange
  };
};