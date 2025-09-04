import React, { createContext, useContext, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Keyboard, Animated, Platform } from 'react-native';
import { DROPDOWN_TYPES } from '../constants/DropdownConfig';

const SimpleToolbarContext = createContext();

export const SimpleToolbarProvider = ({ children }) => {
  // 🔧 로그 비활성화 - 무한 출력 방지
  // console.log('🚨🚨🚨 CRITICAL: SimpleToolbarProvider is rendering - THIS SHOULD SHOW UP');
  // console.log('🚨🚨🚨 If this log does not appear, Context is not being used');
  const [activeScreenHandlers, setActiveScreenHandlers] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  // ✅ 키보드 상태 관리 복원 + 애니메이션
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const keyboardHeight = useRef(new Animated.Value(0)).current; // 키보드 높이
  const toolbarTranslateY = useRef(new Animated.Value(100)).current; // 툴바는 처음에 화면 아래에 숨김
  const [keyboardHeightValue, setKeyboardHeightValue] = useState(0);
  const [originalKeyboardHeight, setOriginalKeyboardHeight] = useState(0); // 원래 키보드 높이 기억
  const [userHasInteracted, setUserHasInteracted] = useState(false); // 사용자가 실제로 키보드를 활성화했는지 추적
  
  // 🎯 드롭다운 상태 관리 추가 - DROPDOWN_TYPES.NONE으로 초기화
  const [activeDropdown, setActiveDropdown] = useState(DROPDOWN_TYPES.NONE);
  const [dropdownHeight, setDropdownHeight] = useState(0); // 드롭다운 전용 높이
  
  // 🔧 로그 비활성화 - 무한 출력 방지
  // console.log('🔧 SimpleToolbarContext: activeDropdown state:', activeDropdown);
  // console.log('🔧 DROPDOWN_TYPES.NONE:', DROPDOWN_TYPES.NONE);
  
  // 🚧 영구 해결책 - 모든 상태 완전 초기화 (반복 오류 방지)
  useEffect(() => {
    console.log('🔧 FORCE RESET: Completely resetting all toolbar states');
    setKeyboardHeightValue(0);        // ✅ 키보드 높이 완전 초기화
    console.log('🔧 Setting userHasInteracted to FALSE - initial reset');
    setUserHasInteracted(false);      // ✅ 사용자 인터랙션 상태 초기화  
    setActiveDropdown(DROPDOWN_TYPES.NONE); // ✅ 드롭다운 상태 초기화
    setKeyboardVisible(false);        // ✅ 키보드 가시성 초기화
    setOriginalKeyboardHeight(0);     // ✅ 원본 키보드 높이 초기화
    console.log('🔧 All states reset - userHasInteracted should be FALSE now');
  }, []);

  useEffect(() => {
    // iOS에서는 keyboardWillShow/Hide를 사용하여 키보드와 동시에 애니메이션
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardShowListener = Keyboard.addListener(showEvent, (event) => {
      console.log('⌨️ 사용자가 키보드를 활성화함 - 높이:', event.endCoordinates.height);
      const finalHeight = event.endCoordinates.height;
      const duration = event.duration || 250; // iOS 기본 애니메이션 시간
      
      setKeyboardVisible(true);
      setKeyboardHeightValue(finalHeight);
      setOriginalKeyboardHeight(finalHeight); // 원래 키보드 높이 저장
      console.log('🔧 Setting userHasInteracted to TRUE - keyboard show event');
      setUserHasInteracted(true); // ✅ 사용자 인터랙션 기록
      
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
      console.log('⌨️ 키보드 내려감 - 드롭다운 상태:', activeDropdown);
      const duration = event?.duration || 250;
      
      setKeyboardVisible(false);
      
      // 드롭다운이 활성화되어 있지 않을 때만 완전히 숨김
      if (activeDropdown === DROPDOWN_TYPES.NONE) {
        console.log('⌨️ 드롭다운 없음 - 툴바와 함께 완전히 숨김');
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
      } else {
        console.log('⌨️ 드롭다운 전환 중 - 툴바 위치 완전히 고정');
        // 드롭다운 전환 시에는 keyboardHeightValue와 툴바 위치를 모두 유지
        // 키보드만 조용히 사라지고, 툴바는 제자리에 고정
        console.log('⌨️ 툴바 고정 유지 - 드롭다운 전환용 키보드 dismiss');
        // 어떤 애니메이션도 실행하지 않음 - 툴바 완전 고정
      }
    });

    return () => {
      keyboardHideListener?.remove();
      keyboardShowListener?.remove();
    };
  }, [activeDropdown]); // activeDropdown 의존성 추가

  // Done 버튼만을 위한 키보드 숨김 (자연스러운 흐름 방해 안함)
  const hideKeyboard = useCallback(() => {
    console.log('🎯 hideKeyboard called - will close dropdown too');
    Keyboard.dismiss();
    setFocusedIndex(-1);
    // 드롭다운도 함께 닫기
    setActiveDropdown(DROPDOWN_TYPES.NONE);
  }, []);

  // 🎯 드롭다운 관리 함수들 - 툴바 고정하며 드롭다운만 전환
  const showDropdown = useCallback((dropdownType) => {
    console.log('🎯 FIXED TOOLBAR: Keep toolbar position, show dropdown overlay');
    console.log('🎯 Show dropdown:', dropdownType, '- current state:', activeDropdown);
    
    // 1. 드롭다운 높이를 현재 키보드 높이와 정확히 동일하게 설정
    const currentKeyboardHeight = originalKeyboardHeight || keyboardHeightValue;
    const dropdownTargetHeight = currentKeyboardHeight > 0 ? currentKeyboardHeight : 300;
    
    console.log('🎯 Current keyboard height:', currentKeyboardHeight);
    console.log('🎯 Target dropdown height:', dropdownTargetHeight);
    
    // 2. 즉시 드롭다운 활성화 (툴바 위치는 변경 없음)
    setActiveDropdown(dropdownType);
    setDropdownHeight(dropdownTargetHeight);
    
    // 3. 키보드만 조용히 dismiss (툴바 애니메이션 방지)
    console.log('🎯 Silent keyboard dismiss - toolbar stays fixed');
    Keyboard.dismiss();
  }, [keyboardHeightValue, activeDropdown, originalKeyboardHeight]);

  const hideDropdown = useCallback(() => {
    console.log('🎯 Hide dropdown and restore keyboard seamlessly');
    
    // 1. 키보드를 먼저 즉시 활성화 (드롭다운과 동시에)
    console.log('🎯 Immediate keyboard focus - no delay');
    if (activeScreenHandlers && activeScreenHandlers.refocusCurrentInput) {
      // 키보드 즉시 복원 (지연 없음)
      activeScreenHandlers.refocusCurrentInput();
    }
    
    // 2. 드롭다운 동시에 닫기 (키보드와 함께)
    setActiveDropdown(DROPDOWN_TYPES.NONE);
    setDropdownHeight(0);
    console.log('🎯 Dropdown hidden with immediate keyboard restore');
  }, [activeScreenHandlers]);

  const toggleDropdown = useCallback((dropdownType) => {
    console.log('🎯 Toggle dropdown:', dropdownType, 'current:', activeDropdown);
    console.log('🎯 DROPDOWN_TYPES.NONE:', DROPDOWN_TYPES.NONE);
    console.log('🎯 Are they equal?', activeDropdown === DROPDOWN_TYPES.NONE);
    
    if (activeDropdown === dropdownType) {
      // 이미 활성화된 드롭다운이면 닫기
      console.log('🎯 Same dropdown - closing');
      hideDropdown();
    } else {
      // 다른 드롭다운이거나 닫혀있으면 열기
      console.log('🎯 Different/closed dropdown - opening');
      showDropdown(dropdownType);
    }
  }, [activeDropdown, showDropdown, hideDropdown]);

  // ✅ Context 값 최적화 - 불필요한 리렌더링 방지
  const contextValue = useMemo(() => ({
    // 기존 상태
    activeScreenHandlers,
    setActiveScreenHandlers,
    focusedIndex,
    setFocusedIndex,
    keyboardVisible,
    keyboardHeight, // Animated 값
    keyboardHeightValue, // 실제 높이 값 (툴바 위치용)
    toolbarTranslateY, // 툴바 transform 애니메이션 값
    hideKeyboard,
    userHasInteracted, // ✅ 사용자 인터랙션 상태
    
    // 🎯 드롭다운 상태 및 함수
    activeDropdown,
    dropdownHeight, // 드롭다운 전용 높이
    showDropdown,
    hideDropdown,
    toggleDropdown
  }), [
    activeScreenHandlers,
    focusedIndex,
    keyboardVisible,
    keyboardHeightValue,
    hideKeyboard,
    userHasInteracted,
    activeDropdown,
    dropdownHeight,
    showDropdown,
    hideDropdown,
    toggleDropdown
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