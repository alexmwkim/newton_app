import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, Platform, Dimensions } from 'react-native';

export const useKeyboardHandlers = (focusedIndexRef, blocksRef, scrollRef, titleInputRef) => {
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
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        const wasVisible = wasKeyboardVisible.current;
        
        // Keyboard show event
        setKeyboardVisible(true);
        setKeyboardHeight(keyboardHeight);
        wasKeyboardVisible.current = true;
        
        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // ✅ 업계 표준: 키보드가 새로 나타날 때만 자동 스크롤
        if (keyboardHeight > 100 && !wasVisible) {
          // New keyboard show - will auto-scroll
          scrollTimeoutRef.current = setTimeout(() => {
            scrollToFocusedInput(keyboardHeight, 'keyboard_show_new');
          }, 100); // 부드러운 UX를 위해 100ms로 증가
        } else {
          // Keyboard already visible - no auto-scroll needed
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
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

  // ✅ 업계 표준 최적화된 스크롤 함수
  const scrollToFocusedInput = useCallback((keyboardHeight, context = 'unknown') => {
    // 향상된 throttling (200ms)
    const currentTime = Date.now();
    if (currentTime - lastScrollTime.current < 200) {
      // Scroll throttled
      return;
    }
    lastScrollTime.current = currentTime;
    
    const focusedIndex = focusedIndexRef.current;
    
    // Optimized scroll triggered
    
    // 기본 유효성 검사
    if (!scrollRef.current || keyboardHeight <= 0) {
      // Scroll cancelled - invalid state
      return;
    }
    
    // 🎯 정밀한 스크롤 계산 - 커서가 키보드에 가려지지 않도록
    const estimatedBlockHeight = 60; // 50 → 60 (더 정확한 추정)
    const headerHeight = 180; // 150 → 180 (헤더 영역 고려)
    const estimatedPosition = focusedIndex >= 0 
      ? (focusedIndex * estimatedBlockHeight) + headerHeight
      : headerHeight;
    
    // 🎯 키보드 영역만 계산 (툴바 제거됨)
    const safetyPadding = 60; // 커서가 키보드 위에 오도록
    const totalAvoidanceHeight = keyboardHeight + safetyPadding;
    const screenHeight = Dimensions.get('window').height;
    
    // 🎯 커서를 안전 영역 상단에 배치
    const visibleScreenHeight = screenHeight - totalAvoidanceHeight;
    const targetScrollY = Math.max(0, estimatedPosition - (visibleScreenHeight * 0.3)); // 0.5 → 0.3 (상단으로 이동)
    
    // Optimized scroll calculation completed
    
    try {
      // 🎯 단일 스크롤만 수행 (백업 스크롤 제거)
      scrollRef.current.scrollTo({
        y: targetScrollY,
        animated: true
      });
      
      // Single smooth scroll completed
      
    } catch (error) {
      // Scroll failed
    }
  }, []);
  return {
    keyboardVisible,
    keyboardHeight,
    scrollToFocusedInput
  };
};