import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { PurposeDropdown } from './PurposeDropdown';
import { DROPDOWN_TYPES } from '../../../constants/DropdownConfig';
import { useSimpleToolbar } from '../../../contexts/SimpleToolbarContext';

// 🎛️ 드롭다운 매니저 - 키보드 영역을 대체하는 컨테이너
export const DropdownManager = ({ 
  activeDropdown, 
  onCloseDropdown,
  onPurposeSelect // 목적 선택 콜백 추가
}) => {
  const { dropdownHeight, keyboardHeightValue } = useSimpleToolbar();
  const animationValue = useRef(new Animated.Value(0)).current;

  // 드롭다운 표시/숨김 - 자연스러운 fade 애니메이션
  useEffect(() => {
    if (activeDropdown !== DROPDOWN_TYPES.NONE) {
      console.log('🎯 DropdownManager: Fade in dropdown');
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      console.log('🎯 DropdownManager: Fade out dropdown (revealing keyboard behind)');
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 200, // 조금 더 느린 fade-out으로 자연스러운 전환
        useNativeDriver: true,
      }).start();
    }
  }, [activeDropdown, animationValue]);

  // 목적별 노트 선택 핸들러
  const handlePurposeSelect = ({ purpose, template }) => {
    console.log('🎯 Purpose selected:', purpose.id);
    console.log('📝 Template:', template.title);
    
    // 상위 컴포넌트로 선택 정보 전달
    if (onPurposeSelect) {
      onPurposeSelect({ purpose, template });
    }
    
    // 드롭다운 닫기
    if (onCloseDropdown) {
      onCloseDropdown();
    }
  };

  // 현재 활성화된 드롭다운에 따라 컴포넌트 렌더링
  const renderActiveDropdown = () => {
    switch (activeDropdown) {
      case DROPDOWN_TYPES.PURPOSE:
        return (
          <PurposeDropdown
            onSelectPurpose={handlePurposeSelect}
            onClose={onCloseDropdown}
            animationValue={animationValue}
          />
        );
        
      default:
        return null;
    }
  };

  // 🔧 디버깅용 로그 활성화
  console.log('🎯 DropdownManager render:', {
    activeDropdown,
    'is PURPOSE': activeDropdown === DROPDOWN_TYPES.PURPOSE,
    'is NONE': activeDropdown === DROPDOWN_TYPES.NONE,
    dropdownHeight
  });

  // 드롭다운이 활성화되지 않은 경우 렌더링하지 않음
  if (activeDropdown === DROPDOWN_TYPES.NONE) {
    console.log('🎯 DropdownManager: returning null (NONE)');
    return null;
  }
  
  // 드롭다운 높이 = dropdownHeight 사용 (keyboardHeightValue가 0일 수 있음)
  const containerHeight = dropdownHeight || 300; // dropdownHeight 우선, 폴백으로 300
  
  console.log('🎯 DropdownManager: rendering dropdown with height:', containerHeight, '(dropdownHeight:', dropdownHeight, ', keyboardHeightValue:', keyboardHeightValue, ')');
  
  // 🔧 드롭다운을 키보드와 정확히 동일한 위치에 설정
  const containerStyle = {
    position: 'absolute',
    bottom: 0, // 키보드와 동일한 위치 (화면 바닥)
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF', // 흰색 배경
    height: containerHeight, // 키보드와 동일한 높이
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    zIndex: 1001, // 툴바보다 높게 (드롭다운이 툴바 위에 표시)
    elevation: 10, // Android 적절한 레이어
  };

  return (
    <Animated.View 
      style={[
        containerStyle,
        {
          opacity: animationValue, // fade in/out 애니메이션만 사용
          // transform 제거 - 키보드가 뒤에 있던 것처럼 보이도록
        }
      ]}
    >
      {renderActiveDropdown()}
    </Animated.View>
  );
};