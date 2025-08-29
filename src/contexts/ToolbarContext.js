/**
 * 전역 툴바 컨텍스트
 * 앱 전체에서 단일 툴바 상태 관리
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GLOBAL_TOOLBAR_ID, TOOLBAR_ACTIONS } from '../constants/Toolbar';

const ToolbarContext = createContext({
  // 기본 상태
  toolbarId: GLOBAL_TOOLBAR_ID,
  focusedScreenType: null, // 'create' | 'detail' | null
  focusedIndex: -1,
  isAuthor: false,
  
  // 액션 핸들러들
  currentHandlers: {
    handleAddCard: null,
    handleAddGrid: null, 
    handleAddImage: null,
    handleDone: null,
    // 텍스트 포맷팅 핸들러들
    handleBold: null,
    handleItalic: null,
    handleHeading1: null,
    handleHeading2: null,
    handleHeading3: null
  },
  
  // 상태 업데이트 함수들
  setFocusedContext: () => {},
  setActionHandlers: () => {},
  resetToolbar: () => {}
});

export const ToolbarProvider = ({ children }) => {
  const [focusedScreenType, setFocusedScreenType] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isAuthor, setIsAuthor] = useState(false);
  const [currentHandlers, setCurrentHandlers] = useState({
    handleAddCard: null,
    handleAddGrid: null,
    handleAddImage: null, 
    handleDone: null,
    // 텍스트 포맷팅 핸들러들
    handleBold: null,
    handleItalic: null,
    handleHeading1: null,
    handleHeading2: null,
    handleHeading3: null
  });

  // 포커스 컨텍스트 설정 (스크린에서 호출)
  const setFocusedContext = useCallback((screenType, index, authorStatus) => {
    console.log('🎯 Toolbar context updated:', { screenType, index, authorStatus });
    setFocusedScreenType(screenType);
    setFocusedIndex(index);
    setIsAuthor(authorStatus);
  }, []);

  // 액션 핸들러 등록 (스크린에서 호출)
  const setActionHandlers = useCallback((handlers) => {
    console.log('🔧 Toolbar handlers updated:', Object.keys(handlers));
    setCurrentHandlers(handlers);
  }, []);

  // 툴바 리셋
  const resetToolbar = useCallback(() => {
    console.log('🧹 Toolbar context reset');
    setFocusedScreenType(null);
    setFocusedIndex(-1);
    setIsAuthor(false);
    setCurrentHandlers({
      handleAddCard: null,
      handleAddGrid: null,
      handleAddImage: null,
      handleDone: null
    });
  }, []);

  const value = {
    // 상태
    toolbarId: GLOBAL_TOOLBAR_ID,
    focusedScreenType,
    focusedIndex,
    isAuthor,
    currentHandlers,
    
    // 함수들
    setFocusedContext,
    setActionHandlers,
    resetToolbar
  };

  return (
    <ToolbarContext.Provider value={value}>
      {children}
    </ToolbarContext.Provider>
  );
};

export const useToolbar = () => {
  const context = useContext(ToolbarContext);
  if (!context) {
    throw new Error('useToolbar must be used within ToolbarProvider');
  }
  return context;
};

export default ToolbarContext;