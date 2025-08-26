import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, Keyboard, AppState } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateId, convertBlocksToContent, cleanLegacyContent } from '../utils/noteUtils';

export const useNoteDetailHandlers = (
  blocks,
  setBlocks,
  focusedIndex,
  setFocusedIndex,
  keyboardVisible,
  keyboardHeight,
  scrollToFocusedInput,
  title,
  displayNote,
  isAuthor,
  noteId,
  loadingNote,
  updateNote
) => {

  const insertBlockSet = useCallback((index, blockSet, focusIndex) => {
    const currentBlock = blocks[index];
    const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
    
    console.log('🎯 insertBlockSet called:', {
      index,
      blockSetLength: blockSet.length,
      blockTypes: blockSet.map(b => b.type),
      currentBlocks: blocks.length,
      hasContent,
      currentContent: currentBlock?.content
    });
    
    const updated = [...blocks];
    
    if (hasContent) {
      // 텍스트가 있는 경우: 다음 줄에 삽입
      updated.splice(index + 1, 0, ...blockSet);
      console.log('🎯 Inserted after current block (preserving text)');
    } else {
      // 빈 블록인 경우: 교체
      updated.splice(index, 1, ...blockSet);
      console.log('🎯 Replaced empty block');
    }
    
    console.log('🎯 setBlocks called with:', updated.length, 'blocks');
    console.log('🎯 Block types after update:', updated.map(b => `${b.type}(${b.id})`));
    
    setBlocks(updated);
    
    console.log('🔧 Block set inserted, triggering auto-save');
    
    setTimeout(() => {
      const targetIndex = hasContent ? index + 1 + (focusIndex - index) : focusIndex;
      const targetRef = updated[targetIndex]?.ref;
      if (targetRef?.current?.focus) {
        targetRef.current.focus();
        setFocusedIndex(targetIndex);
        // 즉시 스크롤 (키보드가 올라와 있을 때)
        if (keyboardVisible && keyboardHeight > 100) {
          setTimeout(() => scrollToFocusedInput(keyboardHeight), 10);
        }
      }
    }, 50); // 더 빠른 포커스
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput]);

  const handleAddCard = useCallback((index) => {
    const currentBlock = blocks[index];
    const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
    const isCurrentBlockCard = currentBlock && currentBlock.type === 'card';
    
    console.log('🔧 Adding card at index:', index);
    console.log('🔧 Current block:', currentBlock);
    console.log('🔧 Current block type:', currentBlock?.type);
    console.log('🔧 Is current block card:', isCurrentBlockCard);
    console.log('🔧 Has content:', hasContent);
    console.log('🔧 Current content:', JSON.stringify(currentBlock?.content));
    
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
    
    if (isCurrentBlockCard || hasContent) {
      // 카드에서 카드 생성하거나 텍스트가 있는 경우: 현재 블록 다음에 카드 삽입
      const updated = [...blocks];
      updated.splice(index + 1, 0, card, trailingText);
      setBlocks(updated);
      
      console.log('🔧 Inserted card after current block');
      
      // 새로 생성된 카드에 포커스 - 빠른 반응
      setTimeout(() => {
        card.ref?.current?.focus();
        setFocusedIndex(index + 1);
        // 즉시 스크롤 (키보드가 올라와 있을 때)
        if (keyboardVisible && keyboardHeight > 0) {
          setTimeout(() => scrollToFocusedInput(keyboardHeight), 10);
        }
      }, 50); // 더 빠른 포커스
    } else {
      // 빈 텍스트 블록인 경우: 기존 로직 (블록 교체)
      console.log('🔧 Replacing empty text block with card');
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
    console.log('🎬 handleAddImage CALLED with index:', index);
    
    // 키보드 상태 저장
    const wasKeyboardVisible = keyboardVisible;
    const savedKeyboardHeight = keyboardHeight;
    
    console.log('💾 Saving keyboard state:', {
      wasKeyboardVisible,
      savedKeyboardHeight
    });

    let result;
    try {
      console.log('📱 Opening ImagePicker...');
      
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
      });
      
      console.log('📱 ✅ ImagePicker result:', result);
      
    } catch (error) {
      console.log('📱 ❌ ImagePicker error:', error);
      // Fallback to dummy image
      result = {
        canceled: false,
        assets: [{
          uri: 'https://picsum.photos/400/300?random=' + Date.now(),
          width: 400,
          height: 300
        }]
      };
    }
    
    if (!result.canceled && result.assets?.length > 0) {
      const currentBlock = blocks[index];
      const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
      const isCurrentBlockCard = currentBlock && currentBlock.type === 'card';
      
      console.log('🔧 Adding image at index:', index);
      
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
        // 현재 블록 다음에 이미지 삽입
        const updated = [...blocks];
        updated.splice(index + 1, 0, image, trailingText);
        setBlocks(updated);
        
        console.log('🔧 Inserted image after current block');
        
        // 강화된 키보드 복원 로직
        setTimeout(() => {
          console.log('🔧 Focusing text after image...');
          trailingText.ref?.current?.focus();
          setFocusedIndex(index + 2);
          
          // 키보드 복원 (여러 번 시도)
          if (wasKeyboardVisible) {
            console.log('⌨️ Starting keyboard restoration...');
            
            // 즉시 시도
            setTimeout(() => {
              console.log('⌨️ Attempt 1: Immediate focus');
              trailingText.ref?.current?.focus();
            }, 50);
            
            // 조금 후 시도
            setTimeout(() => {
              console.log('⌨️ Attempt 2: Delayed focus');
              trailingText.ref?.current?.focus();
              if (scrollToFocusedInput) {
                scrollToFocusedInput(savedKeyboardHeight || 300);
              }
            }, 300);
            
            // 마지막 시도
            setTimeout(() => {
              console.log('⌨️ Attempt 3: Final focus');
              trailingText.ref?.current?.focus();
            }, 800);
          }
        }, 100);
      } else {
        // 빈 블록 교체
        insertBlockSet(index, [image, trailingText], index + 1);
      }
    }
  }, [blocks, setBlocks, setFocusedIndex, insertBlockSet, keyboardVisible, keyboardHeight, scrollToFocusedInput]);

  const handleDeleteBlock = useCallback((index) => {
    Alert.alert('Delete Block', 'Are you sure you want to delete this block?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          const updated = [...blocks];
          updated.splice(index, 1);
          setBlocks(updated);
        }
      }
    ]);
  }, [blocks, setBlocks]);

  const handleKeyPress = useCallback((block, index, key) => {
    if (key === 'Backspace') {
      if (block.content === '' && index > 0) {
        const updated = [...blocks];
        const prevBlock = updated[index - 1];
        
        if (prevBlock.type === 'text') {
          updated.splice(index, 1);
          setBlocks(updated);
          
          setTimeout(() => {
            prevBlock.ref.current?.focus();
            const textLength = prevBlock.content.length;
            prevBlock.ref.current?.setSelection(textLength, textLength);
          }, 50);
        }
      }
    }
  }, [blocks, setBlocks]);

  const handleTextChange = useCallback((id, text) => {
    // console.log('✏️ Text changed in block:', id, 'New text length:', text.length); // 로그 간소화
    setBlocks(prev => {
      const updated = prev.map(block => {
        if (block.id === id) {
          return { ...block, content: text };
        }
        return block;
      });
      // console.log('🔄 Blocks updated, total blocks:', updated.length); // 로그 간소화
      return updated;
    });
  }, [setBlocks]);

  // Enhanced auto-save with different delays for title vs content
  useEffect(() => {
    if (!isAuthor || loadingNote || !noteId || !updateNote) {
      return;
    }
    
    const finalTitle = title?.trim() || '';
    const finalContent = convertBlocksToContent(blocks);
    
    // 제목만 변경된 경우 더 빠르게 저장 (500ms)
    // 콘텐츠 변경은 기본 속도 (800ms)
    const delay = 800; // 통일된 빠른 속도
    
    const timer = setTimeout(async () => {
      try {
        const result = await updateNote(noteId, {
          title: finalTitle || 'Untitled',
          content: finalContent
        });
        console.log('✅ Auto-save SUCCESS (800ms delay)');
      } catch (error) {
        console.error('❌ Auto-save ERROR:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [title, blocks, isAuthor, noteId, loadingNote]);

  return {
    handleAddCard,
    handleAddGrid,
    handleAddImage,
    handleDeleteBlock,
    handleKeyPress,
    handleTextChange
  };
};