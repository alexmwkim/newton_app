# 조건부 자동 스크롤 시스템 가이드

## 📋 개요

Newton 앱에서 사용자의 입력 방식에 따라 자동 스크롤을 선택적으로 활성화/비활성화하는 시스템입니다.
**사용자가 직접 화면을 터치한 경우**와 **플러스 버튼에서 드롭다운 닫기를 통한 키보드 복원**을 구분하여 처리합니다.

## 🎯 요구사항

### 상황별 자동 스크롤 동작
1. **사용자가 직접 화면 클릭** → TextInput 포커스 → **오토스크롤 필요** (키보드+툴바 공간 확보)
2. **플러스 버튼 클릭 후 드롭다운 닫기** → 키보드 refocus → **오토스크롤 불필요** (화면 고정)

## 🏗️ 시스템 구조

### 주요 컴포넌트
- **NoteDetailScreen**: 조건부 자동 스크롤 제어 로직
- **SimpleToolbarContext**: 드롭다운 상태 관리
- **NoteBlockRenderer**: 사용자 직접 터치 감지
- **KeyboardAwareScrollView**: 조건부 자동 스크롤 실행

## 🔧 핵심 구현

### 1. 드롭다운 Refocus 추적 상태

```javascript
// NoteDetailScreen.js
const [isRefocusFromDropdown, setIsRefocusFromDropdown] = useState(false);
```

#### 상태 관리:
- `true`: 드롭다운에서 온 refocus (자동 스크롤 비활성화)
- `false`: 사용자 직접 터치 (자동 스크롤 활성화)

### 2. 드롭다운 Refocus 함수 (`refocusCurrentInput`)

```javascript
// NoteDetailScreen.js
const refocusCurrentInput = useCallback(() => {
  console.log('🎯 DROPDOWN REFOCUS: No auto-scroll needed');
  
  // 🔧 드롭다운에서 온 refocus 표시 (자동 스크롤 방지용)
  setIsRefocusFromDropdown(true);
  
  const retryFocus = (attempt = 1) => {
    // ... refocus 로직 ...
    
    if (block.ref?.current) {
      block.ref.current.focus();
      const blockIndex = currentBlocks.indexOf(block);
      setFocusedIndex(blockIndex);
      
      // 🔧 드롭다운 refocus 완료 후 플래그 초기화
      setTimeout(() => {
        setIsRefocusFromDropdown(false);
        console.log('🎯 Dropdown refocus flag cleared');
      }, 500); // 키보드 애니메이션 완료 후
      
      return;
    }
  };
  
  retryFocus(1);
}, []);
```

#### 동작 순서:
1. **플래그 설정**: `setIsRefocusFromDropdown(true)`
2. **TextInput 포커스**: 드롭다운 닫기 후 키보드 복원
3. **플래그 초기화**: 500ms 후 `setIsRefocusFromDropdown(false)`

### 3. 사용자 직접 터치 감지

#### Title Input (NoteDetailScreen.js):
```javascript
onFocus={() => {
  console.log('🎯 Title input focused - user direct interaction');
  dismissMenus();
  setFocusedIndex(-1);
  // 🔧 사용자 직접 포커스 시 드롭다운 플래그 초기화
  setIsRefocusFromDropdown(false);
}}
```

#### TextInput Blocks (NoteBlockRenderer.js):
```javascript
onPressIn={() => {
  console.log('🎯 TextInput pressed - user direct interaction');
  dismissMenus();
  // 🔧 사용자 직접 터치 시 드롭다운 플래그 초기화
  setIsRefocusFromDropdown(false);
  console.log('🔧 Dropdown refocus flag cleared by user interaction');
}}
```

### 4. 조건부 KeyboardAwareScrollView 설정

```javascript
// NoteDetailScreen.js
<KeyboardAwareScrollView
  // 🔧 조건부 자동 스크롤 - 드롭다운 refocus 시에만 비활성화
  enableAutomaticScroll={!isRefocusFromDropdown}
  enableResetScrollToCoords={false}
  extraScrollHeight={isRefocusFromDropdown ? 0 : Math.max(80, keyboardHeightValue * 0.3)}
  extraHeight={isRefocusFromDropdown ? 0 : 48}
  keyboardVerticalOffset={0}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="none"
  enableOnAndroid={!isRefocusFromDropdown}
  // ... 기타 설정
/>
```

#### 조건별 설정:
- **`isRefocusFromDropdown = true`** (드롭다운 refocus):
  - `enableAutomaticScroll: false`
  - `extraScrollHeight: 0`
  - `extraHeight: 0`
  - `enableOnAndroid: false`

- **`isRefocusFromDropdown = false`** (사용자 직접 터치):
  - `enableAutomaticScroll: true`
  - `extraScrollHeight: Math.max(80, keyboardHeightValue * 0.3)`
  - `extraHeight: 48`
  - `enableOnAndroid: true`

## 🎬 상태 전환 흐름

