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
        console.log('🎹 Keyboard event details:', {
          keyboardHeight,
          screenHeight,
          screenY: event.endCoordinates.screenY,
          endCoordinates: event.endCoordinates
        });
        setKeyboardVisible(true);
        setKeyboardHeight(keyboardHeight);
        setKeyboardScreenY(event.endCoordinates.screenY);
        
        // 키보드가 나타날 때 자동 스크롤 (InputAccessoryView와 함께)
        if (keyboardHeight > 200) { // 실제 키보드인 경우만
          setTimeout(() => {
            console.log('🎹 Keyboard detected, triggering auto-scroll...');
            scrollToFocusedInput(keyboardHeight, true);
          }, Platform.OS === 'ios' ? 200 : 300); // iOS는 더 빨리 반응
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        console.log('🎹 Keyboard hidden');
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

  // Auto-scroll for InputAccessoryView compatibility
  const scrollToFocusedInput = useCallback((keyboardHeight, forceScroll = false) => {
    console.log('📜 scrollToFocusedInput called with keyboard height:', keyboardHeight);
    
    if (!scrollRef.current || focusedIndex < -1 || keyboardHeight <= 0) {
      console.log('📜 Scroll conditions not met, skipping');
      return;
    }

    // InputAccessoryView를 고려한 간단한 자동 스크롤 (전역 상수 사용)
    const toolbarHeight = TOOLBAR_HEIGHT;
    const extraPadding = 20;
    
    // Get the focused input element
    let targetRef = null;
    if (focusedIndex === -1) {
      targetRef = titleInputRef.current;
      console.log('📜 Target: Title input');
    } else {
      const focusedBlock = blocks[focusedIndex];
      if (!focusedBlock?.ref?.current) {
        console.log('📜 No focused block ref found');
        return;
      }
      targetRef = focusedBlock.ref.current;
      console.log('📜 Target: Block', focusedIndex, 'type:', focusedBlock.type);
    }
    
    if (!targetRef) {
      console.log('📜 No target ref found');
      return;
    }
    
    // 간단한 측정과 스크롤
    setTimeout(() => {
      targetRef.measureInWindow((x, y, width, height) => {
        const screenHeight = Dimensions.get('window').height;
        const totalOccupiedHeight = keyboardHeight + toolbarHeight + extraPadding;
        const availableHeight = screenHeight - totalOccupiedHeight;
        
        console.log('📐 Simple scroll calculation:', {
          screenHeight,
          keyboardHeight,
          toolbarHeight,
          totalOccupiedHeight,
          availableHeight,
          inputY: y,
          inputBottom: y + height
        });
        
        // 입력 필드가 키보드+툴바 영역에 가려지는지 확인
        if (y + height > availableHeight) {
          const scrollOffset = (y + height) - availableHeight + extraPadding;
          
          scrollRef.current.scrollTo({
            y: scrollOffset,
            animated: true
          });
          
          console.log('✅ Scrolled by:', scrollOffset);
        } else {
          console.log('✅ Input is visible, no scroll needed');
        }
      });
    }, 150); // InputAccessoryView 렌더링 대기
  }, [focusedIndex, blocks, scrollRef, titleInputRef]);

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