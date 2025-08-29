import React, { createContext, useContext, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Keyboard, Animated, Platform } from 'react-native';

const SimpleToolbarContext = createContext();

export const SimpleToolbarProvider = ({ children }) => {
  const [activeScreenHandlers, setActiveScreenHandlers] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  // ✅ 키보드 상태 관리 복원 + 애니메이션
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const keyboardHeight = useRef(new Animated.Value(0)).current; // 키보드 높이
  const toolbarTranslateY = useRef(new Animated.Value(100)).current; // 툴바는 처음에 화면 아래에 숨김
  const [keyboardHeightValue, setKeyboardHeightValue] = useState(0); // 실제 높이 값 저장

  useEffect(() => {
    // iOS에서는 keyboardWillShow/Hide를 사용하여 키보드와 동시에 애니메이션
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardShowListener = Keyboard.addListener(showEvent, (event) => {
      console.log('⌨️ 키보드와 툴바 함께 올라감 - 높이:', event.endCoordinates.height);
      const finalHeight = event.endCoordinates.height;
      const duration = event.duration || 250; // iOS 기본 애니메이션 시간
      
      setKeyboardVisible(true);
      setKeyboardHeightValue(finalHeight);
      
      // 키보드와 툴바를 동시에 애니메이션 (병렬 실행)
      Animated.parallel([
        // 키보드 높이 추적
        Animated.timing(keyboardHeight, {
          toValue: finalHeight,
          duration: duration,
          useNativeDriver: false,
        }),
        // 툴바를 아래에서 위로 올림 (transform 사용)
        Animated.timing(toolbarTranslateY, {
          toValue: 0, // 원래 위치로 올라옴
          duration: duration,
          useNativeDriver: true, // transform은 native driver 사용 가능
        })
      ]).start();
    });
    
    const keyboardHideListener = Keyboard.addListener(hideEvent, (event) => {
      console.log('⌨️ 키보드와 툴바 함께 내려감');
      const duration = event?.duration || 250;
      
      setKeyboardVisible(false);
      setKeyboardHeightValue(0);
      
      // 키보드와 툴바를 동시에 아래로 내림
      Animated.parallel([
        // 키보드 높이 0으로
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: duration,
          useNativeDriver: false,
        }),
        // 툴바를 아래로 밀어냄 (화면 밖으로)
        Animated.timing(toolbarTranslateY, {
          toValue: 100, // 화면 아래로 숨김
          duration: duration,
          useNativeDriver: true,
        })
      ]).start();
    });

    return () => {
      keyboardHideListener?.remove();
      keyboardShowListener?.remove();
    };
  }, []);

  // Done 버튼만을 위한 키보드 숨김 (자연스러운 흐름 방해 안함)
  const hideKeyboard = useCallback(() => {
    Keyboard.dismiss();
    setFocusedIndex(-1);
  }, []);

  // ✅ Context 값 최적화 - 불필요한 리렌더링 방지
  const contextValue = useMemo(() => ({
    activeScreenHandlers,
    setActiveScreenHandlers,
    focusedIndex,
    setFocusedIndex,
    keyboardVisible,
    keyboardHeight, // Animated 값
    keyboardHeightValue, // 실제 높이 값
    toolbarTranslateY, // 툴바 transform 애니메이션 값
    hideKeyboard
  }), [
    activeScreenHandlers,
    focusedIndex,
    keyboardVisible,
    keyboardHeight,
    keyboardHeightValue,
    toolbarTranslateY,
    hideKeyboard
  ]);

  return (
    <SimpleToolbarContext.Provider value={contextValue}>
      {children}
    </SimpleToolbarContext.Provider>
  );
};

export const useSimpleToolbar = () => {
  const context = useContext(SimpleToolbarContext);
  if (!context) {
    throw new Error('useSimpleToolbar must be used within SimpleToolbarProvider');
  }
  return context;
};