### Case 1: 사용자 직접 화면 클릭
```
1. 사용자가 TextInput 터치
2. onPressIn → setIsRefocusFromDropdown(false)
3. onFocus → setIsRefocusFromDropdown(false) (추가 보장)
4. KeyboardAwareScrollView → enableAutomaticScroll=true
5. 키보드 올라옴 + 자동 스크롤 실행
6. TextInput이 키보드+툴바 위에 보이도록 화면 조정
```

### Case 2: 플러스 버튼 → 드롭다운 닫기
```
1. 플러스 버튼 클릭 → 드롭다운 활성화
2. 드롭다운 닫기 버튼 클릭
3. hideDropdown → refocusCurrentInput 호출
4. setIsRefocusFromDropdown(true)
5. TextInput.focus() 실행
6. KeyboardAwareScrollView → enableAutomaticScroll=false
7. 키보드 올라옴 + 자동 스크롤 비활성화 (화면 고정)
8. 500ms 후 → setIsRefocusFromDropdown(false) (상태 초기화)
```

## 🔍 디버깅 로그

### 주요 로그 포인트:
```javascript
// 드롭다운 refocus 시작
console.log('🎯 DROPDOWN REFOCUS: No auto-scroll needed');

// 사용자 직접 터치
console.log('🎯 TextInput pressed - user direct interaction');
console.log('🔧 Dropdown refocus flag cleared by user interaction');

// KeyboardAwareScrollView 설정 확인
console.log('📍 KeyboardAware Config:', {
  isRefocusFromDropdown,
  enableAutomaticScroll: !isRefocusFromDropdown,
  extraScrollHeight: isRefocusFromDropdown ? 0 : Math.max(80, keyboardHeightValue * 0.3),
  extraHeight: isRefocusFromDropdown ? 0 : 48
});

// 플래그 초기화 확인
console.log('🎯 Dropdown refocus flag cleared');
```

### 정상 동작 로그 예시:

#### 사용자 직접 클릭:
```
🎯 TextInput pressed - user direct interaction
🔧 Dropdown refocus flag cleared by user interaction
🎯 TextInput focused - user direct interaction
📍 KeyboardAware Config: { isRefocusFromDropdown: false, enableAutomaticScroll: true, extraScrollHeight: 87.3, extraHeight: 48 }
```

#### 드롭다운 refocus:
```
🎯 DROPDOWN REFOCUS: No auto-scroll needed
🎯 Refocus attempt 1/5
🎯 SUCCESS: Block 2 ref is valid, focusing now
📍 KeyboardAware Config: { isRefocusFromDropdown: true, enableAutomaticScroll: false, extraScrollHeight: 0, extraHeight: 0 }
🎯 Dropdown refocus flag cleared
```

## ⚡ Props 전달 구조

### NoteDetailScreen → NoteBlockRenderer:
```javascript
<NoteBlockRenderer
  // ... 기타 props
  setIsRefocusFromDropdown={setIsRefocusFromDropdown} // 플래그 초기화 함수 전달
/>
```

### NoteBlockRenderer Props:
```javascript
const NoteBlockRenderer = React.memo(({
  // ... 기타 props
  setIsRefocusFromDropdown = () => {} // 드롭다운 플래그 초기화 함수
}) => {
```

## 🎯 핵심 특징

1. **정확한 상황 구분**: 사용자 의도에 따른 다른 UX 제공
2. **자동 플래그 초기화**: 500ms 타이머로 안전한 상태 복원
3. **이중 안전장치**: onPressIn + onFocus에서 모두 플래그 초기화
4. **실시간 디버깅**: 상세한 로그로 동작 추적 가능
5. **성능 최적화**: 불필요한 자동 스크롤 제거로 부드러운 UX

## 🛠️ 트러블슈팅

### 문제: 사용자 클릭 시 오토스크롤이 안 됨
- **원인**: `isRefocusFromDropdown`이 `true`로 남아있음
- **해결**: onPressIn에서 플래그 초기화 확인
- **확인**: 로그에서 `enableAutomaticScroll: true` 인지 체크

### 문제: 드롭다운 닫을 때 화면이 움직임
- **원인**: `isRefocusFromDropdown`이 `false`로 설정됨
- **해결**: refocusCurrentInput에서 플래그 설정 확인
- **확인**: 로그에서 `enableAutomaticScroll: false` 인지 체크

### 문제: 키보드 높이 참조 오류
- **원인**: `keyboardHeightValue`를 useSimpleToolbar에서 가져오지 못함
- **해결**: `const { keyboardHeightValue } = useSimpleToolbar();` 확인

## ✨ 사용 방법

이 시스템은 자동으로 작동하며, 별도의 설정이나 호출이 필요하지 않습니다:

1. **사용자가 화면을 터치하면** → 자동 스크롤 활성화
2. **플러스 버튼을 사용하면** → 자동 스크롤 비활성화
3. **500ms 후** → 자동으로 정상 상태로 복원

이 시스템을 통해 Newton 앱에서 상황에 맞는 최적의 키보드 UX를 제공할 수 있습니다.