import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, Platform, Dimensions } from 'react-native';
import { TOOLBAR_HEIGHT } from '../constants/Toolbar';

export const useKeyboardHandlers = (focusedIndex, blocks, scrollRef, titleInputRef) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardScreenY, setKeyboardScreenY] = useState(0);
  const isTyping = useRef(false);
  const lastScrollTime = useRef(0);
  const preventNextScroll = useRef(false);

  // Handle keyboard events and auto-scroll
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        const screenHeight = event.endCoordinates.screenY;
        console.log('🎹 KEYBOARD SHOW - height:', keyboardHeight, 'screenY:', screenHeight);
        setKeyboardVisible(true);
        setKeyboardHeight(keyboardHeight);
        setKeyboardScreenY(event.endCoordinates.screenY);
        
        // 키보드가 나타날 때 즉시 자동 스크롤
        if (keyboardHeight > 200) { // 실제 키보드인 경우만
          setTimeout(() => {
            scrollToFocusedInput(keyboardHeight, true);
          }, 50); // 매우 빠른 반응
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        console.log('🎹 KEYBOARD HIDE - keyboard dismissed');
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        setKeyboardScreenY(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [focusedIndex, blocks]);

  // Simplified and fast auto-scroll with fallback
  const scrollToFocusedInput = useCallback((keyboardHeight, forceScroll = false) => {
    if (!scrollRef.current || focusedIndex < -1 || keyboardHeight <= 0) {
      return;
    }

    // Get the focused input element
    let targetRef = null;
    if (focusedIndex === -1) {
      targetRef = titleInputRef.current;
    } else {
      const focusedBlock = blocks[focusedIndex];
      if (!focusedBlock?.ref?.current) {
        console.log('⚠️ No ref for focused block', focusedIndex);
        return;
      }
      targetRef = focusedBlock.ref.current;
    }
    
    if (!targetRef) {
      console.log('⚠️ No target ref found');
      return;
    }
    
    // 즉시 스크롤 - 간단한 로직으로 성능 향상
    try {
      targetRef.measureInWindow((x, y, width, height) => {
        // 유효한 측정값인지 확인
        if (y <= 0 || height <= 0) {
          console.log('⚠️ Invalid measurement, retrying...');
          // 한 번 더 시도
          setTimeout(() => {
            targetRef.measureInWindow((x2, y2, width2, height2) => {
              if (y2 > 0 && height2 > 0) {
                performScroll(y2, height2, keyboardHeight);
              }
            });
          }, 50);
          return;
        }
        
        performScroll(y, height, keyboardHeight);
      });
    } catch (error) {
      console.log('⚠️ Scroll measurement error:', error);
    }
  }, [focusedIndex, blocks, scrollRef, titleInputRef]);
  
  // 실제 스크롤 수행 함수
  const performScroll = useCallback((y, height, keyboardHeight) => {
    const screenHeight = Dimensions.get('window').height;
    const visibleHeight = screenHeight - keyboardHeight - 100; // 100px 여유공간
    
    // 입력 필드의 하단이 보이는 영역을 벗어났으면 스크롤
    if (y + height > visibleHeight) {
      const scrollOffset = (y + height) - visibleHeight + 50; // 50px 추가 여유
      
      scrollRef.current?.scrollTo({
        y: scrollOffset,
        animated: true
      });
      
      console.log('✅ Fast scroll:', scrollOffset, 'inputY:', y, 'inputHeight:', height);
    } else {
      console.log('✅ Input visible, no scroll needed');
    }
  }, []);

  // Function to prevent next auto-scroll (for content size changes)
  const preventNextAutoScroll = useCallback(() => {
    preventNextScroll.current = true;
    // Auto-reset after a short delay
    setTimeout(() => {
      preventNextScroll.current = false;
    }, 500);
  }, []);

  return {
    keyboardVisible,
    keyboardHeight,
    keyboardScreenY,
    scrollToFocusedInput,
    preventNextAutoScroll
  };
};