import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateId } from '../utils/noteUtils';
import { useFormatting } from '../components/toolbar/ToolbarFormatting';

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
  
  const { activeFormats } = useFormatting();
  
  const insertBlockSet = useCallback((index, blockSet, focusIndex) => {
    // 🔧 FIX: 안전한 인덱스 경계 체크 - useNoteDetailHandlers와 동기화
    const safeIndex = Math.min(Math.max(0, index), blocks.length - 1);
    const currentBlock = blocks[safeIndex];
    const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
    const isIndexOutOfBounds = index >= blocks.length;
    
    const updated = [...blocks];
    
    if (isIndexOutOfBounds) {
      // 🔧 인덱스가 범위를 벗어난 경우: 마지막에 추가
      updated.push(...blockSet);
    } else if (hasContent) {
      // 텍스트가 있는 경우: 다음 줄에 삽입
      updated.splice(safeIndex + 1, 0, ...blockSet);
    } else {
      // 빈 블록인 경우: 교체
      updated.splice(safeIndex, 1, ...blockSet);
    }
    
    setBlocks(updated);
    
    setTimeout(() => {
      let targetIndex;
      if (isIndexOutOfBounds) {
        // 인덱스 범위 초과 시: 새로 추가된 첫 번째 블록에 포커스
        targetIndex = updated.length - blockSet.length;
      } else if (hasContent) {
        targetIndex = safeIndex + 1 + (focusIndex - index);
      } else {
        targetIndex = focusIndex;
      }
      
      const targetRef = updated[targetIndex]?.ref;
      if (targetRef?.current?.focus) {
        targetRef.current.focus();
        setFocusedIndex(targetIndex);
        // ✅ 자동 스크롤 제거 - AUTO_SCROLL_OPTIMIZATION.md 권장사항
        // 키보드가 이미 보이는 상태에서는 스크롤하지 않음
      }
    }, 50); // 더 빠른 포커스
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput]);

  const handleAddCard = useCallback((index) => {
    // 🔧 FIX: 더 안전한 인덱스 처리 - 범위를 벗어난 경우는 마지막에 추가
    let targetIndex = index;
    let currentBlock = null;
    
    // 인덱스가 유효한 범위인지 확인
    if (index >= 0 && index < blocks.length) {
      currentBlock = blocks[index];
      targetIndex = index;
    } else {
      // 범위를 벗어난 경우 마지막 블록 사용
      targetIndex = blocks.length - 1;
      currentBlock = blocks[targetIndex];
    }
    
    const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
    const isCurrentBlockCard = currentBlock && currentBlock.type === 'card';
    
    console.log('🔧 Adding card at index:', index);
    console.log('🔧 Blocks length:', blocks.length);
    console.log('🔧 Target index:', targetIndex);
    console.log('🔧 Current block:', currentBlock);
    console.log('🔧 Current block type:', currentBlock?.type);
    console.log('🔧 Is current block card:', isCurrentBlockCard);
    console.log('🔧 Has content:', hasContent);
    console.log('🔧 Current content:', currentBlock?.content);
    
    const card = {
      id: generateId(),
      type: 'card',
      content: '',
      ref: React.createRef(),
      layoutMode: 'full',
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
    
    // 🔧 FIX: 텍스트가 있거나 카드 블록이면 항상 다음 줄에 삽입 (교체하지 않음)
    if (hasContent || isCurrentBlockCard || index >= blocks.length) {
      // 텍스트가 있거나 카드인 경우: 다음 줄에 카드 삽입 (기존 내용 보존)
      const updated = [...blocks];
      const insertIndex = Math.min(targetIndex + 1, blocks.length);
      updated.splice(insertIndex, 0, card, trailingText);
      setBlocks(updated);
      
      console.log('🔧 Inserted card after current block (preserving existing content)');
      
      // 새로 생성된 카드에 포커스
      setTimeout(() => {
        card.ref?.current?.focus();
        setFocusedIndex(insertIndex);
      }, 100);
    } else {
      // 완전히 빈 텍스트 블록인 경우에만 교체
      console.log('🔧 Replacing empty text block with card');
      insertBlockSet(targetIndex, [card, trailingText], targetIndex);
    }
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput, insertBlockSet]);


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
        layoutMode: 'full',
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
          // ✅ 자동 스크롤 제거 - AUTO_SCROLL_OPTIMIZATION.md 권장사항
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
      // 🔧 FIX: 노트디테일페이지와 동일한 로직 적용
      console.log('⏎ Enter key - creating new block after:', block.content);
      console.log('⏎ Current activeFormats:', activeFormats);
      
      // 1단계: 현재 블록에 포맷 정보 저장 (포맷 유지를 위해) - 노트디테일과 동일
      setBlocks(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            savedFormats: { ...activeFormats } // 현재 포맷 저장
          };
        }
        return updated;
      });
      
      // 2단계: Notion 방식으로 새 블록 생성 및 포맷 리셋
      const newBlock = {
        id: generateId(),
        type: 'text',
        content: '',
        ref: React.createRef(),
        layoutMode: 'full',
        groupId: null,
        savedFormats: {
          // Notion 스타일: 텍스트 포맷(bold, italic)은 유지, 헤딩은 초기화
          bold: activeFormats?.bold || false,
          italic: activeFormats?.italic || false,
          heading1: false, // 헤딩은 새 줄에서 초기화
          heading2: false,
          heading3: false
        }
      };
      
      setTimeout(() => {
        setBlocks(prev => {
          const updated = [...prev];
          updated.splice(index + 1, 0, newBlock);
          return updated;
        });
        
        // 3단계: 새 블록으로 포커스 이동 및 포맷 리셋 (노트디테일과 동일)
        setTimeout(() => {
          // 🔧 새 블록으로 포커스 시 NoteBlockRenderer의 onFocus에서 자동으로 
          // savedFormats를 툴바에 동기화하므로 별도 처리 불필요
          
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
    // Text changed in block - save activeFormats to savedFormats
    setBlocks(prev => prev.map(block => 
      block.id === id ? { 
        ...block, 
        content: text,
        // ✅ FIX: 텍스트 변경 시 즉시 포맷 저장 (노트디테일과 동일)
        savedFormats: activeFormats && Object.keys(activeFormats).length > 0 ? { ...activeFormats } : block.savedFormats
      } : block
    ));
  }, [setBlocks, activeFormats]);

  return {
    handleAddCard,
    handleAddImage,
    handleKeyPress,
    handleDeleteBlock,
    handleTextChange
  };
};