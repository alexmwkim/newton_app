# 드롭다운 ↔ 키보드 전환 시스템 가이드

## 📋 개요

Newton 앱에서 플러스 버튼 클릭 시 드롭다운과 키보드 간의 seamless 전환을 구현한 시스템입니다.
키보드와 드롭다운이 정확히 같은 위치에서 자연스럽게 전환되며, 툴바는 고정된 상태를 유지합니다.

## 🏗️ 시스템 구조

### 주요 컴포넌트
- **SimpleToolbarContext**: 키보드/드롭다운 상태 관리
- **UnifiedToolbar**: 고정 툴바 (플러스 버튼 포함)
- **DropdownManager**: 드롭다운 표시 관리
- **NoteDetailScreen**: 키보드 refocus 로직

## 🎯 핵심 로직

### 1. 플러스 버튼 클릭 → 드롭다운 활성화 (`showDropdown`)

```javascript
// SimpleToolbarContext.js
const showDropdown = useCallback((dropdownType) => {
  console.log('🎯 FIXED TOOLBAR: Keep toolbar position, show dropdown overlay');
  
  // 1. 드롭다운 높이를 현재 키보드 높이와 정확히 동일하게 설정
  const currentKeyboardHeight = originalKeyboardHeight || keyboardHeightValue;
  const dropdownTargetHeight = currentKeyboardHeight > 0 ? currentKeyboardHeight : 300;
  
  // 2. 즉시 드롭다운 활성화 (툴바 위치는 변경 없음)
  setActiveDropdown(dropdownType);
  setDropdownHeight(dropdownTargetHeight);
  
  // 3. 키보드만 조용히 dismiss (툴바 애니메이션 방지)
  Keyboard.dismiss();
}, [keyboardHeightValue, activeDropdown, originalKeyboardHeight]);
```

#### 동작 순서:
1. **높이 계산**: 현재 키보드 높이를 드롭다운 높이로 설정
2. **드롭다운 활성화**: 상태를 즉시 변경
3. **키보드 dismiss**: 조용히 키보드만 숨김 (툴바는 고정 유지)

### 2. 드롭다운 비활성화 → 키보드 복원 (`hideDropdown`)

```javascript
// SimpleToolbarContext.js
const hideDropdown = useCallback(() => {
  console.log('🎯 Hide dropdown and restore keyboard - toolbar stays fixed');
  
  // 1. 드롭다운 즉시 닫기 (툴바는 고정 상태 유지)
  setActiveDropdown(DROPDOWN_TYPES.NONE);
  setDropdownHeight(0);
  
  // 2. 키보드를 다시 활성화 (툴바는 이미 올바른 위치에 고정됨)
  if (activeScreenHandlers && activeScreenHandlers.refocusCurrentInput) {
    activeScreenHandlers.refocusCurrentInput();
  }
}, [activeScreenHandlers]);
```

#### 동작 순서:
1. **드롭다운 즉시 숨김**: 상태를 바로 변경
2. **키보드 refocus**: TextInput에 다시 포커스

### 3. 키보드 Refocus 로직 (`refocusCurrentInput`)

```javascript
// NoteDetailScreen.js
const refocusCurrentInput = useCallback(() => {
  const retryFocus = (attempt = 1) => {
    // 현재 블록 배열에서 최신 상태 사용
    const currentBlocks = blocksRef.current;
    const textBlocks = currentBlocks.filter(block => block.type === 'text');
    
    // 마지막 텍스트 블록부터 시도 (일반적으로 비어있고 포커스되어야 할 블록)
    for (let i = textBlocks.length - 1; i >= 0; i--) {
      const block = textBlocks[i];
      
      if (block.ref?.current) {
        // 약간의 지연을 주어 렌더링 완료를 기다림
        setTimeout(() => {
          if (block.ref?.current) {
            block.ref.current.focus();
            const blockIndex = currentBlocks.indexOf(block);
            setFocusedIndex(blockIndex);
          }
        }, 50);
        return; // 성공하면 종료
      }
    }
    
    // 재시도 로직
    if (attempt < 5) {
      setTimeout(() => retryFocus(attempt + 1), attempt * 100);
    }
  };
  
  setTimeout(() => retryFocus(1), 100);
}, []);
```

