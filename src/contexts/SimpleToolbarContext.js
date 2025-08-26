import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Keyboard } from 'react-native';

const SimpleToolbarContext = createContext();

export const SimpleToolbarProvider = ({ children }) => {
  const [activeScreenHandlers, setActiveScreenHandlers] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 키보드 높이와 상태 실시간 추적
  useEffect(() => {
    const keyboardWillShow = (event) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardWillHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    const showListener = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
    const hideListener = Keyboard.addListener('keyboardWillHide', keyboardWillHide);

    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }, []);

  // Done 버튼만을 위한 키보드 숨김 (자연스러운 흐름 방해 안함)
  const hideKeyboard = () => {
    Keyboard.dismiss();
    setFocusedIndex(-1);
  };

  return (
    <SimpleToolbarContext.Provider value={{
      activeScreenHandlers,
      setActiveScreenHandlers,
      focusedIndex,
      setFocusedIndex,
      keyboardVisible,
      keyboardHeight,
      hideKeyboard
    }}>
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