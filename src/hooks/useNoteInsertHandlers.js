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
    const currentBlock = blocks[index];
    const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
    
    const updated = [...blocks];
    
    if (hasContent) {
      // 텍스트가 있는 경우: 다음 줄에 삽입
      updated.splice(index + 1, 0, ...blockSet);
      // Block set inserted after current block
    } else {
      // 빈 블록인 경우: 교체
      updated.splice(index, 1, ...blockSet);
      // Block set replaced empty block
    }
    
    setBlocks(updated);
    
    setTimeout(() => {
      const targetIndex = hasContent ? index + 1 + (focusIndex - index) : focusIndex;
      const targetRef = updated[targetIndex]?.ref;
      if (targetRef?.current?.focus) {
        targetRef.current.focus();
        setFocusedIndex(targetIndex);
        // Auto-scroll to the focused element
        if (keyboardVisible) {
          setTimeout(() => scrollToFocusedInput(keyboardHeight), 100);
        }
      }
    }, 100);
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput]);

  const handleAddCard = useCallback((index) => {
    const currentBlock = blocks[index];
    const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
    const isCurrentBlockCard = currentBlock && currentBlock.type === 'card';
    
    // Adding card at index
    
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
    
    if (isCurrentBlockCard || hasContent) {
      // 카드에서 카드 생성하거나 텍스트가 있는 경우: 현재 블록 다음에 카드 삽입
      const updated = [...blocks];
      updated.splice(index + 1, 0, card, trailingText);
      setBlocks(updated);
      
      // Inserted card after current block
      
      // 새로 생성된 카드에 포커스
      setTimeout(() => {
        card.ref?.current?.focus();
        setFocusedIndex(index + 1);
        if (keyboardVisible) {
          setTimeout(() => scrollToFocusedInput(keyboardHeight), 100);
        }
      }, 100);
    } else {
      // 빈 텍스트 블록인 경우: 기존 로직 (블록 교체)
      // Replacing empty text block with card
      insertBlockSet(index, [card, trailingText], index);
    }
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput, insertBlockSet]);

  const handleAddGrid = useCallback((index) => {
    const gridCard = {
      id: generateId(),
      type: 'grid-card',
      content: '',
      ref: React.createRef(),
      layoutMode: 'grid-left',
      groupId: null
    };
    const trailingText = {
      id: generateId(),
      type: 'text',
      content: '',
      ref: React.createRef(),
      layoutMode: 'full',
      groupId: null
    };
    // Focus on the grid card (first element in the set)
    insertBlockSet(index, [gridCard, trailingText], index);
  }, [insertBlockSet]);

  const handleAddImage = useCallback(async (index) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const currentBlock = blocks[index];
      const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
      const isCurrentBlockCard = currentBlock && currentBlock.type === 'card';
      
      // Adding image at index
      
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
      
      if (isCurrentBlockCard || hasContent) {
        // 카드에서 이미지 생성하거나 텍스트가 있는 경우: 현재 블록 다음에 이미지 삽입
        const updated = [...blocks];
        updated.splice(index + 1, 0, image, trailingText);
        setBlocks(updated);
        
        // Inserted image after current block
        
        // 이미지 다음의 텍스트 블록에 포커스
        setTimeout(() => {
          trailingText.ref?.current?.focus();
          setFocusedIndex(index + 2); // 이미지 다음 텍스트로
          if (keyboardVisible) {
            setTimeout(() => scrollToFocusedInput(keyboardHeight), 100);
          }
        }, 100);
      } else {
        // 빈 텍스트 블록인 경우: 기존 로직 (블록 교체)
        // Replacing empty text block with image
        insertBlockSet(index, [image, trailingText], index + 1);
      }
    }
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput, insertBlockSet]);

  // Handle Enter and Backspace navigation between blocks
  const handleKeyPress = useCallback((block, index, key) => {
    if (key === 'Enter') {
      // Enter key - create new text block
      const newBlock = {
        id: generateId(),
        type: 'text',
        content: '',
        ref: React.createRef()
      };
      
      setTimeout(() => {
        setBlocks(prev => {
          const updated = [...prev];
          updated.splice(index + 1, 0, newBlock);
          return updated;
        });
        
        // Focus new block after creation
        setTimeout(() => {
          newBlock.ref.current?.focus();
          setFocusedIndex(index + 1);
          
          // Auto-scroll for new block creation
          if (keyboardVisible && keyboardHeight > 0) {
            setTimeout(() => {
              scrollToFocusedInput(keyboardHeight, 'new_block_created');
            }, 100);
          }
        }, 50);
      }, 10);
      
    } else if (key === 'Backspace') {
      // If current block is empty and user presses backspace
      if (block.content === '' && index > 0) {
        const previous = blocks[index - 1];
        
        // If previous block is text, merge/focus to it
        if (previous.type === 'text') {
          // ✅ 키보드 안정성을 위해 포커스를 먼저 이동 (블록 제거 전에)
          const textLength = previous.content.length;
          
          // 1단계: 즉시 포커스 이동 (연속성 보장)
          previous.ref?.current?.focus();
          setFocusedIndex(index - 1);
          
          // 2단계: 커서 위치 설정
          setTimeout(() => {
            if (previous.ref?.current?.setSelection) {
              previous.ref.current.setSelection(textLength, textLength);
            }
          }, 10);
          
          // 3단계: 블록 제거 (포커스 안정 후)
          setTimeout(() => {
            setBlocks(prev => prev.filter((_, i) => i !== index));
            // Empty block removed after focus stabilization
          }, 20);
          
          // 4단계: 스크롤 안정화 (선택사항)
          if (keyboardVisible && keyboardHeight > 0) {
            setTimeout(() => {
              // Block merge - stabilizing scroll
              scrollToFocusedInput(keyboardHeight, 'block_merge_backspace');
            }, 150); // 모든 단계 완료 후
          }
        }
      }
    }
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput]);

  const handleDeleteBlock = useCallback((index) => {
    Alert.alert('Delete Confirmation', 'Do you want to delete this block?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
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
    // Text changed in block
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: text } : b));
  }, [setBlocks]);

  return {
    handleAddCard,
    handleAddGrid,
    handleAddImage,
    handleKeyPress,
    handleDeleteBlock,
    handleTextChange
  };
};