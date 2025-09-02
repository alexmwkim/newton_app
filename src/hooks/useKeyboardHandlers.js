import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, Platform, Dimensions } from 'react-native';

export const useKeyboardHandlers = (focusedIndexRef, blocksRef, scrollRef, titleInputRef, cardLayoutsRef) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const lastScrollTime = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const wasKeyboardVisible = useRef(false); // 키보드 이전 상태 추적
  
  // 로그 제거: 매번 출력하지 않음
  // console.log('🎹 useKeyboardHandlers: Initialized with simplified industry-standard approach');

  // Industry-standard keyboard event handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',  // ✅ 원래대로 복구 
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        const screenHeight = Dimensions.get('window').height;
        const screenWidth = Dimensions.get('window').width;
        const wasVisible = wasKeyboardVisible.current;
        
        // Keyboard show event with device info
        setKeyboardVisible(true);
        setKeyboardHeight(keyboardHeight);
        wasKeyboardVisible.current = true;
        
        console.log(`📍 📱 Device Info: Screen=${screenWidth}x${screenHeight}px, Keyboard=${keyboardHeight}px (${(keyboardHeight/screenHeight*100).toFixed(1)}% of screen)`);
        
        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // ✅ 업계 표준: 키보드가 새로 나타날 때만 자동 스크롤
        if (keyboardHeight > 100 && !wasVisible) {
          // New keyboard show - will auto-scroll
          scrollTimeoutRef.current = setTimeout(() => {
            scrollToFocusedInput(keyboardHeight, 'keyboard_show_new');
          }, 100); // ✅ 원래 타이밍으로 복구
        } else {
          // Keyboard already visible - no auto-scroll needed
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',  // ✅ 원래대로 복구
      () => {
        // Keyboard hide event
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        wasKeyboardVisible.current = false; // 키보드 상태 리셋
        
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // ✅ 업계 표준: KeyboardAwareScrollView가 자동 처리하므로 수동 스크롤 제거
  const scrollToFocusedInput = useCallback(() => {
    console.log('📍 ✅ Auto-scroll handled by KeyboardAwareScrollView (industry standard)');
    // KeyboardAwareScrollView automatically scrolls to focused TextInput
    // No manual calculations needed!
  }, []);
  return {
    keyboardVisible,
    keyboardHeight,
    scrollToFocusedInput
  };
};