## 🎨 위치 및 스타일링

### UnifiedToolbar 위치
```javascript
// UnifiedToolbar.js
style={{
  position: 'absolute',
  bottom: inputAreaHeight, // 키보드/드롭다운 위
  left: 0,
  right: 0,
  height: 48,
  zIndex: 1000,
}}
```

### DropdownManager 위치
```javascript
// DropdownManager.js
const containerStyle = {
  position: 'absolute',
  bottom: 0, // 키보드와 동일한 위치 (화면 바닥)
  left: 0,
  right: 0,
  height: containerHeight, // 키보드와 동일한 높이
  zIndex: 1001, // 툴바보다 높게 (드롭다운이 툴바 위에 표시)
};
```

## ⚡ 키보드 이벤트 처리

### 키보드 Hide 이벤트
```javascript
// SimpleToolbarContext.js - keyboardHideListener
if (activeDropdown === DROPDOWN_TYPES.NONE) {
  // 드롭다운 없음 - 툴바와 함께 완전히 숨김
  setKeyboardHeightValue(0);
  // 툴바 애니메이션 실행
} else {
  // 드롭다운 전환 중 - 툴바 위치 완전히 고정
  // 어떤 애니메이션도 실행하지 않음
}
```

## 🔧 상태 관리

### 주요 State
- `activeDropdown`: 현재 활성화된 드롭다운 타입
- `dropdownHeight`: 드롭다운 높이 (키보드 높이와 동일하게 설정)
- `keyboardHeightValue`: 실제 키보드 높이 값
- `originalKeyboardHeight`: 원본 키보드 높이 저장
- `toolbarTranslateY`: 툴바 애니메이션 값

### 상태 전환 흐름
1. **키보드 활성화**: `keyboardVisible: true`, `keyboardHeightValue: 291`
2. **플러스 클릭**: `activeDropdown: "purpose"`, `dropdownHeight: 291`
3. **드롭다운 닫기**: `activeDropdown: "none"`, 키보드 refocus 실행

## 🎭 애니메이션 최적화

### 툴바 고정 시스템
- 드롭다운 전환 시 `toolbarTranslateY` 애니메이션 비활성화
- `keyboardHeightValue` 유지하여 툴바 위치 고정
- 키보드만 조용히 dismiss/refocus

### Z-Index 레이어링
- 배경: `zIndex: 999`
- 툴바: `zIndex: 1000`
- 드롭다운: `zIndex: 1001`

## 🔍 디버깅 로그

```javascript
// 주요 로그 포인트
console.log('🎯 Show dropdown:', dropdownType);
console.log('🎯 Current keyboard height:', currentKeyboardHeight);
console.log('🎯 Target dropdown height:', dropdownTargetHeight);
console.log('🎯 Hide dropdown and restore keyboard - toolbar stays fixed');
console.log('🎯 Refocus attempt:', attempt);
```

## ✨ 주요 특징

1. **Seamless 전환**: 키보드와 드롭다운이 정확히 같은 위치에서 전환
2. **툴바 고정**: 전환 중에도 툴바가 움직이지 않음
3. **자동 Refocus**: 드롭다운 닫을 때 TextInput에 자동 포커스
4. **높이 동기화**: 드롭다운이 키보드와 정확히 같은 높이
5. **성능 최적화**: 불필요한 애니메이션 제거

## 🎯 사용 방법

```javascript
// 드롭다운 열기
toggleDropdown(DROPDOWN_TYPES.PURPOSE);

// 드롭다운 닫기
hideDropdown();

// 직접 키보드 숨기기
hideKeyboard();
```

이 시스템을 통해 Newton 앱에서 자연스럽고 부드러운 편집 경험을 제공할 수 있습니다.