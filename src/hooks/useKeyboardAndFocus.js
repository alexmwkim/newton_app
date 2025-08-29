import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * 키보드 및 포커스 관리 커스텀 훅
 * 키보드 이벤트와 포커스 상태를 통합적으로 관리하여 일관된 사용자 경험 제공
 */
export const useKeyboardAndFocus = ({
  blocks = [],
  setBlocks,
  focusedIndex,
  setFocusedIndex,
  scrollToFocusedInput,
  DEBUG_FOCUS = false
}) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const focusTimeoutRef = useRef(null);
  const preventNextAutoScrollRef = useRef(false);

  // ✅ 키보드 이벤트 리스너 비활성화 (중복 방지)
  // 키보드 처리는 CustomKeyboardToolbar에서 담당
  useEffect(() => {
    // 비활성화됨
    return () => {};
  }, [DEBUG_FOCUS]);

  // 자동 스크롤 방지 함수
  const preventNextAutoScroll = useCallback(() => {
    preventNextAutoScrollRef.current = true;
    DEBUG_FOCUS && console.log('🚫 Auto scroll prevented for next focus');
    
    // 일정 시간 후 자동 스크롤 방지 해제
    setTimeout(() => {
      preventNextAutoScrollRef.current = false;
      DEBUG_FOCUS && console.log('✅ Auto scroll prevention cleared');
    }, 1000);
  }, [DEBUG_FOCUS]);

  // 최적화된 포커스 핸들러
  const handleTextInputFocus = useCallback((blockIndex, blockId) => {
    DEBUG_FOCUS && console.log(`🎯 Focus handler called for block ${blockId} at index ${blockIndex}`);
    
    // 이전 타이머 정리
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }

    // 포커스 상태 업데이트
    setFocusedIndex(blockIndex);

    // 자동 스크롤이 방지되지 않은 경우에만 실행
    if (!preventNextAutoScrollRef.current && scrollToFocusedInput) {
      focusTimeoutRef.current = setTimeout(() => {
        DEBUG_FOCUS && console.log(`📜 Auto scrolling to focused input at index ${blockIndex}`);
        scrollToFocusedInput(blockIndex);
      }, 100); // KeyboardAvoidingView와의 충돌을 피하기 위한 약간의 딜레이
    } else {
      DEBUG_FOCUS && console.log(`🚫 Auto scroll skipped for index ${blockIndex}`);
    }
  }, [setFocusedIndex, scrollToFocusedInput, DEBUG_FOCUS]);

  // 키보드 해제 함수
  const dismissKeyboard = useCallback(() => {
    DEBUG_FOCUS && console.log('⌨️ Dismissing keyboard');
    Keyboard.dismiss();
  }, [DEBUG_FOCUS]);

  // 다음 블록으로 포커스 이동
  const focusNextBlock = useCallback((currentIndex) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < blocks.length && blocks[nextIndex]?.ref?.current) {
      DEBUG_FOCUS && console.log(`➡️ Moving focus from ${currentIndex} to ${nextIndex}`);
      
      // 자동 스크롤 방지 설정
      preventNextAutoScroll();
      
      // 포커스 이동
      blocks[nextIndex].ref.current.focus();
      setFocusedIndex(nextIndex);
    }
  }, [blocks, setFocusedIndex, preventNextAutoScroll, DEBUG_FOCUS]);

  // 이전 블록으로 포커스 이동
  const focusPreviousBlock = useCallback((currentIndex) => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0 && blocks[prevIndex]?.ref?.current) {
      DEBUG_FOCUS && console.log(`⬅️ Moving focus from ${currentIndex} to ${prevIndex}`);
      
      // 자동 스크롤 방지 설정
      preventNextAutoScroll();
      
      // 포커스 이동
      blocks[prevIndex].ref.current.focus();
      setFocusedIndex(prevIndex);
    }
  }, [blocks, setFocusedIndex, preventNextAutoScroll, DEBUG_FOCUS]);

  // 블록 삭제 후 포커스 관리
  const handleBlockDeleteWithFocus = useCallback((deleteIndex, originalHandleDeleteBlock) => {
    DEBUG_FOCUS && console.log(`🗑️ Deleting block at index ${deleteIndex}`);
    
    // 원래 삭제 함수 실행
    originalHandleDeleteBlock(deleteIndex);
    
    // 포커스 재조정
    const newBlocks = blocks.filter((_, idx) => idx !== deleteIndex);
    
    if (newBlocks.length === 0) {
      // 모든 블록이 삭제된 경우
      setFocusedIndex(-1);
      dismissKeyboard();
    } else if (deleteIndex === focusedIndex) {
      // 현재 포커스된 블록이 삭제된 경우
      const newFocusIndex = Math.min(deleteIndex, newBlocks.length - 1);
      
      setTimeout(() => {
        if (newBlocks[newFocusIndex]?.ref?.current) {
          DEBUG_FOCUS && console.log(`🎯 Refocusing to index ${newFocusIndex} after deletion`);
          newBlocks[newFocusIndex].ref.current.focus();
          setFocusedIndex(newFocusIndex);
        }
      }, 100);
    } else if (deleteIndex < focusedIndex) {
      // 현재 포커스보다 앞의 블록이 삭제된 경우 인덱스 조정
      setFocusedIndex(focusedIndex - 1);
    }
  }, [blocks, focusedIndex, setFocusedIndex, dismissKeyboard, DEBUG_FOCUS]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  return {
    keyboardVisible,
    keyboardHeight,
    handleTextInputFocus,
    dismissKeyboard,
    preventNextAutoScroll,
    focusNextBlock,
    focusPreviousBlock,
    handleBlockDeleteWithFocus
  };
};