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
  updateNote,
  setIsActivelyEditing
) => {
  
  const { activeFormats, resetFormatsForNewBlock } = useFormatting();

  const insertBlockSet = useCallback((index, blockSet, focusIndex) => {
    // 🚨 FIX: 편집 시작 플래그 설정 - 서버 데이터 덮어쓰기 방지
    setIsActivelyEditing?.(true);
    
    // 🔧 FIX: 안전한 인덱스 경계 체크
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
        // ✅ KeyboardAwareScrollView 사용으로 자동 스크롤 제거
        // KeyboardAwareScrollView가 자동으로 포커스 추적 및 스크롤 처리
      }
    }, 50); // 더 빠른 포커스
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput]);

  const handleAddCard = useCallback((index) => {
    // 🚨 FIX: 편집 시작 플래그 설정 - 마이그레이션 방지 (최우선)
    setIsActivelyEditing?.(true);
    
    // 🔧 FIX: 최신 블록 상태 사용 - setTimeout으로 상태 업데이트 완료 대기
    setTimeout(() => {
      setBlocks(currentBlocks => {
        console.log('🔧 handleAddCard with fresh blocks:', currentBlocks.length);
        
        // 🔧 FIX: 더 안전한 인덱스 처리 - 범위를 벗어난 경우는 마지막에 추가
        let targetIndex = index;
        let currentBlock = null;
        
        // 인덱스가 유효한 범위인지 확인
        if (index >= 0 && index < currentBlocks.length) {
          currentBlock = currentBlocks[index];
          targetIndex = index;
        } else {
          // 범위를 벗어난 경우 마지막 블록 사용
          targetIndex = Math.max(0, currentBlocks.length - 1);
          currentBlock = currentBlocks[targetIndex];
        }
        
        const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
        const isCurrentBlockCard = currentBlock && currentBlock.type === 'card';
        
        console.log('🔧 Adding card at index:', index);
        console.log('🔧 Blocks length:', currentBlocks.length);
        console.log('🔧 Target index:', targetIndex);
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
          groupId: null,
          savedFormats: null // 🆕 포맷 정보 필드 추가
        };
        
        // 🔧 FIX: 텍스트가 있거나 카드 블록이면 항상 다음 줄에 삽입 (교체하지 않음)
        if (hasContent || isCurrentBlockCard || index >= currentBlocks.length) {
          // 텍스트가 있거나 카드인 경우: 다음 줄에 카드 삽입 (기존 내용 보존)
          const updated = [...currentBlocks];
          const insertIndex = Math.min(targetIndex + 1, currentBlocks.length);
          updated.splice(insertIndex, 0, card, trailingText);
          
          console.log('🔧 Inserted card after current block (preserving existing content)');
          
          // 새로 생성된 카드에 즉시 포커스 - 키보드 유지
          setTimeout(() => {
            if (card.ref?.current) {
              card.ref.current.focus();
              setFocusedIndex?.(insertIndex);
            }
          }, 20);
          
          return updated;
        } else {
          // 완전히 빈 텍스트 블록인 경우에만 교체
          console.log('🔧 Replacing empty text block with card');
          const updated = [...currentBlocks];
          updated.splice(targetIndex, 1, card, trailingText);
          
          setTimeout(() => {
            if (card.ref?.current) {
              card.ref.current.focus();
              setFocusedIndex?.(targetIndex);
            }
          }, 20);
          
          return updated;
        }
      });
    }, 10); // 상태 업데이트 완료 대기
  }, [setBlocks, setFocusedIndex, setIsActivelyEditing]);


  const handleAddImage = useCallback(async (index) => {
    console.log('🎬 handleAddImage CALLED with index:', index);
    
    // 🚨 FIX: 편집 시작 플래그 설정 - 마이그레이션 방지 (최우선)
    setIsActivelyEditing?.(true);
    
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
      // 🔧 FIX: 최신 블록 상태 사용 - setTimeout으로 상태 업데이트 완료 대기
      setTimeout(() => {
        setBlocks(currentBlocks => {
          console.log('🔧 handleAddImage with fresh blocks:', currentBlocks.length);
          
          // 🔧 FIX: 더 안전한 인덱스 처리
          let targetIndex = index;
          let currentBlock = null;
          
          if (index >= 0 && index < currentBlocks.length) {
            currentBlock = currentBlocks[index];
            targetIndex = index;
          } else {
            targetIndex = Math.max(0, currentBlocks.length - 1);
            currentBlock = currentBlocks[targetIndex];
          }
          
          const hasContent = currentBlock && currentBlock.content && currentBlock.content.trim() !== '';
          const isCurrentBlockCard = currentBlock && currentBlock.type === 'card';
          
          console.log('🔧 Adding image at index:', index);
          console.log('🔧 Blocks length:', currentBlocks.length);
          console.log('🔧 Target index:', targetIndex);
          console.log('🔧 Current block:', currentBlock);
          console.log('🔧 Has content:', hasContent);
          
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
          
          if (isCurrentBlockCard || hasContent || index >= currentBlocks.length) {
            // 현재 블록 다음에 이미지 삽입 (기존 내용 보존)
            const updated = [...currentBlocks];
            const insertIndex = Math.min(targetIndex + 1, currentBlocks.length);
            updated.splice(insertIndex, 0, image, trailingText);
            
            console.log('🔧 Inserted image after current block (preserving existing content)');
            
            // 강화된 키보드 복원 로직
            setTimeout(() => {
              console.log('🔧 Focusing text after image...');
              trailingText.ref?.current?.focus();
              setFocusedIndex(insertIndex + 1); // trailingText는 이미지 다음 위치
              
              // 키보드 복원 (여러 번 시도)
              if (wasKeyboardVisible) {
                console.log('⌨️ Starting keyboard restoration...');
                
                setTimeout(() => {
                  console.log('⌨️ Attempt 1: Immediate focus');
                  trailingText.ref?.current?.focus();
                }, 50);
                
                setTimeout(() => {
                  console.log('⌨️ Attempt 2: Delayed focus');
                  trailingText.ref?.current?.focus();
                }, 300);
                
                setTimeout(() => {
                  console.log('⌨️ Attempt 3: Final focus');
                  trailingText.ref?.current?.focus();
                }, 800);
              }
            }, 100);
            
            return updated;
          } else {
            // 완전히 빈 텍스트 블록인 경우에만 교체
            console.log('🔧 Replacing empty text block with image');
            const updated = [...currentBlocks];
            updated.splice(targetIndex, 1, image, trailingText);
            
            setTimeout(() => {
              trailingText.ref?.current?.focus();
              setFocusedIndex(targetIndex + 1);
            }, 100);
            
            return updated;
          }
        });
      }, 10); // 상태 업데이트 완료 대기
    }
  }, [setBlocks, setFocusedIndex, setIsActivelyEditing, keyboardVisible, keyboardHeight]);

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
      // 카드 블록인 경우 엔터 키로 새 블록을 생성하지 않음 (카드 내부 줄바꿈만 허용)
      if (block.type === 'card') {
        console.log('⏎ Enter key in card block - allowing internal line break only');
        return false; // MultilineFormattedInput에 내부 처리를 계속하도록 지시
      }
      
      // 🚨 FIX: 편집 시작 플래그 설정 - 서버 데이터 덮어쓰기 방지
      setIsActivelyEditing?.(true);
      
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
        
        // New block created
        
        // 새 블록으로 포커스 이동 및 포맷 리셋
        setTimeout(() => {
          // 먼저 포맷 리셋 (포커스 변경 전에)
          // 🔧 새 블록으로 포커스 시 NoteBlockRenderer의 onFocus에서 자동으로 
          // savedFormats를 툴바에 동기화하므로 별도 처리 불필요
          
          // 그 다음 포커스 변경
          newBlock.ref.current?.focus();
          setFocusedIndex(index + 1);
          // Focus moved to new block
          
          // ✅ KeyboardAwareScrollView 사용 시에는 자동 스크롤 비활성화
          // KeyboardAwareScrollView가 자동으로 스크롤 처리하므로 수동 스크롤 제거
          // ReadmeDetailScreen과 NoteDetailScreen 모두 KeyboardAwareScrollView 사용
        }, 50);
      }, 10); // 블록 저장 후 새 블록 생성
      
    } else if (key === 'Backspace') {
      if (block.content === '' && index > 0) {
        // 🚨 FIX: 편집 시작 플래그 설정 - 서버 데이터 덮어쓰기 방지
        setIsActivelyEditing?.(true);
        
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
          
          // 4단계: 스크롤 안정화 제거 - KeyboardAwareScrollView가 처리
          // KeyboardAwareScrollView가 자동으로 포커스된 입력 필드를 화면에 유지
        } else if (prevBlock.type === 'card') {
          // 🔧 NEW: 카드 블록으로 포커스 이동 지원
          console.log('⌫ Moving focus to card block above');
          
          // 1단계: 즉시 카드 블록에 포커스 이동
          prevBlock.ref.current?.focus();
          setFocusedIndex(index - 1);
          
          // 2단계: 커서를 카드 내용의 끝으로 이동
          setTimeout(() => {
            if (prevBlock.ref.current?.setSelection) {
              const cardTextLength = prevBlock.content.length;
              prevBlock.ref.current.setSelection(cardTextLength, cardTextLength);
            }
          }, 10);
          
          // 3단계: 현재 빈 블록 제거 (포커스 안정 후)
          setTimeout(() => {
            setBlocks(prev => prev.filter((_, i) => i !== index));
            console.log('✅ Empty block removed after focusing card');
          }, 20);
        }
      }
    }
  }, [blocks, setBlocks, setFocusedIndex, keyboardVisible, keyboardHeight, scrollToFocusedInput]);

  const handleTextChange = useCallback((id, text) => {
    // 🚨 FIX: 편집 시작 플래그 설정 - 서버 데이터 덮어쓰기 방지
    setIsActivelyEditing?.(true);
    
    // Notion 방식: 단일 라인 블록이므로 \n 분리 로직 불필요
    console.log('✏️ Text changed in block:', id, 'New text:', text.substring(0, 20));
    console.log('🎨 Current activeFormats during text change:', activeFormats);
    
    setBlocks(prev => {
      const updated = prev.map(block => {
        if (block.id === id) {
          return { 
            ...block, 
            content: text,
            // ✅ FIX: 텍스트 변경 시 즉시 포맷 저장 (Enter 키 없이도 적용)
            savedFormats: activeFormats && Object.keys(activeFormats).length > 0 ? { ...activeFormats } : block.savedFormats
          };
        }
        return block;
      });
      // console.log('🔄 Blocks updated, total blocks:', updated.length); // 로그 간소화
      return updated;
    });
  }, [setBlocks, activeFormats]);

  // Enhanced auto-save with different delays for title vs content
  useEffect(() => {
    if (!isAuthor || loadingNote || !noteId || !updateNote || typeof updateNote !== 'function') {
      console.log('🚫 Auto-save skipped:', {
        isAuthor,
        loadingNote,
        noteId,
        updateNoteExists: !!updateNote,
        updateNoteType: typeof updateNote
      });
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
        
        // 🚨 FIX: 자동 저장 완료 후 편집 중 플래그 해제
        // 약간의 지연 후 해제하여 서버 응답 처리 시간 확보
        setTimeout(() => {
          setIsActivelyEditing?.(false);
        }, 500);
      } catch (error) {
        console.error('❌ Auto-save ERROR:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        // 에러 발생 시에도 편집 중 플래그 해제
        setTimeout(() => {
          setIsActivelyEditing?.(false);
        }, 500);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [title, blocks, isAuthor, noteId, loadingNote, setIsActivelyEditing]);

  return {
    handleAddCard,
    handleAddImage,
    handleDeleteBlock,
    handleKeyPress,
    handleTextChange
  };
};