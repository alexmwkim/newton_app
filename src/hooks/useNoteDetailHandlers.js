import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, Keyboard, AppState } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateId, convertBlocksToContent, cleanLegacyContent } from '../utils/noteUtils';
import { useFormatting } from '../components/toolbar/ToolbarFormatting';

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
  
  const { activeFormats, resetFormatsForNewBlock } = useFormatting();

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
        // ✅ 자동 스크롤 제거 - AUTO_SCROLL_OPTIMIZATION.md 권장사항
        // 키보드가 이미 보이는 상태에서는 스크롤하지 않음
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
        // ✅ 자동 스크롤 제거 - AUTO_SCROLL_OPTIMIZATION.md 권장사항
        // 키보드가 이미 보이는 상태에서는 스크롤하지 않음
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
              // ✅ 자동 스크롤 제거 - AUTO_SCROLL_OPTIMIZATION.md 권장사항
              // 키보드가 이미 보이는 상태에서는 스크롤하지 않음
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
    if (key === 'Enter') {
      console.log('⏎ Enter key - creating new block after:', block.content);
      console.log('⏎ Current activeFormats:', activeFormats);
      
      // 현재 블록에 포맷 정보 저장 (포맷 유지를 위해)
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
      
      // Notion 방식: 새 블록 생성 및 포맷 리셋
      const newBlock = {
        id: generateId(),
        type: 'text',
        content: '',
        ref: React.createRef(),
        layoutMode: 'full',
        groupId: null,
        savedFormats: null // 새 블록은 기본 포맷
      };
      
      setTimeout(() => {
        setBlocks(prev => {
          const updated = [...prev];
          updated.splice(index + 1, 0, newBlock);
          return updated;
        });
        
        // New block created
        
        // 새 블록으로 포커스 이동 및 포맷 리셋
        setTimeout(() => {
          // 먼저 포맷 리셋 (포커스 변경 전에)
          resetFormatsForNewBlock(); 
          // Format reset for new block
          
          // 그 다음 포커스 변경
          newBlock.ref.current?.focus();
          setFocusedIndex(index + 1);
          // Focus moved to new block
          
          // ✅ 새 블록 생성 시에는 자동 스크롤 필요 (업계 표준)
          if (keyboardVisible && keyboardHeight > 0) {
            setTimeout(() => {
              // New block created - triggering auto-scroll
              scrollToFocusedInput(keyboardHeight, 'new_block_created');
            }, 150); // 포커스가 완전히 이동한 후 스크롤
          }
        }, 50);
      }, 10); // 블록 저장 후 새 블록 생성
      
    } else if (key === 'Backspace') {
      if (block.content === '' && index > 0) {
        // Backspace on empty block - merging with previous
        
        const prevBlock = blocks[index - 1];
        
        if (prevBlock.type === 'text') {
          // ✅ 키보드 안정성을 위해 포커스를 먼저 이동 (블록 제거 전에)
          const textLength = prevBlock.content.length;
          
          // 1단계: 즉시 포커스 이동 (연속성 보장)
          prevBlock.ref.current?.focus();
          setFocusedIndex(index - 1);
          
          // 2단계: 커서 위치 설정
          setTimeout(() => {
            if (prevBlock.ref.current?.setSelection) {
              prevBlock.ref.current.setSelection(textLength, textLength);
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

  const handleTextChange = useCallback((id, text) => {
    // Notion 방식: 단일 라인 블록이므로 \n 분리 로직 불필요
    console.log('✏️ Text changed in block:', id, 'New text:', text.substring(0, 20));
    
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