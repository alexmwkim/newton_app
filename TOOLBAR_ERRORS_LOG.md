# 툴바 반복 오류 로그

## 🚨 반복되는 오류: "노트 열면 툴바와 키보드영역이 미리 열려있어"

### 발생 횟수: 4번

### 오류 패턴:
1. 페이지 로드 시 툴바가 이미 표시됨
2. 키보드 영역(300px 또는 키보드 높이)이 미리 차지됨
3. 사용자가 아무 인터랙션하지 않았는데도 활성화 상태

### 근본 원인 분석:

#### 1차 시도 - keyboardVisible 의존성 
```javascript
// 실패한 조건
const shouldShow = keyboardVisible && keyboardHeightValue > 0;
// 문제: keyboardHeightValue는 이전 세션에서 291로 남아있음
```

#### 2차 시도 - keyboardHeightValue만 사용
```javascript
// 실패한 조건  
const shouldShow = keyboardHeightValue > 0;
// 문제: 초기 로드시에도 291 > 0이므로 true
```

#### 3차 시도 - userHasInteracted 추가
```javascript
// 현재 조건
const shouldShow = (userHasInteracted && keyboardHeightValue > 0) || activeDropdown !== 'none';
// 문제: userHasInteracted가 제대로 초기화되지 않거나 다른 곳에서 true로 설정됨
```

### 진짜 문제:
**SimpleToolbarContext의 초기 상태가 제대로 관리되지 않고 있음**

### 영구 해결책:
1. **완전한 초기화 보장**: 컴포넌트 마운트시 모든 상태를 명시적으로 초기화
2. **상태 격리**: 이전 세션의 데이터가 영향주지 않도록 격리
3. **조건 단순화**: 복잡한 조건보다는 명확한 상태 기반 관리

### 해결 코드 (영구적):
```javascript
// SimpleToolbarContext.js 초기화 - 2025-01-29 적용됨
useEffect(() => {
  console.log('🔧 FORCE RESET: Completely resetting all toolbar states');
  setKeyboardHeightValue(0);        // ✅ 키보드 높이 완전 초기화
  setUserHasInteracted(false);      // ✅ 사용자 인터랙션 상태 초기화  
  setActiveDropdown(DROPDOWN_TYPES.NONE); // ✅ 드롭다운 상태 초기화
  setKeyboardVisible(false);        // ✅ 키보드 가시성 초기화
  setOriginalKeyboardHeight(0);     // ✅ 원본 키보드 높이 초기화
  console.log('🔧 All states reset - toolbar should be hidden on page load');
}, []); // 마운트시에만 실행

// UnifiedToolbar.js 조건
const hasInputArea = (userHasInteracted && keyboardHeightValue > 0) || activeDropdown !== DROPDOWN_TYPES.NONE;
```

### ✅ 해결됨: 2025-01-29
- 모든 상태 강제 초기화로 영구 해결
- 이제 페이지 로드시 툴바가 절대 미리 나타나지 않음

---

## 🚨 반복되는 오류 #2: "드롭다운 닫힐 때 키보드가 복원되지 않음"

### 발생 횟수: 5번 이상

### 오류 패턴:
1. 플러스 버튼 클릭 → 드롭다운 표시 (정상)
2. 플러스 버튼 다시 클릭 → 드롭다운 닫힘 (정상)
3. **키보드가 복원되지 않음** → 빈 공간만 남음
4. 사용자가 직접 텍스트 영역을 클릭해야 키보드 나타남

### 근본 원인 분석:

#### 핵심 문제: TextInput ref.current가 false
```
LOG  🎯 DEBUG: blocks ref.current: [false]
LOG  🎯 No available block found
```

#### 원인 체인:
1. `blurCurrentInput` 호출 → `setFocusedIndex(-1)`
2. 컴포넌트 리렌더링 발생
3. TextInput이 unmount/remount되면서 `ref.current` 초기화
4. `refocusCurrentInput` 호출시 유효한 ref가 없음
5. 키보드 포커스 실패

#### 시도했던 해결책들:
1. **단순 focus() 호출** - ref.current가 null이라 실패
2. **강제 focus with try/catch** - ref 자체가 없어서 실패  
3. **setTimeout 지연** - ref 복원 안됨
4. **옵셔널 체이닝** - ref가 여전히 null
5. **키보드 오버레이 방식** - 네이티브 키보드가 오버레이를 가림

### 영구 해결책:

#### 방법 1: 재시도 패턴 (현재 적용중)
```javascript
const refocusCurrentInput = useCallback(() => {
  const retryFocus = (attempt = 1) => {
    const textBlocks = blocks.filter(block => block.type === 'text');
    
    for (let i = 0; i < textBlocks.length; i++) {
      const block = textBlocks[i];
      if (block.ref?.current) {
        try {
          block.ref.current.focus();
          setFocusedIndex(blocks.indexOf(block));
          return; // 성공시 종료
        } catch (error) {
          console.log(`Focus failed:`, error);
        }
      }
    }
    
    // 실패시 재시도 (최대 5번)
    if (attempt < 5) {
      setTimeout(() => retryFocus(attempt + 1), attempt * 100);
    }
  };
  
  retryFocus(1);
}, [blocks]);
```

#### 방법 2: ref 관리 개선 (미래 고려사항)
```javascript
// blurCurrentInput에서 focusedIndex를 -1로 설정하지 않기
const blurCurrentInput = useCallback(() => {
  if (focusedIndex >= 0 && focusedIndex < blocks.length) {
    const currentBlock = blocks[focusedIndex];
    if (currentBlock?.ref?.current) {
      currentBlock.ref.current.blur();
      // setFocusedIndex(-1); // 이 줄 제거
    }
  }
  Keyboard.dismiss();
}, [focusedIndex, blocks]);
```

#### 방법 3: 다른 포커스 복원 방식
```javascript
// 첫 번째 텍스트 입력을 강제로 터치 이벤트로 활성화
const simulateTextInputTouch = () => {
  // 텍스트 입력 영역에 프로그래매틱 터치 이벤트 발생
};
```

### 임시 워크어라운드:
사용자에게 "텍스트 영역을 터치하여 입력 계속하기" 안내 표시

### 테스트 케이스:
1. 키보드 활성화 → 플러스 클릭 → 드롭다운 확인
2. 플러스 다시 클릭 → 드롭다운 닫힘 → 키보드 즉시 복원 확인
3. 여러 번 반복하여 안정성 확인

### 🚨 이 오류가 다시 발생하면:
1. TOOLBAR_ERRORS_LOG.md 확인
2. 재시도 패턴이 적용되어 있는지 확인
3. ref.current 상태 로그 확인
4. 필요시 방법 2 또는 3 적용